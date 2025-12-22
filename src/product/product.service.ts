import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { Cart, CartDocument } from '../schemas/cart.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { SubCategory, SubCategoryDocument } from '../schemas/subcategory.schema';
import { Size, SizeDocument } from '../schemas/size.schema';
import { Color, ColorDocument } from '../schemas/color.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { ProductFormatterService } from '../common/services/product-formatter.service';
import { Language } from '../common/enums/language.enum';
import { ProductSort } from '../common/enums/product-sort.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(SubCategory.name) private subCategoryModel: Model<SubCategoryDocument>,
    @InjectModel(Size.name) private sizeModel: Model<SizeDocument>,
    @InjectModel(Color.name) private colorModel: Model<ColorDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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

  async getFilterOptions(language: Language = Language.AR) {
    const [categories, sizes, colors, offers] = await Promise.all([
      this.categoryModel.find({ isActive: true }).exec(),
      this.sizeModel.find({ isActive: true }).exec(),
      this.colorModel.find({ isActive: true }).exec(),
      this.offerModel.find({
        isActive: true,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }).exec(),
    ]);

    // Get subcategories as well
    const subCategories = await this.subCategoryModel.find({ isActive: true }).exec();

    return {
      categories: categories.map(c => ({
        id: c._id.toString(),
        name: this.productFormatter.getLocalizedText(c.name, language),
      })),
      subCategories: subCategories.map(s => ({
        id: s._id.toString(),
        name: this.productFormatter.getLocalizedText(s.name, language),
        categoryId: s.categoryId?.toString(),
      })),
      sizes: sizes.map(s => ({
        id: s._id.toString(),
        name: s.name,
      })),
      colors: colors.map(c => ({
        id: c._id.toString(),
        name: c.name,
        hexCode: c.hexCode,
      })),
      discounts: offers.map(o => ({
        id: o._id.toString(),
        title: this.productFormatter.getLocalizedText(o.title, language),
        value: o.value,
        type: o.type,
      })),
      sortOptions: [
        {
          label: language === Language.EN ? 'New Arrivals' : 'وصل حديثاً',
          value: ProductSort.NEW_ARRIVALS,
        },
        {
          label: language === Language.EN ? 'Best Sellers' : 'الأكثر مبيعاً',
          value: ProductSort.BEST_SELLERS,
        },
        {
          label: language === Language.EN ? 'Offers' : 'العروض',
          value: ProductSort.OFFERS,
        },
        {
          label: language === Language.EN ? 'Price: Low to High' : 'السعر: من الأقل للأعلى',
          value: ProductSort.PRICE_LOW_TO_HIGH,
        },
        {
          label: language === Language.EN ? 'Price: High to Low' : 'السعر: من الأعلى للأقل',
          value: ProductSort.PRICE_HIGH_TO_LOW,
        },
      ],
    };
  }

  async findAll(
    filterDto: FilterProductDto,
    language: Language = Language.AR,
    userId?: string,
  ) {
    const { page = 1, limit = 10 } = filterDto;
    const skip = (page - 1) * limit;

    const query: any = { isActive: true };

    // 1. Categories Filter
    const catIds = [];
    if (filterDto.categoryId && Types.ObjectId.isValid(filterDto.categoryId)) {
      catIds.push(new Types.ObjectId(filterDto.categoryId));
    }
    if (filterDto.categoryIds && filterDto.categoryIds.length > 0) {
      filterDto.categoryIds.forEach(id => {
        if (Types.ObjectId.isValid(id)) catIds.push(new Types.ObjectId(id));
      });
    }
    if (catIds.length > 0) {
      query.categoryId = { $in: catIds };
    }

    // 2. SubCategories Filter
    const subCatIds = [];
    if (filterDto.subCategoryId && Types.ObjectId.isValid(filterDto.subCategoryId)) {
      subCatIds.push(new Types.ObjectId(filterDto.subCategoryId));
    }
    if (filterDto.subCategoryIds && filterDto.subCategoryIds.length > 0) {
      filterDto.subCategoryIds.forEach(id => {
        if (Types.ObjectId.isValid(id)) subCatIds.push(new Types.ObjectId(id));
      });
    }
    if (subCatIds.length > 0) {
      query.subCategoryId = { $in: subCatIds };
    }

    // 3. Sizes Filter
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

    // 4. Colors Filter
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

    // 5. Price Filter
    if (filterDto.minPrice !== undefined || filterDto.maxPrice !== undefined) {
      query.price = {};
      if (filterDto.minPrice !== undefined) {
        query.price.$gte = filterDto.minPrice;
      }
      if (filterDto.maxPrice !== undefined) {
        query.price.$lte = filterDto.maxPrice;
      }
    }

    // 6. Rating Filter
    if (filterDto.rating !== undefined) {
      query.avgRating = { $gte: filterDto.rating };
    }

    // 7. Search Filter
    if (filterDto.search) {
      const searchRegex = new RegExp(filterDto.search, 'i');
      query.$or = [
        { 'name.en': searchRegex },
        { 'name.ar': searchRegex },
        { 'description.en': searchRegex },
        { 'description.ar': searchRegex },
      ];
    }

    // 8. Offers Filter
    if (filterDto.offerIds && filterDto.offerIds.length > 0) {
      const selectedOffers = await this.offerModel.find({
        _id: { $in: filterDto.offerIds.map(id => new Types.ObjectId(id)) },
        isActive: true
      });

      const offerQueryParts = [];
      for (const offer of selectedOffers) {
        if (offer.scope === 'global') {
          // If it's global, we just need to ensure the product is active (which is already in query)
          // But to be specific to "this" offer, we might not have a direct field.
          // However, a product with a global offer means ALL products match it.
          // If user selected a specific global offer, they want to see all products matching it.
          // We can just add a dummy true match or skip adding restriction.
          // For now, let's assume global means "all products".
          continue;
        } else if (offer.scope === 'product' && offer.productId) {
          offerQueryParts.push({ _id: offer.productId });
        } else if (offer.scope === 'category' && offer.categoryId) {
          offerQueryParts.push({ categoryId: offer.categoryId });
        } else if (offer.scope === 'sub_category' && offer.subCategoryId) {
          offerQueryParts.push({ subCategoryId: offer.subCategoryId });
        }
      }

      if (offerQueryParts.length > 0) {
        // If there were specific offers (not just global), add them to query
        // If there was a global offer, then all products match, so we don't need to add anything to query.$or
        // Unless there were NO global offers, then we must match one of the specific ones.
        const hasGlobal = selectedOffers.some(o => o.scope === 'global');
        if (!hasGlobal) {
          if (query.$or) {
            // If search already added $or, we need to be careful. 
            // Let's use $and to combine them.
            const existingOr = query.$or;
            delete query.$or;
            query.$and = [{ $or: existingOr }, { $or: offerQueryParts }];
          } else {
            query.$or = offerQueryParts;
          }
        }
      }
    }

    // 9. Sorting
    let sort: any = { createdAt: -1 };
    if (filterDto.sortBy) {
      switch (filterDto.sortBy) {
        case ProductSort.NEW_ARRIVALS:
          sort = { createdAt: -1 };
          break;
        case ProductSort.BEST_SELLERS:
          sort = { salesCount: -1 };
          break;
        case ProductSort.PRICE_LOW_TO_HIGH:
          sort = { price: 1 };
          break;
        case ProductSort.PRICE_HIGH_TO_LOW:
          sort = { price: -1 };
          break;
        case ProductSort.OFFERS:
          // This is tricky as offer presence isn't a direct field.
          // For now sort by newest, but usually 'offers' sort means products with biggest discounts first.
          // We'd need an aggregation for this. Let's stick to createdAt for now or just skip.
          sort = { createdAt: -1 };
          break;
      }
    }

    const [products, totalProducts] = await Promise.all([
      this.productModel
        .find(query)
        .populate({ path: 'sizes', model: 'Size' })
        .populate({ path: 'colors', model: 'Color' })
        .populate('categoryId', 'name')
        .populate('subCategoryId', 'name')
        .sort(sort)
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

    // If userId provided, check wishlist
    let wishlistProductIds: string[] = [];
    if (userId) {
      const user = await this.userModel.findById(userId).select('wishlist').exec();
      if (user && user.wishlist) {
        wishlistProductIds = user.wishlist.map(id => id.toString());
      }
    }

    const productsWithFavourite = formattedProducts.map(p => ({
      ...p,
      inFavourite: wishlistProductIds.includes(p.id)
    }));

    return {
      products: productsWithFavourite,
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

    const result = {
      ...formatted,
      inCart,
      quantity,
      inFavourite: false,
    };

    if (userId) {
      const user = await this.userModel.findById(userId).select('wishlist').exec();
      if (user && user.wishlist) {
        result.inFavourite = user.wishlist.some(wid => wid.toString() === id);
      }
    }

    return result;
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

}

