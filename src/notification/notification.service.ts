import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../schemas/user.schema';
import { Language } from '../common/enums/language.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { Multilingual } from '../common/interfaces/multilingual.interface';

interface NotificationMessage {
  title: Multilingual;
  body: Multilingual;
}

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Send notification to a specific user
   */
  async sendToUser(
    userId: string,
    message: NotificationMessage,
    data?: any,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.fcmToken) {
      return;
    }

    const language = user.language || Language.EN;
    const title = message.title[language] || message.title.en;
    const body = message.body[language] || message.body.en;

    try {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data: data ? this.stringifyData(data) : undefined,
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendToUsers(
    userIds: string[],
    message: NotificationMessage,
    data?: any,
  ): Promise<void> {
    const users = await this.userModel.find({
      _id: { $in: userIds },
      fcmToken: { $exists: true, $ne: null },
    });

    if (users.length === 0) {
      return;
    }

    const messages = users.map((user) => {
      const language = user.language || Language.EN;
      const title = message.title[language] || message.title.en;
      const body = message.body[language] || message.body.en;

      return {
        token: user.fcmToken,
        notification: {
          title,
          body,
        },
        data: data ? this.stringifyData(data) : undefined,
      };
    });

    try {
      await admin.messaging().sendAll(messages);
    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  /**
   * Send order created notification
   */
  async notifyOrderCreated(orderId: string, userId: string): Promise<void> {
    const message: NotificationMessage = {
      title: {
        en: 'Order Created',
        ar: 'تم إنشاء الطلب',
      },
      body: {
        en: 'Your order has been created successfully',
        ar: 'تم إنشاء طلبك بنجاح',
      },
    };

    await this.sendToUser(userId, message, {
      type: 'order_created',
      orderId,
    });
  }

  /**
   * Send order paid notification
   */
  async notifyOrderPaid(orderId: string, userId: string): Promise<void> {
    const message: NotificationMessage = {
      title: {
        en: 'Order Paid',
        ar: 'تم الدفع',
      },
      body: {
        en: 'Your payment has been processed successfully',
        ar: 'تم معالجة الدفع بنجاح',
      },
    };

    await this.sendToUser(userId, message, {
      type: 'order_paid',
      orderId,
    });
  }

  /**
   * Send order status updated notification
   */
  async notifyOrderStatusUpdated(
    orderId: string,
    userId: string,
    status: OrderStatus,
  ): Promise<void> {
    const statusMessages: Record<OrderStatus, NotificationMessage> = {
      [OrderStatus.PENDING]: {
        title: { en: 'Order Pending', ar: 'الطلب قيد الانتظار' },
        body: { en: 'Your order is pending', ar: 'طلبك قيد الانتظار' },
      },
      [OrderStatus.PAID]: {
        title: { en: 'Order Paid', ar: 'تم الدفع' },
        body: { en: 'Your order has been paid', ar: 'تم دفع طلبك' },
      },
      [OrderStatus.SHIPPED]: {
        title: { en: 'Order Shipped', ar: 'تم الشحن' },
        body: { en: 'Your order has been shipped', ar: 'تم شحن طلبك' },
      },
      [OrderStatus.DELIVERED]: {
        title: { en: 'Order Delivered', ar: 'تم التسليم' },
        body: { en: 'Your order has been delivered', ar: 'تم تسليم طلبك' },
      },
      [OrderStatus.CANCELED]: {
        title: { en: 'Order Canceled', ar: 'تم الإلغاء' },
        body: { en: 'Your order has been canceled', ar: 'تم إلغاء طلبك' },
      },
    };

    const message = statusMessages[status];
    if (message) {
      await this.sendToUser(userId, message, {
        type: 'order_status_updated',
        orderId,
        status,
      });
    }
  }

  /**
   * Convert data object to string format for FCM
   */
  private stringifyData(data: any): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = String(data[key]);
      }
    }
    return result;
  }
}

