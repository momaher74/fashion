import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SubCategory,
  SubCategoryDocument,
} from '../schemas/subcategory.schema';
import { Multilingual } from '../common/interfaces/multilingual.interface';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class SubCategoryService {
  constructor(
    @InjectModel(SubCategory.name)
    private subCategoryModel: Model<SubCategoryDocument>,
  ) {}

  async create(
    name: Multilingual,
    categoryId: string,
    image?: string,
  ): Promise<SubCategoryDocument> {
    const subCategory = new this.subCategoryModel({
      name,
      categoryId: new Types.ObjectId(categoryId),
      image,
    });
    return subCategory.save();
  }

  async findAll(
    categoryId?: string,
    language: Language = Language.EN,
  ): Promise<any[]> {
    const query: any = { isActive: true };
    if (categoryId) {
      query.categoryId = new Types.ObjectId(categoryId);
    }

    const subCategories = await this.subCategoryModel
      .find(query)
      .populate('categoryId', 'name')
      .exec();

    return subCategories.map((subCat) => ({
      id: subCat._id.toString(),
      name: subCat.name[language] || subCat.name.en || subCat.name.ar,
      nameMultilingual: subCat.name,
      categoryId: subCat.categoryId.toString(),
      category: subCat.categoryId,
      image: subCat.image,
      isActive: subCat.isActive,
      createdAt: subCat.createdAt,
      updatedAt: subCat.updatedAt,
    }));
  }

  async findById(id: string, language: Language = Language.EN): Promise<any> {
    const subCategory = await this.subCategoryModel
      .findById(id)
      .populate('categoryId', 'name')
      .exec();
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }

    return {
      id: subCategory._id.toString(),
      name:
        subCategory.name[language] ||
        subCategory.name.en ||
        subCategory.name.ar,
      nameMultilingual: subCategory.name,
      categoryId: subCategory.categoryId.toString(),
      category: subCategory.categoryId,
      image: subCategory.image,
      isActive: subCategory.isActive,
      createdAt: subCategory.createdAt,
      updatedAt: subCategory.updatedAt,
    };
  }

  async findByCategoryId(
    categoryId: string,
    language: Language = Language.EN,
  ): Promise<any[]> {
    return this.findAll(categoryId, language);
  }

  async update(
    id: string,
    updateData: Partial<Omit<SubCategory, 'categoryId'>> & {
      categoryId?: string | Types.ObjectId;
    },
  ): Promise<SubCategoryDocument> {
    const data: Partial<SubCategory> = { ...updateData } as any;

    if (updateData.categoryId && typeof updateData.categoryId === 'string') {
      data.categoryId = new Types.ObjectId(updateData.categoryId);
    }

    const subCategory = await this.subCategoryModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    );
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
    return subCategory;
  }

  async remove(id: string): Promise<void> {
    const subCategory = await this.subCategoryModel.findByIdAndDelete(id);
    if (!subCategory) {
      throw new NotFoundException('SubCategory not found');
    }
  }
}
