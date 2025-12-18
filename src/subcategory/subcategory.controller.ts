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
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from '../common/enums/language.enum';

@Controller('subcategories')
export class SubCategoryController {
  constructor(private readonly subCategoryService: SubCategoryService) {}

  @Get()
  async findAll(
    @Query('categoryId') categoryId?: string,
    @Query('language') language?: Language,
  ) {
    return this.subCategoryService.findAll(
      categoryId,
      language || Language.EN,
    );
  }

  @Get('category/:categoryId')
  async findByCategory(
    @Param('categoryId') categoryId: string,
    @Query('language') language?: Language,
  ) {
    return this.subCategoryService.findByCategoryId(
      categoryId,
      language || Language.EN,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('language') language?: Language,
  ) {
    return this.subCategoryService.findById(id, language || Language.EN);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(
    @Body('name') name: { ar: string; en: string },
    @Body('categoryId') categoryId: string,
    @Body('image') image?: string,
  ) {
    return this.subCategoryService.create(name, categoryId, image);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
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
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.subCategoryService.remove(id);
    return { message: 'SubCategory deleted' };
  }
}
