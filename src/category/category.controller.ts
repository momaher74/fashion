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
import { CategoryService } from './category.service';
import { SubCategoryService } from '../subcategory/subcategory.service';
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

@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly subCategoryService: SubCategoryService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  @Get('active-with-subcategories')
  async getActiveWithSubCategories(@LanguageHeader() language: Language) {
    const categories = await this.categoryService.findAll(language);
    const subCategories = await this.subCategoryService.findAll(
      undefined,
      language,
    );

    return categories.map((category) => {
      return {
        ...category,
        subCategories: subCategories.filter(
          (sub) => sub.categoryId === category.id,
        ),
      };
    });
  }

  @Get()
  async findAll(@LanguageHeader() language: Language) {
    return this.categoryService.findAll(language);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @LanguageHeader() language: Language,
  ) {
    return this.categoryService.findById(id, language);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  async create(
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Support both name[ar]/name[en] and name as JSON/object
    const normalize = (v: any) => typeof v === 'string' ? v.trim().replace(/^"|"$/g, '') : v;
    let nameAr: string | undefined = normalize(body?.['name[ar]'] ?? body?.nameAr);
    let nameEn: string | undefined = normalize(body?.['name[en]'] ?? body?.nameEn);
    if (!nameAr || !nameEn) {
      const rawName = body?.name;
      if (rawName) {
        try {
          const parsed = typeof rawName === 'string' ? JSON.parse(rawName) : rawName;
          nameAr = nameAr ?? normalize(parsed?.ar);
          nameEn = nameEn ?? normalize(parsed?.en);
        } catch (_) { }
      }
    }
    const name: any = {};
    if (typeof nameAr === 'string' && nameAr.length > 0) name.ar = nameAr;
    if (typeof nameEn === 'string' && nameEn.length > 0) name.en = nameEn;
    if (Object.keys(name).length === 0) {
      // avoid saving empty name object
      throw new (require('@nestjs/common').BadRequestException)('name.required');
    }

    let imageUrl: string | undefined = body?.image;
    if (file) {
      imageUrl = await this.cloudinary.uploadImage(file);
    }
    return this.categoryService.create(name, imageUrl);
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
    const updateData: any = {};

    // Name updates
    const normalize = (v: any) => typeof v === 'string' ? v.trim().replace(/^"|"$/g, '') : v;
    let nameAr: string | undefined = normalize(body?.['name[ar]'] ?? body?.nameAr);
    let nameEn: string | undefined = normalize(body?.['name[en]'] ?? body?.nameEn);
    if ((!nameAr || !nameEn) && body?.name) {
      try {
        const parsed = typeof body.name === 'string' ? JSON.parse(body.name) : body.name;
        nameAr = nameAr ?? normalize(parsed?.ar);
        nameEn = nameEn ?? normalize(parsed?.en);
      } catch (_) { }
    }
    if (nameAr !== undefined || nameEn !== undefined) {
      const name: any = {};
      if (typeof nameAr === 'string' && nameAr.length > 0) name.ar = nameAr;
      if (typeof nameEn === 'string' && nameEn.length > 0) name.en = nameEn;
      if (Object.keys(name).length > 0) {
        updateData.name = name;
      }
    }

    // Image updates
    if (file) {
      updateData.image = await this.cloudinary.uploadImage(file);
    } else if (body && body.image !== undefined) {
      updateData.image = body.image;
    }

    // isActive update
    const isActive = body?.isActive;
    if (isActive !== undefined) {
      const v = String(isActive).toLowerCase();
      updateData.isActive = v === 'true' || v === '1';
    }

    return this.categoryService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(id);
    return { message: 'Category deleted' };
  }
}
