import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from '../common/enums/language.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { UserService } from '../user/user.service';
import { CloudinaryService } from '../common/services/cloudinary.service';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import { Types } from 'mongoose';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly userService: UserService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  @Get()
  async findAll(
    @Query() filterDto: FilterProductDto,
    @LanguageHeader() language: Language,
  ) {
    return this.productService.findAll(filterDto, language);
  }

  @Get('categories')
  async getCategories() {
    return this.productService.getCategories();
  }

  @Get('filter-options')
  async getFilterOptions(@LanguageHeader() language: Language) {
    return this.productService.getFilterOptions(language);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @LanguageHeader() language: Language,
    @CurrentUser() user?: any,
  ) {
    let userId: string | undefined;
    if (user) {
      const dbUser = await this.userService.findById(user.id);
      userId = dbUser._id.toString();
    }
    return this.productService.findOne(id, language, userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    const normalize = (v: any) =>
      typeof v === 'string' ? v.trim().replace(/^"|"$/g, '') : v;

    // Helper to parse arrays from various forms (indexed, comma-separated, JSON)
    const toArrayFlexible = (v: any, prefix?: string): string[] => {
      let result: any[] = [];
      if (v !== undefined && v !== null) {
        if (Array.isArray(v)) {
          result = v;
        } else {
          const s = String(v).trim();
          if (s.startsWith('[') && s.endsWith(']')) {
            try {
              result = JSON.parse(s);
            } catch (_) {
              result = s.slice(1, -1).split(',').map(x => x.trim());
            }
          } else if (s.includes(',')) {
            result = s.split(',').map(x => x.trim());
          } else {
            result = [s];
          }
        }
      }

      // Check for indexed keys if result is still empty and prefix is provided
      if ((!result || result.length === 0) && prefix) {
        let i = 0;
        while (body?.[`${prefix}[${i}]`] !== undefined) {
          result.push(body[`${prefix}[${i}]`]);
          i++;
        }
      }

      return result.map(x => normalize(x)).filter(Boolean).map(String);
    };

    // 1. Process Multilingual Fields (Name & Description)
    const name: any = {
      ar: normalize(body?.['name[ar]'] ?? body?.nameAr),
      en: normalize(body?.['name[en]'] ?? body?.nameEn),
    };
    if ((!name.ar || !name.en) && body?.name) {
      try {
        const parsed = typeof body.name === 'string' ? JSON.parse(body.name) : body.name;
        if (!name.ar) name.ar = normalize(parsed?.ar);
        if (!name.en) name.en = normalize(parsed?.en);
      } catch (_) {
        if (typeof body.name === 'string' && !name.ar) name.ar = name.en = body.name;
      }
    }

    const description: any = {
      ar: normalize(body?.['description[ar]'] ?? body?.descriptionAr),
      en: normalize(body?.['description[en]'] ?? body?.descriptionEn),
    };
    if ((!description.ar || !description.en) && body?.description) {
      try {
        const parsed = typeof body.description === 'string' ? JSON.parse(body.description) : body.description;
        if (!description.ar) description.ar = normalize(parsed?.ar);
        if (!description.en) description.en = normalize(parsed?.en);
      } catch (_) {
        if (typeof body.description === 'string' && !description.ar) description.ar = description.en = body.description;
      }
    }

    if (!name.ar || !name.en) throw new BadRequestException('name.required');
    if (!description.ar || !description.en) throw new BadRequestException('description.required');

    // 2. Process Images
    const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/djfeplrup/image/upload/v1766196397/fashion-ecommerce/file_ed4g6i.jpg';
    let images = toArrayFlexible(body?.['images[]'] ?? body?.images, 'images');
    if (files && files.length > 0) {
      const uploaded = await this.cloudinary.uploadMultipleImages(files);
      images = [...images, ...uploaded];
    }

    // Filter out unwanted placeholder image
    images = images.filter(img => img !== PLACEHOLDER_IMAGE);

    // 3. Process Sizes & Colors
    const sizes = toArrayFlexible(body?.['sizes[]'] ?? body?.sizes, 'sizes');
    const colors = toArrayFlexible(body?.['colors[]'] ?? body?.colors, 'colors');

    // 4. Process Variants
    let variants: any[] = [];
    if (body?.variants) {
      if (typeof body.variants === 'string') {
        try {
          variants = JSON.parse(body.variants);
        } catch (_) { }
      } else if (Array.isArray(body.variants)) {
        variants = body.variants;
      }
    } else {
      let i = 0;
      while (body?.[`variants[${i}][sizeId]`] !== undefined) {
        variants.push({
          sizeId: normalize(body[`variants[${i}][sizeId]`]),
          colorId: normalize(body[`variants[${i}][colorId]`]),
          stock: parseInt(String(body[`variants[${i}][stock]`]) || '0'),
          price: body[`variants[${i}][price]`] ? parseFloat(String(body[`variants[${i}][price]`])) : undefined,
        });
        i++;
      }
    }

    // 5. Build DTO
    const price = parseFloat(String(body?.price));
    if (isNaN(price)) throw new BadRequestException('price.invalid');

    const categoryId = normalize(body?.categoryId);
    const subCategoryId = normalize(body?.subCategoryId);
    if (!categoryId || !Types.ObjectId.isValid(categoryId)) throw new BadRequestException('categoryId.invalid');
    if (!subCategoryId || !Types.ObjectId.isValid(subCategoryId)) throw new BadRequestException('subCategoryId.invalid');

    const isActive = body?.isActive !== undefined
      ? (String(body.isActive).toLowerCase() === 'true' || body.isActive === '1' || body.isActive === 1)
      : true;

    const createDto: CreateProductDto = {
      name,
      description,
      images,
      price,
      currency: normalize(body?.currency) || 'EGP',
      sizes,
      colors,
      variants,
      categoryId,
      subCategoryId,
      isActive,
      type: normalize(body?.type) || 'normal',
    } as CreateProductDto;

    return this.productService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/djfeplrup/image/upload/v1766196397/fashion-ecommerce/file_ed4g6i.jpg';

    // If images are provided in update, filter out the placeholder
    if (updateDto.images && Array.isArray(updateDto.images)) {
      updateDto.images = updateDto.images.filter(img => img !== PLACEHOLDER_IMAGE);
    }

    return this.productService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.cloudinary.uploadImage(file);
    return { url };
  }

  @Post('upload-images')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 25 * 1024 * 1024 },
    }),
  )
  async uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    const urls = await this.cloudinary.uploadMultipleImages(files);
    return { urls };
  }
}

