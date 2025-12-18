import { Module } from '@nestjs/common';
import { ProductFormatterService } from './services/product-formatter.service';
import { CloudinaryService } from './services/cloudinary.service';

@Module({
  providers: [ProductFormatterService, CloudinaryService],
  exports: [ProductFormatterService, CloudinaryService],
})
export class CommonModule {}
