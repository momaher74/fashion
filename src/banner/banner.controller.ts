import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { Language } from '../common/enums/language.enum';

@Controller('banners')
export class BannerController {
  constructor(
    private readonly bannerService: BannerService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  @Get()
  async getBanners(@LanguageHeader() language: Language) {
    return this.bannerService.getActiveBanners(language);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async findAll() {
    return this.bannerService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bannerService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Parsing manual because of multipart/form-data
    let title = body.title;
    let description = body.description;

    if (typeof title === 'string') {
      try { title = JSON.parse(title); } catch (e) { }
    }
    if (typeof description === 'string') {
      try { description = JSON.parse(description); } catch (e) { }
    }

    let imageUrl = body.image;
    if (file) {
      imageUrl = await this.cloudinary.uploadImage(file);
    }

    return this.bannerService.create({
      ...body,
      title,
      description,
      image: imageUrl,
      order: body.order ? parseInt(body.order) : 0,
      isActive: body.isActive === 'false' || body.isActive === false ? false : true,
    });
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const updateData: any = { ...body };

    if (body.title && typeof body.title === 'string') {
      try { updateData.title = JSON.parse(body.title); } catch (e) { }
    }
    if (body.description && typeof body.description === 'string') {
      try { updateData.description = JSON.parse(body.description); } catch (e) { }
    }
    if (body.order) updateData.order = parseInt(body.order);
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive === 'false' || body.isActive === false ? false : true;
    }

    if (file) {
      updateData.image = await this.cloudinary.uploadImage(file);
    }

    return this.bannerService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.bannerService.remove(id);
  }
}
