import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { Cart, CartDocument } from '../schemas/cart.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { ProductFormatterService } from '../common/services/product-formatter.service';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private productFormatter: ProductFormatterService,
  ) { }

  async create(createDto: CreateProductDto): Promise<ProductDocument> {
    const productData: any = { ...createDto };

    // Validate and convert category/subcategory IDs
    if (!Types.ObjectId.isValid(createDto.categoryId)) {
      throw new BadRequestException('categoryId.invalid');
    }
    if (!Types.ObjectId.isValid(createDto.subCategoryId)) {
      throw new BadRequestException('subCategoryId.invalid');
    }
    productData.categoryId = new Types.ObjectId(createDto.categoryId);
    productData.subCategoryId = new Types.ObjectId(createDto.subCategoryId);

    // Convert size and color string IDs to ObjectIds (filter invalid/falsy)
    if (Array.isArray(createDto.sizes) && createDto.sizes.length > 0) {
      const validSizeIds = createDto.sizes.filter(
        (id) => typeof id === 'string' && Types.ObjectId.isValid(id),
      );
      productData.sizes = validSizeIds.map((id) => new Types.ObjectId(id));
    } else {
      productData.sizes = [];
    }

    if (Array.isArray(createDto.colors) && createDto.colors.length > 0) {
      const validColorIds = createDto.colors.filter(
        (id) => typeof id === 'string' && Types.ObjectId.isValid(id),
      );
      productData.colors = validColorIds.map((id) => new Types.ObjectId(id));
    } else {
      productData.colors = [];
    }

    // Convert variants string IDs to ObjectIds
    if (Array.isArray(createDto.variants) && createDto.variants.length > 0) {
      productData.variants = createDto.variants.map((variant) => ({
        ...variant,
        sizeId: new Types.ObjectId(variant.sizeId),
        colorId: new Types.ObjectId(variant.colorId),
        // If variant price is not provided, use the base product price
        price: (variant.price !== undefined && variant.price !== null)
          ? variant.price
          : productData.price,
      }));
    } else {
      productData.variants = [];
    }

    const product = new this.productModel(productData);
    return product.save();
  }

  async findAll(
    filterDto: FilterProductDto,
    language: Language = Language.AR,
  ) {
    const { page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    if (filterDto.categoryId && Types.ObjectId.isValid(filterDto.categoryId)) {
      query.categoryId = new Types.ObjectId(filterDto.categoryId);
    }
    if (
      filterDto.subCategoryId &&
      Types.ObjectId.isValid(filterDto.subCategoryId)
    ) {
      query.subCategoryId = new Types.ObjectId(filterDto.subCategoryId);
    }

    if (filterDto.sizes && filterDto.sizes.length > 0) {
      const validSizeIds = filterDto.sizes.filter((id) =>
        Types.ObjectId.isValid(id),
      );
      if (validSizeIds.length > 0) {
        query.sizes = {
          $in: validSizeIds.map((id) => new Types.ObjectId(id)),
        };
      }
    }

    if (filterDto.colors && filterDto.colors.length > 0) {
      const validColorIds = filterDto.colors.filter((id) =>
        Types.ObjectId.isValid(id),
      );
      if (validColorIds.length > 0) {
        query.colors = {
          $in: validColorIds.map((id) => new Types.ObjectId(id)),
        };
      }
    }

    if (filterDto.minPrice !== undefined || filterDto.maxPrice !== undefined) {
      query.price = {};
      if (filterDto.minPrice !== undefined) {
        query.price.$gte = filterDto.minPrice;
      }
      if (filterDto.maxPrice !== undefined) {
        query.price.$lte = filterDto.maxPrice;
      }
    }

    if (filterDto.search) {
      const searchRegex = new RegExp(filterDto.search, 'i');
      query.$or = [
        { 'name.en': searchRegex },
        { 'name.ar': searchRegex },
        { 'description.en': searchRegex },
        { 'description.ar': searchRegex },
      ];
    }

    const [products, totalProducts] = await Promise.all([
      this.productModel
        .find(query)
        .populate({ path: 'sizes', model: 'Size' })
        .populate({ path: 'colors', model: 'Color' })
        .populate('categoryId', 'name')
        .populate('subCategoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    const offers = await this.offerModel.find({ isActive: true }).exec();
    const formattedProducts = this.productFormatter.formatProducts(
      products,
      offers,
      language,
    );

    return {
      products: formattedProducts,
      total: totalProducts,
      page,
      limit,
      pages: Math.ceil(totalProducts / limit),
    };
  }

  async findOne(
    id: string,
    language: Language = Language.AR,
    userId?: string,
  ) {
    const product = await this.productModel
      .findById(id)
      .populate({ path: 'sizes', model: 'Size' })
      .populate({ path: 'colors', model: 'Color' })
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name');
    if (!product) {
      throw new NotFoundException('product.not_found');
    }

    const offers = await this.offerModel.find({ isActive: true }).exec();
    const formatted = this.productFormatter.formatProduct(
      product,
      offers,
      language,
    );

    // Check if product is in cart and get quantity
    let inCart = false;
    let quantity = 0;

    if (userId) {
      const cart = await this.cartModel.findOne({
        userId: new Types.ObjectId(userId),
      });
      if (cart) {
        const cartItem = cart.items.find(
          (item) => item.productId.toString() === id,
        );
        if (cartItem) {
          inCart = true;
          quantity = cartItem.quantity;
        }
      }
    }

    return {
      ...formatted,
      inCart,
      quantity,
    };
  }

  async update(id: string, updateDto: UpdateProductDto) {
    const updateData: any = { ...updateDto };

    // Convert category and subcategory IDs to ObjectIds if provided
    if (updateDto.categoryId) {
      updateData.categoryId = new Types.ObjectId(updateDto.categoryId);
    }

    if (updateDto.subCategoryId) {
      updateData.subCategoryId = new Types.ObjectId(updateDto.subCategoryId);
    }

    // Convert size and color string IDs to ObjectIds if provided
    if (updateDto.sizes && updateDto.sizes.length > 0) {
      updateData.sizes = updateDto.sizes.map(
        (sizeId) => new Types.ObjectId(sizeId),
      );
    }

    if (updateDto.colors && updateDto.colors.length > 0) {
      updateData.colors = updateDto.colors.map(
        (colorId) => new Types.ObjectId(colorId),
      );
    }

    // Convert variants string IDs to ObjectIds if provided
    if (updateDto.variants && Array.isArray(updateDto.variants)) {
      // Get the existing product to have access to its price if not being updated
      const existingProduct = await this.productModel.findById(id);
      const basePrice = updateDto.price !== undefined ? updateDto.price : (existingProduct?.price || 0);

      updateData.variants = updateDto.variants.map((variant) => ({
        ...variant,
        sizeId: new Types.ObjectId(variant.sizeId),
        colorId: new Types.ObjectId(variant.colorId),
        // If variant price is not provided, use the base product price
        price: (variant.price !== undefined && variant.price !== null)
          ? variant.price
          : basePrice,
      }));
    }

    const product = await this.productModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!product) {
      throw new NotFoundException('product.not_found');
    }
    return product;
  }

  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);
    if (!product) {
      throw new NotFoundException('product.not_found');
    }
    return { message: 'Product deleted' };
  }

  async getCategories() {
    // This method is deprecated - use /api/categories endpoint instead
    // Keeping for backward compatibility
    return [];
  }
}

