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
  
  @Controller('products')
  export class ProductController {
    constructor(
      private readonly productService: ProductService,
      private readonly userService: UserService,
      private readonly cloudinary: CloudinaryService,
    ) {}
  
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
  @UseInterceptors(FilesInterceptor('images', 10, { storage: memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } }))
  async create(
    @Body('name[ar]') nameAr: string,
    @Body('name[en]') nameEn: string,
    @Body('description[ar]') descAr: string,
    @Body('description[en]') descEn: string,
    @Body('price') price: string,
    @Body('currency') currency: string,
    @Body('categoryId') categoryId: string,
    @Body('subCategoryId') subCategoryId: string,
    @Body('sizes[]') sizesIn?: string[] | string,
    @Body('colors[]') colorsIn?: string[] | string,
    @Body('isActive') isActive?: string,
    @Body('type') type?: string,
    @Body('images[]') imagesIn?: string[] | string,
    @UploadedFiles() files?: Express.Multer.File[],
) {
    const name = { ar: nameAr, en: nameEn };
    const description = { ar: descAr, en: descEn };

    const toArray = (v: any): string[] => {
      if (v === undefined || v === null) return [];
      if (Array.isArray(v)) return v.filter(Boolean);
      return [String(v)].filter(Boolean);
    };

    let images: string[] = toArray(imagesIn);
    if (files && files.length) {
      const uploaded: string[] = [];
      for (const f of files) {
        const url = await this.cloudinary.uploadImage(f);
        uploaded.push(url);
      }
      images = images.concat(uploaded);
    }

    const sizes = toArray(sizesIn);
    const colors = toArray(colorsIn);
    const priceNum = parseFloat(String(price));
    const isActiveBool = typeof isActive !== 'undefined' ? (String(isActive).toLowerCase() === 'true' || String(isActive) === '1') : undefined;

    const dto: any = {
      name,
      description,
      images,
      price: priceNum,
      currency,
      sizes,
      colors,
      categoryId,
      subCategoryId,
      type: type || 'normal',
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
