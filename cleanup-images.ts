
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './src/schemas/product.schema';

async function cleanup() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const productModel = app.get<Model<Product>>(getModelToken(Product.name));

    const placeholderUrl = 'https://res.cloudinary.com/djfeplrup/image/upload/v1766196397/fashion-ecommerce/file_ed4g6i.jpg';

    console.log(`Starting cleanup of placeholder image: ${placeholderUrl}`);

    try {
        // 1. Find all products that contain this image URL
        const products = await productModel.find({ images: placeholderUrl });
        console.log(`Found ${products.length} products with this image.`);

        // 2. Remove the URL from each product's images array
        let updatedCount = 0;
        for (const product of products) {
            const originalLength = product.images.length;
            product.images = product.images.filter(img => img !== placeholderUrl);

            if (product.images.length !== originalLength) {
                await product.save();
                updatedCount++;
            }
        }

        // Alternative: Use updateMany with $pull for efficiency
        // const result = await productModel.updateMany(
        //   { images: placeholderUrl },
        //   { $pull: { images: placeholderUrl } }
        // );
        // console.log(`Bulk update result: ${result.modifiedCount} documents updated.`);

        console.log(`Successfully cleaned up ${updatedCount} products.`);
    } catch (error) {
        console.error('Cleanup failed:', error);
    } finally {
        await app.close();
    }
}

cleanup();
