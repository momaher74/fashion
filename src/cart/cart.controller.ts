import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { UserService } from '../user/user.service';
import { Language } from '../common/enums/language.enum';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly userService: UserService,
  ) { }

  @Get()
  async getCart(
    @CurrentUser() user: any,
    @LanguageHeader() language: Language,
  ) {
    const dbUser = await this.userService.findById(user.id);
    return this.cartService.getCart(dbUser._id.toString(), language);
  }

  @Post('add')
  async addToCart(@CurrentUser() user: any, @Body() addToCartDto: AddToCartDto) {
    const dbUser = await this.userService.findById(user.id);
    return this.cartService.addToCart(dbUser._id.toString(), addToCartDto);
  }

  @Patch('items/:itemId')
  async updateCartItem(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const dbUser = await this.userService.findById(user.id);
    return this.cartService.updateCartItem(
      dbUser._id.toString(),
      itemId,
      updateDto,
    );
  }

  @Delete('items/:itemId')
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('itemId') itemId: string,
  ) {
    const dbUser = await this.userService.findById(user.id);
    return this.cartService.removeFromCart(
      dbUser._id.toString(),
      itemId,
    );
  }

  @Delete('clear')
  async clearCart(@CurrentUser() user: any) {
    const dbUser = await this.userService.findById(user.id);
    return this.cartService.clearCart(dbUser._id.toString());
  }
}

