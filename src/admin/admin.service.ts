import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { OffersService } from '../offers/offers.service';
import { OrderService } from '../order/order.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AdminService {
  constructor(
    private productService: ProductService,
    private offersService: OffersService,
    private orderService: OrderService,
    private userService: UserService,
  ) {}

  // Product management methods are delegated to ProductService
  // Offer management methods are delegated to OffersService
  // Order viewing is delegated to OrderService

  async getDashboardStats() {
    // This can be expanded with actual statistics
    const orders = await this.orderService.findAllOrders();
    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter((o) => o.status === 'pending').length,
      paidOrders: orders.filter((o) => o.paymentStatus === 'paid').length,
    };
  }
}

