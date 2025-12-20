import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Cart, CartDocument } from '../schemas/cart.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ProductFormatterService } from '../common/services/product-formatter.service';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
    private productFormatter: ProductFormatterService,
    private userService: UserService,
    private notificationService: NotificationService,
  ) { }

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const cart = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('cart.empty');
    }

    const user = await this.userService.findById(userId);
    const offers = await this.offerModel.find({ isActive: true }).exec();
    const language = user.language || Language.AR;

    const orderItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = await this.productModel.findById(item.productId);
        if (!product) {
          throw new NotFoundException('product.not_found');
        }

        const formatted = this.productFormatter.formatProduct(
          product,
          offers,
          language,
        );

        // Find if this specific combination has a variant-specific price
        const variant = product.variants?.find(
          (v) =>
            v.sizeId.toString() === item.size.toString() &&
            v.colorId.toString() === item.color.toString(),
        );

        // If variant has a different price, recalculate final price
        let itemFinalPrice = formatted.finalPrice;
        let itemBasePrice = product.price;

        if (variant && variant.price !== undefined) {
          itemBasePrice = variant.price;
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
          itemFinalPrice = Math.max(0, variant.price - bestDiscount);
        }

        return {
          productId: product._id.toString(),
          name: product.name,
          description: product.description,
          images: product.images,
          price: itemBasePrice,
          finalPrice: itemFinalPrice,
          currency: product.currency,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        };
      }),
    );

    const totalAmount = orderItems.reduce(
      (sum, item) => sum + item.finalPrice * item.quantity,
      0,
    );

    const currency = orderItems[0]?.currency || 'EGP';

    const order = new this.orderModel({
      userId: new Types.ObjectId(userId),
      items: orderItems,
      totalAmount,
      currency,
      paymentMethod: createOrderDto.paymentMethod,
      paymentStatus:
        createOrderDto.paymentMethod === 'cash_on_delivery'
          ? PaymentStatus.PENDING
          : PaymentStatus.PENDING,
      shippingAddress: createOrderDto.shippingAddress,
      notes: createOrderDto.notes,
      status: OrderStatus.PENDING,
    });

    await order.save();

    // Clear cart after order creation
    cart.items = [];
    await cart.save();

    // Send notification
    try {
      await this.notificationService.notifyOrderCreated(
        order._id.toString(),
        userId,
      );
    } catch (error) {
      console.error('Failed to send order created notification:', error);
    }

    return order;
  }

  async findAll(userId: string) {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, userId?: string) {
    const query: any = { _id: id };
    if (userId) {
      query.userId = new Types.ObjectId(userId);
    }
    const order = await this.orderModel.findOne(query);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async updateStatus(id: string, updateDto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { status: updateDto.status },
      { new: true },
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Send notification for status update
    try {
      await this.notificationService.notifyOrderStatusUpdated(
        order._id.toString(),
        order.userId.toString(),
        updateDto.status,
      );
    } catch (error) {
      console.error('Failed to send order status notification:', error);
    }

    return order;
  }

  async findAllOrders() {
    return this.orderModel.find().sort({ createdAt: -1 }).populate('userId').exec();
  }
}

