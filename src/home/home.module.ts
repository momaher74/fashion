import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { Category, CategorySchema } from '../schemas/category.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Offer, OfferSchema } from '../schemas/offer.schema';
import { Banner, BannerSchema } from '../schemas/banner.schema';
import { Order, OrderSchema } from '../schemas/order.schema';
import { CategoryModule } from '../category/category.module';
import { BannerModule } from '../banner/banner.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Banner.name, schema: BannerSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    CategoryModule,
    BannerModule,
    CommonModule,
  ],
  controllers: [HomeController],
  providers: [HomeService],
  exports: [HomeService],
})
export class HomeModule {}
