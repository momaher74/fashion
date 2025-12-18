import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { User, UserDocument } from '../schemas/user.schema';
import { Role } from '../common/enums/role.enum';
import { Language } from '../common/enums/language.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async verifyAndCreateUser(idToken: string, language?: Language) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;

      let user = await this.userModel.findOne({ firebaseUid });

      if (!user) {
        user = await this.userModel.create({
          firebaseUid,
          email: decodedToken.email || '',
          name: decodedToken.name || decodedToken.email?.split('@')[0] || '',
          role: Role.USER,
          language: language || Language.EN,
        });
      }

      return user;
    } catch (error) {
      throw new Error('Invalid Firebase token');
    }
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseUid });
  }
}

