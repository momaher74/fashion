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
} from '@nestjs/common';
import { SubCategoryService } from './subcategory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from '../common/enums/language.enum';
import { LanguageHeader } from '../common/decorators/language.decorator';

@Controller('subcategories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

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
  async create(
    @Body('name') name: { ar: string; en: string },
    @Body('categoryId') categoryId: string,
    @Body('image') image?: string,
  ) {
    return this.subCategoryService.create(name, categoryId, image);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      name?: { ar: string; en: string };
      categoryId?: string;
      image?: string;
      isActive?: boolean;
    },
  ) {
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
