import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProductModule } from '../product/product.module';
import { OffersModule } from '../offers/offers.module';
import { OrderModule } from '../order/order.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [ProductModule, OffersModule, OrderModule, UserModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

