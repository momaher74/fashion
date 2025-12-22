import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { ProductFormatterService } from '../common/services/product-formatter.service';
import { Offer, OfferDocument } from '../schemas/offer.schema';

@Injectable()
export class WishlistService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
        @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
        private productFormatter: ProductFormatterService,
    ) { }

    async toggleWishlist(userId: string, productId: string) {
        const product = await this.productModel.findById(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const user = await this.userModel.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.wishlist) {
            user.wishlist = [];
        }

        const index = user.wishlist.findIndex((id) => id.toString() === productId);

        let isFavourite = false;
        if (index === -1) {
            user.wishlist.push(new Types.ObjectId(productId));
            isFavourite = true;
        } else {
            user.wishlist.splice(index, 1);
            isFavourite = false;
        }

        await user.save();
        return {
            message: isFavourite ? 'Added to wishlist' : 'Removed from wishlist',
            inFavourite: isFavourite,
        };
    }

    async getWishlist(userId: string, language: any = 'ar') {
        const user = await this.userModel
            .findById(userId)
            .populate({
                path: 'wishlist',
                model: 'Product',
                populate: [
                    { path: 'sizes', model: 'Size' },
                    { path: 'colors', model: 'Color' },
                    { path: 'categoryId', model: 'Category' },
                    { path: 'subCategoryId', model: 'SubCategory' },
                ],
            })
            .exec();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const offers = await this.offerModel.find({ isActive: true }).exec();
        const formatted = this.productFormatter.formatProducts(
            user.wishlist as any,
            offers,
            language,
        );

        return formatted.map(p => ({ ...p, inFavourite: true }));
    }
}
