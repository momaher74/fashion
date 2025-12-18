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
  Req,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilterProductDto } from './dto/filter-product.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { OptionalFirebaseAuthGuard } from '../auth/guards/optional-firebase-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Language } from '../common/enums/language.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserService } from '../user/user.service';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly userService: UserService,
  ) {}

  @Get()
  async findAll(@Query() filterDto: FilterProductDto) {
    const language = (filterDto.language as Language) || Language.EN;
    return this.productService.findAll(filterDto, language);
  }

  @Get('categories')
  async getCategories() {
    return this.productService.getCategories();
  }

  @Get(':id')
  @UseGuards(OptionalFirebaseAuthGuard)
  async findOne(
    @Param('id') id: string,
    @Query('language') language?: Language,
    @CurrentUser() user?: any,
  ) {
    let userId: string | undefined;
    if (user) {
      const dbUser = await this.userService.findByFirebaseUid(
        user.firebaseUid,
      );
      userId = dbUser?._id.toString();
    }
    return this.productService.findOne(
      id,
      language || Language.EN,
      userId,
    );
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createDto: CreateProductDto) {
    return this.productService.create(createDto);
  }

  @Patch(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateProductDto) {
    return this.productService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}

