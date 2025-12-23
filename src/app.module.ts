import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

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
import { BannerModule } from './banner/banner.module';
import { HomeModule } from './home/home.module';
import { StoriesModule } from './stories/stories.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { AddressModule } from './address/address.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
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
    BannerModule,
    HomeModule,
    StoriesModule,
    WishlistModule,
    AddressModule
  ],
})
export class AppModule { }

