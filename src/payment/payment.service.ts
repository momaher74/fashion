import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { NotificationService } from '../notification/notification.service';
import axios from 'axios';

@Injectable()
export class PaymentService {
  private jumiaPayApiUrl: string;
  private jumiaPayApiKey: string;
  private jumiaPaySecretKey: string;
  private jumiaPayMerchantId: string;
  private jumiaPayTestMode: boolean;
  private jumiaPayCallbackUrl: string;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private configService: ConfigService,
    private notificationService: NotificationService,
  ) {
    this.jumiaPayApiUrl = this.configService.get<string>('JUMIAPAY_API_URL') || 'https://api.jumiapay.com';
    this.jumiaPayApiKey = this.configService.get<string>('JUMIAPAY_API_KEY') || '';
    this.jumiaPaySecretKey = this.configService.get<string>('JUMIAPAY_SECRET_KEY') || '';
    this.jumiaPayMerchantId = this.configService.get<string>('JUMIAPAY_MERCHANT_ID') || '';
    this.jumiaPayTestMode = this.configService.get<string>('JUMIAPAY_TEST_MODE') === 'true';
    this.jumiaPayCallbackUrl = this.configService.get<string>('JUMIAPAY_CALLBACK_URL') || '';
  }

  async createJumiaPaySession(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('order.not_found');
    }

    if (order.paymentMethod !== PaymentMethod.JUMIAPAY) {
      throw new BadRequestException('order.payment_method_invalid');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('order.already_paid');
    }

    try {
      // JumiaPay API integration
      const paymentData = {
        merchantId: this.jumiaPayMerchantId,
        orderId: order._id.toString(),
        amount: order.totalAmount,
        currency: order.currency,
        callbackUrl: this.jumiaPayCallbackUrl,
        testMode: this.jumiaPayTestMode,
      };

      // In a real implementation, you would sign the request with the secret key
      const response = await axios.post(
        `${this.jumiaPayApiUrl}/v1/payments/create`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${this.jumiaPayApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Update order with payment transaction ID
      order.paymentTransactionId = response.data.transactionId;
      await order.save();

      return {
        paymentUrl: response.data.paymentUrl,
        transactionId: response.data.transactionId,
      };
    } catch (error) {
      throw new BadRequestException('payment.session_failed');
    }
  }

  async handleJumiaPayCallback(transactionId: string, status: string) {
    const order = await this.orderModel.findOne({ paymentTransactionId: transactionId });
    if (!order) {
      throw new NotFoundException('order.not_found');
    }

    if (status === 'success' || status === 'paid') {
      order.paymentStatus = PaymentStatus.PAID;
      order.status = OrderStatus.PAID;
      await order.save();

      // Send payment notification
      try {
        await this.notificationService.notifyOrderPaid(
          order._id.toString(),
          order.userId.toString(),
        );
      } catch (error) {
        console.error('Failed to send payment notification:', error);
      }

      return { success: true, orderId: order._id.toString() };
    } else {
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();
      return { success: false, orderId: order._id.toString() };
    }
  }

  async confirmCashOnDelivery(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException('order.not_found');
    }

    if (order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY) {
      throw new BadRequestException('payment.cash_on_delivery_invalid');
    }

    // Cash on delivery is confirmed when order is created
    // Payment status remains PENDING until delivery
    return { message: 'Order confirmed for cash on delivery' };
  }
}

