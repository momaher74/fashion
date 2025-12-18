import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../schemas/user.schema';

@Controller('notifications')
@UseGuards(FirebaseAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // This endpoint can be used for testing notifications
  // In production, notifications are typically sent from services
  @Post('test')
  async testNotification(@CurrentUser() user: UserDocument) {
    await this.notificationService.notifyOrderCreated(
      'test-order-id',
      user._id.toString(),
    );
    return { message: 'Test notification sent' };
  }
}

