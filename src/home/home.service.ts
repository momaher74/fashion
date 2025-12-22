import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { Banner, BannerDocument } from '../schemas/banner.schema';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Language } from '../common/enums/language.enum';
import { ProductType } from '../common/enums/product-type.enum';
import { CategoryService } from '../category/category.service';
import { BannerService } from '../banner/banner.service';
import { ProductFormatterService } from '../common/services/product-formatter.service';
import { StoriesService } from '../stories/stories.service';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class HomeService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private categoryService: CategoryService,
    private bannerService: BannerService,
    private storiesService: StoriesService,
    private productFormatter: ProductFormatterService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async getHomeData(language: Language = Language.AR, userId?: string) {
    // Get offers first as they're needed for product formatting
    const rawOffers = await this.getActiveOffers();

    // Get all other data in parallel
    const [categories, banners, stories, popularProducts, recommendedProducts] =
      await Promise.all([
        this.getMainCategories(language),
        this.getBanners(language),
        this.storiesService.findActive(language, userId),
        this.getPopularProducts(language, rawOffers, userId),
        this.getRecommendedProducts(language, userId, rawOffers),
      ]);

    // Format offers for the home response
    const formattedOffers = rawOffers.map((offer) => ({
      id: offer._id.toString(),
      title: this.productFormatter.getLocalizedText(offer.title, language),
      type: offer.type,
      value: offer.value,
      scope: offer.scope,
      productId: offer.productId?.toString(),
      categoryId: offer.categoryId?.toString(),
      subCategoryId: offer.subCategoryId?.toString(),
      endDate: offer.endDate,
      image: offer.image,
    }));

    return {
      offers: formattedOffers,
      stories,
      categories,
      banners,
      popularProducts,
      recommendedProducts,
    };
  }

  private async getMainCategories(language: Language) {
    return this.categoryService.findAll(language);
  }

  private async getBanners(language: Language) {
    return this.bannerService.getActiveBanners(language);
  }

  private async getActiveOffers() {
    const now = new Date();
    return this.offerModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .exec();
  }

  private async getPopularProducts(
    language: Language,
    offers: OfferDocument[],
    userId?: string,
  ) {
    // Get popular products (type = popular or most viewed)
    const products = await this.productModel
      .find({
        isActive: true,
        $or: [
          { type: ProductType.POPULAR },
          { views: { $gt: 0 } },
        ],
      })
      .populate({ path: 'sizes', model: 'Size' })
      .populate({ path: 'colors', model: 'Color' })
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .sort({
        views: -1,
        createdAt: -1
      })
      .limit(20)
      .exec();

    const formatted = this.productFormatter.formatProducts(products, offers, language);

    if (userId) {
      const user = await this.userModel.findById(userId).select('wishlist').exec();
      if (user && user.wishlist) {
        const wishlistIds = user.wishlist.map(id => id.toString());
        formatted.forEach(p => {
          p.inFavourite = wishlistIds.includes(p.id);
        });
      }
    }

    return formatted;
  }

  private async getRecommendedProducts(
    language: Language,
    userId?: string,
    offers: OfferDocument[] = [],
  ) {
    let recommendedProducts: ProductDocument[] = [];

    if (userId) {
      // Get user's order history to recommend based on previous purchases
      const userOrders = await this.orderModel
        .find({ userId: new Types.ObjectId(userId) })
        .limit(10)
        .exec();

      if (userOrders.length > 0) {
        // Get product IDs from user's previous orders
        const productIds = new Set<string>();
        userOrders.forEach((order) => {
          order.items.forEach((item: any) => {
            if (item.productId) {
              productIds.add(
                typeof item.productId === 'string'
                  ? item.productId
                  : item.productId.toString(),
              );
            }
          });
        });

        // Get the actual products to extract their categories
        const purchasedProducts = await this.productModel
          .find({
            _id: {
              $in: Array.from(productIds).map(
                (id) => new Types.ObjectId(id),
              ),
            },
          })
          .select('categoryId subCategoryId')
          .exec();

        const categoryIds = new Set<string>();
        const subCategoryIds = new Set<string>();
        purchasedProducts.forEach((product) => {
          if (product.categoryId) {
            categoryIds.add(product.categoryId.toString());
          }
          if (product.subCategoryId) {
            subCategoryIds.add(product.subCategoryId.toString());
          }
        });

        // Get recommended products or products from user's preferred categories
        const categoryArray = Array.from(categoryIds);
        const subCategoryArray = Array.from(subCategoryIds);

        const query: any = { isActive: true };
        if (categoryArray.length > 0 || subCategoryArray.length > 0) {
          query.$or = [];
          if (categoryArray.length > 0) {
            query.$or.push({
              categoryId: {
                $in: categoryArray.map((id) => new Types.ObjectId(id)),
              },
            });
          }
          if (subCategoryArray.length > 0) {
            query.$or.push({
              subCategoryId: {
                $in: subCategoryArray.map((id) => new Types.ObjectId(id)),
              },
            });
          }
          query.$or.push({ type: ProductType.RECOMMENDED });
        } else {
          query.type = ProductType.RECOMMENDED;
        }

        recommendedProducts = await this.productModel
          .find(query)
          .populate({ path: 'sizes', model: 'Size' })
          .populate({ path: 'colors', model: 'Color' })
          .populate('categoryId', 'name')
          .populate('subCategoryId', 'name')
          .sort({ createdAt: -1 })
          .limit(20)
          .exec();
      }
    }

    // If no user or no recommendations, get recommended type products
    if (recommendedProducts.length === 0) {
      recommendedProducts = await this.productModel
        .find({
          isActive: true,
          type: ProductType.RECOMMENDED,
        })
        .populate({ path: 'sizes', model: 'Size' })
        .populate({ path: 'colors', model: 'Color' })
        .populate('categoryId', 'name')
        .populate('subCategoryId', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    }

    // If still no products, get newest products
    if (recommendedProducts.length === 0) {
      recommendedProducts = await this.productModel
        .find({ isActive: true })
        .populate({ path: 'sizes', model: 'Size' })
        .populate({ path: 'colors', model: 'Color' })
        .populate('categoryId', 'name')
        .populate('subCategoryId', 'name')
        .sort({ createdAt: -1 })
        .limit(20)
        .exec();
    }

    const formatted = this.productFormatter.formatProducts(
      recommendedProducts,
      offers,
      language,
    );

    if (userId) {
      const user = await this.userModel.findById(userId).select('wishlist').exec();
      if (user && user.wishlist) {
        const wishlistIds = user.wishlist.map(id => id.toString());
        formatted.forEach(p => {
          p.inFavourite = wishlistIds.includes(p.id);
        });
      }
    }

    return formatted;
  }
}
