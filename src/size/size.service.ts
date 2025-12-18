import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Size, SizeDocument } from '../schemas/size.schema';

@Injectable()
export class SizeService {
  constructor(
    @InjectModel(Size.name) private sizeModel: Model<SizeDocument>,
  ) {}

  async create(name: string): Promise<SizeDocument> {
    const size = new this.sizeModel({ name });
    return size.save();
  }

  async findAll(): Promise<SizeDocument[]> {
    return this.sizeModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<SizeDocument | null> {
    return this.sizeModel.findById(id).exec();
  }

  async findByName(name: string): Promise<SizeDocument | null> {
    return this.sizeModel.findOne({ name }).exec();
  }

  async update(id: string, updateData: Partial<Size>): Promise<SizeDocument> {
    const size = await this.sizeModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!size) {
      throw new NotFoundException('Size not found');
    }
    return size;
  }

  async remove(id: string): Promise<void> {
    const size = await this.sizeModel.findByIdAndDelete(id);
    if (!size) {
      throw new NotFoundException('Size not found');
    }
  }
}
