import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseUid });
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<UserDocument> {
    const user = await this.findById(id);
    Object.assign(user, updateDto);
    return user.save();
  }

  async updateFcmToken(id: string, fcmToken: string): Promise<UserDocument> {
    const user = await this.findById(id);
    user.fcmToken = fcmToken;
    return user.save();
  }
}

