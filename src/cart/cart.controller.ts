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
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';
import { Language } from '../common/enums/language.enum';

@Controller('cart')
@UseGuards(FirebaseAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async getCart(
    @CurrentUser() user: any,
    @Query('language') language?: Language,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    return this.cartService.getCart(
      dbUser._id.toString(),
      language || dbUser.language,
    );
  }

  @Post('add')
  async addToCart(@CurrentUser() user: any, @Body() addToCartDto: AddToCartDto) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    return this.cartService.addToCart(dbUser._id.toString(), addToCartDto);
  }

  @Patch('items/:index')
  async updateCartItem(
    @CurrentUser() user: any,
    @Param('index') index: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    return this.cartService.updateCartItem(
      dbUser._id.toString(),
      parseInt(index),
      updateDto,
    );
  }

  @Delete('items/:index')
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('index') index: string,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    return this.cartService.removeFromCart(
      dbUser._id.toString(),
      parseInt(index),
    );
  }

  @Delete('clear')
  async clearCart(@CurrentUser() user: any) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    return this.cartService.clearCart(dbUser._id.toString());
  }
}

