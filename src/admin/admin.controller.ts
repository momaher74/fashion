import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { ProductService } from '../product/product.service';
import { OffersService } from '../offers/offers.service';
import { OrderService } from '../order/order.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { CreateProductDto } from '../product/dto/create-product.dto';
import { UpdateProductDto } from '../product/dto/update-product.dto';
import { CreateOfferDto } from '../offers/dto/create-offer.dto';
import { UpdateOfferDto } from '../offers/dto/update-offer.dto';
import { UpdateOrderStatusDto } from '../order/dto/update-order-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private productService: ProductService,
    private offersService: OffersService,
    private orderService: OrderService,
    private cloudinary: CloudinaryService,
  ) { }

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
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async createOffer(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let title = body.title;
    if (typeof title === 'string') {
      try { title = JSON.parse(title); } catch (e) { }
    }

    let imageUrl = body.image;
    if (file) {
      imageUrl = await this.cloudinary.uploadImage(file);
    }

    return this.offersService.create({
      ...body,
      title,
      image: imageUrl,
      value: body.value ? parseFloat(body.value) : 0,
      isActive: body.isActive === 'false' || body.isActive === false ? false : true,
    });
  }

  @Patch('offers/:id')
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async updateOffer(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: any = { ...body };

    if (body.title && typeof body.title === 'string') {
      try { updateData.title = JSON.parse(body.title); } catch (e) { }
    }
    if (body.value) updateData.value = parseFloat(body.value);
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive === 'false' || body.isActive === false ? false : true;
    }

    if (file) {
      updateData.image = await this.cloudinary.uploadImage(file);
    }

    return this.offersService.update(id, updateData);
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

