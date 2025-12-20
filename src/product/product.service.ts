import { Injectable, NotFoundException } from '@nestjs/common';
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
  ) {}

  async create(createDto: CreateProductDto): Promise<ProductDocument> {
    const productData: any = { ...createDto };
    
    // Convert size and color string IDs to ObjectIds
    if (createDto.sizes && createDto.sizes.length > 0) {
      productData.sizes = createDto.sizes.map(
        (id) => new Types.ObjectId(id),
      );
    }
    
    if (createDto.colors && createDto.colors.length > 0) {
      productData.colors = createDto.colors.map(
        (id) => new Types.ObjectId(id),
      );
    }
    
    // Convert category and subcategory IDs to ObjectIds
    productData.categoryId = new Types.ObjectId(createDto.categoryId);
    productData.subCategoryId = new Types.ObjectId(createDto.subCategoryId);
    
    const product = new this.productModel(productData);
    return product.save();
  }

  async findAll(
    filterDto: FilterProductDto,
    language: Language = Language.AR,
  ) {
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

    const products = await this.productModel
      .find(query)
      .populate('sizes', 'name')
      .populate('colors', 'name hexCode')
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .exec();
    const offers = await this.offerModel.find({ isActive: true }).exec();

    return this.productFormatter.formatProducts(products, offers, language);
  }

  async findOne(
    id: string,
    language: Language = Language.AR,
    userId?: string,
  ) {
    const product = await this.productModel
      .findById(id)
      .populate('sizes', 'name')
      .populate('colors', 'name hexCode')
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

