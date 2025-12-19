import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story, StoryDocument, StoryMediaType } from '../schemas/story.schema';
import { Language } from '../common/enums/language.enum';

interface CreateStoryInput {
  title?: { ar: string; en: string };
  mediaUrl: string;
  mediaType: StoryMediaType;
  categoryId?: string;
  subCategoryId?: string;
  productId?: string;
}

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private storyModel: Model<StoryDocument>,
  ) {}

  async create(input: CreateStoryInput) {
    const doc = new this.storyModel({
      title: input.title,
      mediaUrl: input.mediaUrl,
      mediaType: input.mediaType,
      categoryId: input.categoryId ? new Types.ObjectId(input.categoryId) : undefined,
      subCategoryId: input.subCategoryId ? new Types.ObjectId(input.subCategoryId) : undefined,
      productId: input.productId ? new Types.ObjectId(input.productId) : undefined,
      isActive: true,
    });
    return doc.save();
  }

  async findActive(language: Language = Language.AR, userId?: string) {
    const stories = await this.storyModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    return stories.map((s) => ({
      id: s._id.toString(),
      title: s.title ? (s.title[language] || s.title.en || s.title.ar) : undefined,
      titleMultilingual: s.title,
      mediaUrl: s.mediaUrl,
      mediaType: s.mediaType,
      categoryId: s.categoryId?.toString(),
      subCategoryId: s.subCategoryId?.toString(),
      productId: s.productId?.toString(),
      seen: userId ? s.seenBy.some((u) => u.toString() === userId) : false,
      createdAt: s.createdAt,
    }));
  }

  async markSeen(storyId: string, userId: string) {
    const res = await this.storyModel.findByIdAndUpdate(
      storyId,
      { $addToSet: { seenBy: new Types.ObjectId(userId) } },
      { new: true },
    );
    if (!res) throw new NotFoundException('story.not_found');
    return { message: 'Story marked as seen' };
  }
}
