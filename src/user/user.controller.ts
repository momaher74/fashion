import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Param,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    return {
      id: dbUser._id,
      firebaseUid: dbUser.firebaseUid,
      email: dbUser.email,
      name: dbUser.name,
      phone: dbUser.phone,
      role: dbUser.role,
      language: dbUser.language,
      avatar: dbUser.avatar,
    };
  }

  @Put('me')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateUserDto,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    const updated = await this.userService.update(dbUser._id.toString(), updateDto);
    return {
      id: updated._id,
      firebaseUid: updated.firebaseUid,
      email: updated.email,
      name: updated.name,
      phone: updated.phone,
      role: updated.role,
      language: updated.language,
      avatar: updated.avatar,
    };
  }

  @Patch('me/fcm-token')
  async updateFcmToken(
    @CurrentUser() user: any,
    @Body('fcmToken') fcmToken: string,
  ) {
    const dbUser = await this.userService.findByFirebaseUid(user.firebaseUid);
    if (!dbUser) {
      throw new Error('User not found');
    }
    await this.userService.updateFcmToken(dbUser._id.toString(), fcmToken);
    return { message: 'FCM token updated' };
  }
}

