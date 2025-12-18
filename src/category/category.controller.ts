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
import { CategoryService } from './category.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from '../common/enums/language.enum';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async findAll(@Query('language') language?: Language) {
    return this.categoryService.findAll(language || Language.EN);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('language') language?: Language,
  ) {
    return this.categoryService.findById(id, language || Language.EN);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(
    @Body('name') name: { ar: string; en: string },
    @Body('image') image?: string,
  ) {
    return this.categoryService.create(name, image);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateData: {
      name?: { ar: string; en: string };
      image?: string;
      isActive?: boolean;
    },
  ) {
    return this.categoryService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    await this.categoryService.remove(id);
    return { message: 'Category deleted' };
  }
}
