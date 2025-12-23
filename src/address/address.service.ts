import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from '../schemas/address.schema'; // ✅ fixed
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,
  ) {}

  async create(createAddressDto: CreateAddressDto): Promise<Address> {
    return new this.addressModel(createAddressDto).save();
  }

  async findAll(): Promise<Address[]> {
    return this.addressModel.find().exec();
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressModel.findById(id).exec();
    if (!address) {
      throw new NotFoundException('Address not found');
    }
    return address;
  }

  async update(
    id: string,
    updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    const address = await this.addressModel
      .findByIdAndUpdate(id, updateAddressDto, {
        new: true,       // return updated document
        runValidators: true,
      })
      .exec();

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async delete(id: string): Promise<void> {
    const result = await this.addressModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Address not found');
    }
  }
}
