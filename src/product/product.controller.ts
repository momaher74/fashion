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
} from '@nestjs/common';
import { ProductService } from './product.service';
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

    // Multilingual fields
    const nameRaw = {
      ar: normalize(body?.['name[ar]'] ?? body?.nameAr),
      en: normalize(body?.['name[en]'] ?? body?.nameEn),
    } as any;
    const descriptionRaw = {
      ar: normalize(body?.['description[ar]'] ?? body?.descriptionAr),
      en: normalize(body?.['description[en]'] ?? body?.descriptionEn),
    } as any;
    // Fallback: support a single 'name'/'description' field as JSON or object
    if ((!nameRaw.ar || !nameRaw.en) && body?.name) {
      try {
        const parsed = typeof body.name === 'string' ? JSON.parse(body.name) : body.name;
        if (!nameRaw.ar) nameRaw.ar = normalize(parsed?.ar);
        if (!nameRaw.en) nameRaw.en = normalize(parsed?.en);
      } catch (_) { }
    }
    if ((!descriptionRaw.ar || !descriptionRaw.en) && body?.description) {
      try {
        const parsed = typeof body.description === 'string' ? JSON.parse(body.description) : body.description;
        if (!descriptionRaw.ar) descriptionRaw.ar = normalize(parsed?.ar);
        if (!descriptionRaw.en) descriptionRaw.en = normalize(parsed?.en);
      } catch (_) { }
    }
    // remove undefined values
    const name: any = {};
    if (typeof nameRaw.ar === 'string' && nameRaw.ar.length > 0)
      name.ar = nameRaw.ar;
    if (typeof nameRaw.en === 'string' && nameRaw.en.length > 0)
      name.en = nameRaw.en;
    const description: any = {};
    if (
      typeof descriptionRaw.ar === 'string' &&
      descriptionRaw.ar.length > 0
    )
      description.ar = descriptionRaw.ar;
    if (
      typeof descriptionRaw.en === 'string' &&
      descriptionRaw.en.length > 0
    )
      description.en = descriptionRaw.en;

    // Helpers to parse arrays from various forms
    const toArrayFlexible = (v: any): string[] => {
      if (v === undefined || v === null) return [];
      if (Array.isArray(v)) return v.map((x) => normalize(x)).filter(Boolean);
      const s = String(v).trim();
      // Try JSON array first
      if ((s.startsWith('[') && s.endsWith(']')) || s.includes(',')) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) {
            return parsed
              .map((x) => normalize(x))
              .filter(Boolean)
              .map(String);
          }
        } catch (_) {
          // fallback: strip brackets then split by comma
          const stripped = s.replace(/^\[/, '').replace(/\]$/, '');
          return stripped
            .split(',')
            .map((x) => normalize(x))
            .filter(Boolean)
            .map(String);
        }
      }
      return [normalize(s)].filter(Boolean).map(String);
    };

    // Improved helper to find indexed keys (e.g., sizes[0], colors[1])
    const gatherIndexedKeys = (prefix: string): string[] => {
      const results: string[] = [];
      let i = 0;
      while (body?.[`${prefix}[${i}]`] !== undefined) {
        results.push(normalize(body[`${prefix}[${i}]`]));
        i++;
      }
      return results;
    };

    // Images
    const imagesIn = body?.['images[]'] ?? body?.images;
    let images: string[] = toArrayFlexible(imagesIn);
    if (images.length === 0) images = gatherIndexedKeys('images');
    if (files && files.length) {
      const uploaded: string[] = [];
      for (const f of files) {
        const url = await this.cloudinary.uploadImage(f);
        uploaded.push(url);
      }
      images = images.concat(uploaded);
    }

    // Sizes & Colors: accept sizes[]/colors[] or sizes/colors (JSON/comma-separated) or indexed forms sizes[0]
    let sizes = toArrayFlexible(body?.['sizes[]'] ?? body?.sizes);
    if (sizes.length === 0) sizes = gatherIndexedKeys('sizes');

    let colors = toArrayFlexible(body?.['colors[]'] ?? body?.colors);
    if (colors.length === 0) colors = gatherIndexedKeys('colors');

    const priceNum = parseFloat(String(body?.price));
    const currency = normalize(body?.currency);
    const categoryId = normalize(body?.categoryId);
    const subCategoryId = normalize(body?.subCategoryId);
    const isActiveVal = body?.isActive;
    const isActiveBool =
      typeof isActiveVal !== 'undefined'
        ? String(isActiveVal).toLowerCase() === 'true' ||
        String(isActiveVal) === '1'
        : undefined;
    const type = normalize(body?.type) || 'normal';

    // Basic validation
    const { Types } = require('mongoose');
    const { BadRequestException } = require('@nestjs/common');
    if (!name.ar || !name.en) {
      throw new BadRequestException('name.required');
    }
    if (!description.ar || !description.en) {
      throw new BadRequestException('description.required');
    }
    if (!categoryId || !Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('categoryId.invalid');
    }
    if (!subCategoryId || !Types.ObjectId.isValid(subCategoryId)) {
      throw new BadRequestException('subCategoryId.invalid');
    }
    if (Number.isNaN(priceNum)) {
      throw new BadRequestException('price.invalid');
    }

    // Variants: JSON string or object array or indexed form data
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
      // Check for indexed variants (variants[0][sizeId], variants[0][stock], etc.)
      let i = 0;
      while (body?.[`variants[${i}][sizeId]`] !== undefined) {
        variants.push({
          sizeId: normalize(body[`variants[${i}][sizeId]`]),
          colorId: normalize(body[`variants[${i}][colorId]`]),
          stock: parseInt(String(body[`variants[${i}][stock]`])),
          price: body[`variants[${i}][price]`] ? parseFloat(String(body[`variants[${i}][price]`])) : undefined,
        });
        i++;
      }
    }

    const dto: any = {
      name,
      description,
      images,
      price: priceNum,
      currency,
      sizes,
      colors,
      variants,
      categoryId,
      subCategoryId,
      type,
    };
    if (typeof isActiveBool !== 'undefined') dto.isActive = isActiveBool;

    return this.productService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
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

