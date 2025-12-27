import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Headers,
  Req,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('jumiapay/create')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  async confirmCashOnDelivery(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.confirmCashOnDelivery(createPaymentDto.orderId);
  }

  @Post('stripe/create-intent')
  @UseGuards(JwtAuthGuard)
  async createStripePaymentIntent(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.createStripePaymentIntent(createPaymentDto.orderId);
  }

  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: any,
  ) {
    return this.paymentService.handleStripeWebhook(request.rawBody || request.body, signature);
  }
}

