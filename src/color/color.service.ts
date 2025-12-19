import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Color, ColorDocument } from '../schemas/color.schema';

@Injectable()
export class ColorService {
  constructor(
    @InjectModel(Color.name) private colorModel: Model<ColorDocument>,
  ) {}

  async create(name: string, hexCode?: string): Promise<ColorDocument> {
    const color = new this.colorModel({ name, hexCode });
    return color.save();
  }

  async findAll(): Promise<ColorDocument[]> {
    return this.colorModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<ColorDocument | null> {
    return this.colorModel.findById(id).exec();
  }

  async findByName(name: string): Promise<ColorDocument | null> {
    return this.colorModel.findOne({ name }).exec();
  }

  async update(id: string, updateData: Partial<Color>): Promise<ColorDocument> {
    const color = await this.colorModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!color) {
      throw new NotFoundException('color.not_found');
    }
    return color;
  }

  async remove(id: string): Promise<void> {
    const color = await this.colorModel.findByIdAndDelete(id);
    if (!color) {
      throw new NotFoundException('color.not_found');
    }
  }
}
