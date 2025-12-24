import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutInfoDto } from './dto/checkout-info.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from '../user/user.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly userService: UserService,
  ) { }

  @Post()
  async create(@CurrentUser() user: any, @Body() createOrderDto: CreateOrderDto) {
    const dbUser = await this.userService.findById(user.id);
    return this.orderService.create(dbUser._id.toString(), createOrderDto);
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    const dbUser = await this.userService.findById(user.id);
    return this.orderService.findAll(dbUser._id.toString());
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const dbUser = await this.userService.findById(user.id);
    return this.orderService.findOne(id, dbUser._id.toString());
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateStatus(id, updateDto);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  async findAllOrders() {
    return this.orderService.findAllOrders();
  }

  @Post('checkout-info')
  async getCheckoutInfo(
    @CurrentUser() user: any,
    @Body() checkoutInfoDto: CheckoutInfoDto,
  ) {
    const dbUser = await this.userService.findById(user.id);
    return this.orderService.getCheckoutInfo(
      dbUser._id.toString(),
      checkoutInfoDto,
    );
  }
}

