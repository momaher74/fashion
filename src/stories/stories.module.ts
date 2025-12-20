import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Story, StorySchema } from '../schemas/story.schema';
import { CommonModule } from '../common/common.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }]),
    CommonModule,
    UserModule,
  ],
  controllers: [StoriesController],
  providers: [StoriesService],
  exports: [StoriesService],
})
export class StoriesModule { }
