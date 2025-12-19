import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, Get, Param } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { StoryMediaType } from '../schemas/story.schema';
import { Language } from '../common/enums/language.enum';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { UseGuards as OptionalUseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadStory(
    @UploadedFile() file: Express.Multer.File,
    @Body('mediaType') mediaType: StoryMediaType,
    @Body('title') title?: string,
    @Body('categoryId') categoryId?: string,
    @Body('subCategoryId') subCategoryId?: string,
    @Body('productId') productId?: string,
  ) {
    const url = await this.cloudinary.uploadFile(file, {
      resourceType: mediaType === StoryMediaType.VIDEO ? 'video' : 'image',
      folder: 'stories',
    });

    let parsedTitle: any;
    if (title) {
      try { parsedTitle = JSON.parse(title); } catch { parsedTitle = undefined; }
    }

    return this.storiesService.create({
      title: parsedTitle,
      mediaUrl: url,
      mediaType,
      categoryId,
      subCategoryId,
      productId,
    });
  }

  @Get()
  @OptionalUseGuards(OptionalJwtAuthGuard)
  async listActive(
    @LanguageHeader() language: Language,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id;
    return this.storiesService.findActive(language, userId);
  }

  @Post(':id/seen')
  @UseGuards(JwtAuthGuard)
  async markSeen(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storiesService.markSeen(id, user.id);
  }
}
