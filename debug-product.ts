
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ProductService } from './src/product/product.service';
import { Types } from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const productService = app.get(ProductService);

  const productId = '694604af923b8e77d02c834d'; 
  
  try {
    const product = await productService.findOne(productId);
    console.log('Product Found:', JSON.stringify(product, null, 2));
    
    // Also try to find the raw product to check population
    const productModel = (productService as any).productModel;
    const rawProduct = await productModel.findById(productId)
      .populate('sizes')
      .populate('colors');
      
    console.log('Raw Populated Sizes:', JSON.stringify(rawProduct.sizes, null, 2));
    console.log('Raw Populated Colors:', JSON.stringify(rawProduct.colors, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }

  await app.close();
}

bootstrap();
