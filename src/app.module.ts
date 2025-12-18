import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import * as admin from 'firebase-admin';
import * as path from 'path';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { OffersModule } from './offers/offers.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { PaymentModule } from './payment/payment.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { ColorModule } from './color/color.module';
import { SizeModule } from './size/size.module';
import { CategoryModule } from './category/category.module';
import { SubCategoryModule } from './subcategory/subcategory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb+srv://elomdamohamedmaher:iUInmxqWMLZrrTmH@cluster0.foqzb.mongodb.net/fashion_commerce?retryWrites=true&w=majority&appName=Cluster0',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ProductModule,
    OffersModule,
    CartModule,
    OrderModule,
    PaymentModule,
    NotificationModule,
    AdminModule,
    CommonModule,
    ColorModule,
    SizeModule,
    CategoryModule,
    SubCategoryModule,
  ],
})
export class AppModule {
  constructor() {
    // Initialize Firebase Admin
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
        '/Users/youssef/Downloads/compeleecommerceapp-firebase-adminsdk-lsdt9-66876f34da.json';
      
      // Try to use file path first
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('Firebase Admin initialized from file');
      } catch (fileError) {
        // Fallback to environment variable JSON string
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(
            process.env.FIREBASE_SERVICE_ACCOUNT,
          );
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          console.log('Firebase Admin initialized from env');
        } else {
          throw new Error('Firebase credentials not found');
        }
      }
    } catch (error) {
      console.error('Firebase Admin initialization error:', error);
    }
  }
}

