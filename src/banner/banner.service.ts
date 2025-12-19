import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from '../schemas/banner.schema';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class BannerService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  async getActiveBanners(language: Language = Language.AR) {
    const now = new Date();
    const banners = await this.bannerModel
      .find({
        isActive: true,
        $and: [
          {
            $or: [
              { startDate: { $exists: false } },
              { startDate: { $lte: now } },
            ],
          },
          {
            $or: [
              { endDate: { $exists: false } },
              { endDate: { $gte: now } },
            ],
          },
        ],
      })
      .populate('categoryId', 'name')
      .populate('subCategoryId', 'name')
      .populate('productId', 'name images price')
      .sort({ order: 1, createdAt: -1 })
      .exec();

    return banners.map((banner) => ({
      id: banner._id.toString(),
      title: banner.title[language] || banner.title.ar || banner.title.en,
      description: banner.description
        ? banner.description[language] ||
          banner.description.ar ||
          banner.description.en
        : undefined,
      image: banner.image,
      categoryId: banner.categoryId
        ? (banner.categoryId as any)._id?.toString()
        : undefined,
      categoryName: banner.categoryId
        ? (banner.categoryId as any).name?.[language] ||
          (banner.categoryId as any).name?.ar ||
          (banner.categoryId as any).name?.en
        : undefined,
      subCategoryId: banner.subCategoryId
        ? (banner.subCategoryId as any)._id?.toString()
        : undefined,
      subCategoryName: banner.subCategoryId
        ? (banner.subCategoryId as any).name?.[language] ||
          (banner.subCategoryId as any).name?.ar ||
          (banner.subCategoryId as any).name?.en
        : undefined,
      productId: banner.productId
        ? (banner.productId as any)._id?.toString()
        : undefined,
      link: banner.link,
      order: banner.order,
    }));
  }
}
