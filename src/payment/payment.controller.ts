import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('jumiapay/create')
  async createJumiaPaySession(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createJumiaPaySession(createPaymentDto.orderId);
  }

  @Get('jumiapay/callback')
  async handleJumiaPayCallback(
    @Query('transactionId') transactionId: string,
    @Query('status') status: string,
  ) {
    return this.paymentService.handleJumiaPayCallback(transactionId, status);
  }

  @Post('cash-on-delivery/confirm')
  async confirmCashOnDelivery(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.confirmCashOnDelivery(createPaymentDto.orderId);
  }

  @Post('stripe/create-intent')
  async createStripePaymentIntent(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createStripePaymentIntent(createPaymentDto.orderId);
  }
}

