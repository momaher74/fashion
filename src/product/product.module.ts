import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Offer, OfferSchema } from '../schemas/offer.schema';
import { Cart, CartSchema } from '../schemas/cart.schema';
import { CommonModule } from '../common/common.module';
import { UserModule } from '../user/user.module';
import { Color, ColorSchema } from '../schemas/color.schema';
import { Size, SizeSchema } from '../schemas/size.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Size.name, schema: SizeSchema },   // <-- add this
      { name: Color.name, schema: ColorSchema }, // <-- add this
    ]),
    CommonModule,
    UserModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}

