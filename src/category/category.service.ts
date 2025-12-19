import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Multilingual } from '../common/interfaces/multilingual.interface';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(name: Multilingual, image?: string): Promise<CategoryDocument> {
    const category = new this.categoryModel({ name, image });
    return category.save();
  }

  async findAll(language: Language = Language.AR): Promise<any[]> {
    const categories = await this.categoryModel
      .find({ isActive: true })
      .exec();
    
    return categories.map((cat) => ({
      id: cat._id.toString(),
      name: cat.name[language] || cat.name.en || cat.name.ar,
      nameMultilingual: cat.name,
      image: cat.image,
      isActive: cat.isActive,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async findById(id: string, language: Language = Language.AR): Promise<any> {
    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException('category.not_found');
    }
    
    return {
      id: category._id.toString(),
      name: category.name[language] || category.name.en || category.name.ar,
      nameMultilingual: category.name,
      image: category.image,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  async update(
    id: string,
    updateData: Partial<Category>,
  ): Promise<CategoryDocument> {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );
    if (!category) {
      throw new NotFoundException('category.not_found');
    }
    return category;
  }

  async remove(id: string): Promise<void> {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category) {
      throw new NotFoundException('category.not_found');
    }
  }
}
