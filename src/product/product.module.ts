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
import { Category, CategorySchema } from '../schemas/category.schema';
import { SubCategory, SubCategorySchema } from '../schemas/subcategory.schema';
import { User, UserSchema } from '../schemas/user.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Offer.name, schema: OfferSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Size.name, schema: SizeSchema },
      { name: Color.name, schema: ColorSchema },
      { name: Category.name, schema: CategorySchema },
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: User.name, schema: UserSchema },
    ]),
    CommonModule,
    UserModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule { }

