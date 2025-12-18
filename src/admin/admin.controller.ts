import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ProductService } from '../product/product.service';
import { OffersService } from '../offers/offers.service';
import { OrderService } from '../order/order.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CreateProductDto } from '../product/dto/create-product.dto';
import { UpdateProductDto } from '../product/dto/update-product.dto';
import { CreateOfferDto } from '../offers/dto/create-offer.dto';
import { UpdateOfferDto } from '../offers/dto/update-offer.dto';
import { UpdateOrderStatusDto } from '../order/dto/update-order-status.dto';

@Controller('admin')
@UseGuards(FirebaseAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private productService: ProductService,
    private offersService: OffersService,
    private orderService: OrderService,
  ) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // Product CRUD
  @Post('products')
  async createProduct(@Body() createDto: CreateProductDto) {
    return this.productService.create(createDto);
  }

  @Put('products/:id')
  async updateProduct(  
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return this.productService.update(id, updateDto);
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  // Offer CRUD
  @Post('offers')
  async createOffer(@Body() createDto: CreateOfferDto) {
    return this.offersService.create(createDto);
  }

  @Put('offers/:id')
  async updateOffer(
    @Param('id') id: string,
    @Body() updateDto: UpdateOfferDto,
  ) {
    return this.offersService.update(id, updateDto);
  }

  @Delete('offers/:id')
  async deleteOffer(@Param('id') id: string) {
    return this.offersService.remove(id);
  }

  // Order management
  @Get('orders')
  async getAllOrders() {
    return this.orderService.findAllOrders();
  }

  @Get('orders/:id')
  async getOrder(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Put('orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateDto);
  }
}

