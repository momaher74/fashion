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
import { OffersService } from './offers.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../common/services/cloudinary.service';

@Controller('offers')
export class OffersController {
  constructor(
    private readonly offersService: OffersService,
    private readonly cloudinary: CloudinaryService,
  ) { }

  @Get()
  async findAll() {
    return this.offersService.findAll();
  }

  @Get('active')
  async findActive() {
    return this.offersService.findActive();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.offersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', { storage: memoryStorage() }))
  async create(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let title = body.title;
    if (typeof title === 'string') {
      try { title = JSON.parse(title); } catch (e) { }
    }

    let imageUrl = body.image;
    if (file) {
      imageUrl = await this.cloudinary.uploadImage(file);
    }

    return this.offersService.create({
      ...body,
      title,
      image: imageUrl,
      value: body.value ? parseFloat(body.value) : 0,
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
    if (body.value) updateData.value = parseFloat(body.value);
    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive === 'false' || body.isActive === false ? false : true;
    }

    if (file) {
      updateData.image = await this.cloudinary.uploadImage(file);
    }

    return this.offersService.update(id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.offersService.remove(id);
  }
}

