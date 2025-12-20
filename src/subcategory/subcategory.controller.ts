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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { SubCategoryService } from './subcategory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from '../common/enums/language.enum';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';

@Controller('subcategories')
export class SubCategoryController {
  constructor(
    private readonly subCategoryService: SubCategoryService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  @Get()
  async findAll(
    @LanguageHeader() language: Language,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.subCategoryService.findAll(categoryId, language);
  }

  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @LanguageHeader() language: Language,
  ) {
    return this.subCategoryService.findByCategoryId(categoryId, language);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @LanguageHeader() language: Language,
  ) {
    return this.subCategoryService.findById(id, language);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  async create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const normalize = (v: any) => typeof v === 'string' ? v.trim().replace(/^"|"$/g, '') : v;
    let nameAr: string | undefined = normalize(body?.['name[ar]'] ?? body?.nameAr);
    let nameEn: string | undefined = normalize(body?.['name[en]'] ?? body?.nameEn);
    const rawName = body?.name;
    if ((!nameAr && !nameEn) && rawName) {
      try {
        const parsed = typeof rawName === 'string' ? JSON.parse(rawName) : rawName;
        nameAr = nameAr ?? normalize(parsed?.ar);
        nameEn = nameEn ?? normalize(parsed?.en);
      } catch (_) {}
    }
    const categoryId: string = body?.categoryId;
    const name: any = {};
    if (typeof nameAr === 'string' && nameAr.length > 0) name.ar = nameAr;
    if (typeof nameEn === 'string' && nameEn.length > 0) name.en = nameEn;
    if (Object.keys(name).length === 0) {
      throw new (require('@nestjs/common').BadRequestException)('name.required');
    }
    const { Types } = require('mongoose');
    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      throw new (require('@nestjs/common').BadRequestException)('categoryId.invalid');
    }

    let imageUrl: string | undefined = body?.image;
    if (file) {
      imageUrl = await this.cloudinary.uploadImage(file);
    }
    return this.subCategoryService.create(name, categoryId, imageUrl);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  async update(
    @Param('id') id: string,
    @UploadedFile() file?: Express.Multer.File,
    @Body() body?: any,
  ) {
    const normalize = (v: any) => typeof v === 'string' ? v.trim().replace(/^"|"$/g, '') : v;
    const updateData: any = {};

    // Name
    let nameAr: string | undefined = normalize(body?.['name[ar]'] ?? body?.nameAr);
    let nameEn: string | undefined = normalize(body?.['name[en]'] ?? body?.nameEn);
    if ((!nameAr || !nameEn) && body?.name) {
      try {
        const parsed = typeof body.name === 'string' ? JSON.parse(body.name) : body.name;
        nameAr = nameAr ?? normalize(parsed?.ar);
        nameEn = nameEn ?? normalize(parsed?.en);
      } catch (_) {}
    }
    if (nameAr !== undefined || nameEn !== undefined) {
      const name: any = {};
      if (typeof nameAr === 'string' && nameAr.length > 0) name.ar = nameAr;
      if (typeof nameEn === 'string' && nameEn.length > 0) name.en = nameEn;
      updateData.name = name;
    }

    // CategoryId
    if (body && body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId;
    }

    // Image
    if (file) {
      updateData.image = await this.cloudinary.uploadImage(file);
    } else if (body && body.image !== undefined) {
      updateData.image = body.image;
    }

    // isActive
    if (body && body.isActive !== undefined) {
      const v = String(body.isActive).toLowerCase();
      updateData.isActive = v === 'true' || v === '1';
    }

    return this.subCategoryService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.subCategoryService.remove(id);
    return { message: 'SubCategory deleted' };
  }
}
