import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from '../schemas/cart.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ProductFormatterService } from '../common/services/product-formatter.service';
import { UserService } from '../user/user.service';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    private productFormatter: ProductFormatterService,
    private userService: UserService,
  ) { }

  async getOrCreateCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!cart) {
      cart = new this.cartModel({ userId: new Types.ObjectId(userId), items: [] });
      await cart.save();
    }
    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const cart = await this.getOrCreateCart(userId);
    const product = await this.productModel.findById(addToCartDto.productId);
    if (!product) {
      throw new NotFoundException('cart.product_not_found');
    }

    // Check if item already exists with same size and color
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === addToCartDto.productId &&
        item.size.toString() === addToCartDto.size &&
        item.color.toString() === addToCartDto.color,
    );

    if (existingItemIndex >= 0) {
      cart.items[existingItemIndex].quantity += addToCartDto.quantity;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(addToCartDto.productId),
        size: new Types.ObjectId(addToCartDto.size),
        color: new Types.ObjectId(addToCartDto.color),
        quantity: addToCartDto.quantity,
      });
    }

    return cart.save();
  }

  async getCart(userId: string, language: Language = Language.AR) {
    const cart = await this.getOrCreateCart(userId);
    const user = await this.userService.findById(userId);
    const lang = user.language || language;

    const offers = await this.offerModel.find({ isActive: true }).exec();
    const items = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.productModel
          .findById(item.productId)
          .populate({ path: 'sizes', model: 'Size' })
          .populate({ path: 'colors', model: 'Color' });
        if (!product) return null;

        const formatted = this.productFormatter.formatProduct(
          product,
          offers,
          lang,
        );

        // Find if this specific combination has a variant-specific price
        const variant = product.variants?.find(
          (v) =>
            v.sizeId.toString() === item.size.toString() &&
            v.colorId.toString() === item.color.toString(),
        );

        // If variant has a different price, recalculate final price for this item
        let itemPrice = formatted.finalPrice;
        if (variant && variant.price !== undefined) {
          // Re-calculate discount based on variant price
          const activeOffers = offers.filter(
            (offer) =>
              offer.isActive &&
              new Date() >= offer.startDate &&
              new Date() <= offer.endDate &&
              (offer.scope === 'global' ||
                (offer.scope === 'product' &&
                  offer.productId?.toString() === product._id.toString())),
          );

          let bestDiscount = 0;
          for (const offer of activeOffers) {
            const discount =
              offer.type === 'percentage'
                ? (variant.price * offer.value) / 100
                : Math.min(offer.value, variant.price);
            if (discount > bestDiscount) {
              bestDiscount = discount;
            }
          }
          itemPrice = Math.max(0, variant.price - bestDiscount);
        }

        // Get size and color names
        const size = (product.sizes as any[]).find(
          (s) => s._id.toString() === item.size.toString(),
        );
        const color = (product.colors as any[]).find(
          (c) => c._id.toString() === item.color.toString(),
        );

        return {
          productId: item.productId.toString(),
          product: {
            ...formatted,
            price: variant?.price ?? formatted.price,
            finalPrice: itemPrice,
          },
          size: size ? size.name : item.size.toString(),
          color: color ? color.name : item.color.toString(),
          sizeId: item.size.toString(),
          colorId: item.color.toString(),
          quantity: item.quantity,
          subtotal: itemPrice * item.quantity,
        };
      }),
    );

    const validItems = items.filter((item) => item !== null);
    const total = validItems.reduce((sum, item) => sum + item.subtotal, 0);

    return {
      items: validItems,
      total,
      currency: validItems[0]?.product.currency || 'EGP',
    };
  }

  async updateCartItem(
    userId: string,
    itemIndex: number,
    updateDto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      throw new BadRequestException('cart.invalid_index');
    }

    if (updateDto.quantity !== undefined) {
      cart.items[itemIndex].quantity = updateDto.quantity;
    }

    return cart.save();
  }

  async removeFromCart(userId: string, itemIndex: number) {
    const cart = await this.getOrCreateCart(userId);
    if (itemIndex < 0 || itemIndex >= cart.items.length) {
      throw new BadRequestException('cart.invalid_index');
    }

    cart.items.splice(itemIndex, 1);
    return cart.save();
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    cart.items = [];
    return cart.save();
  }
}

