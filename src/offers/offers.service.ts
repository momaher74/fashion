import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Offer, OfferDocument } from '../schemas/offer.schema';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';

@Injectable()
export class OffersService {
  constructor(
    @InjectModel(Offer.name) private offerModel: Model<OfferDocument>,
  ) {}

  async create(createDto: CreateOfferDto): Promise<OfferDocument> {
    const offer = new this.offerModel({
      ...createDto,
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
    });
    return offer.save();
  }

  async findAll(): Promise<OfferDocument[]> {
    return this.offerModel.find().populate('productId').exec();
  }

  async findActive(): Promise<OfferDocument[]> {
    const now = new Date();
    return this.offerModel
      .find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
      .populate('productId')
      .exec();
  }

  async findOne(id: string): Promise<OfferDocument> {
    const offer = await this.offerModel.findById(id).populate('productId');
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  async update(id: string, updateDto: UpdateOfferDto): Promise<OfferDocument> {
    const updateData: any = { ...updateDto };
    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }
    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    const offer = await this.offerModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return offer;
  }

  async remove(id: string) {
    const offer = await this.offerModel.findByIdAndDelete(id);
    if (!offer) {
      throw new NotFoundException('Offer not found');
    }
    return { message: 'Offer deleted' };
  }
}

