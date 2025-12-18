import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Language } from '../common/enums/language.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.verifyAndCreateUser(loginDto.idToken);
    return {
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
      },
    };
  }

  @Post('login/:language')
  async loginWithLanguage(
    @Body() loginDto: LoginDto,
    @Body('language') language: Language,
  ) {
    const user = await this.authService.verifyAndCreateUser(
      loginDto.idToken,
      language,
    );
    return {
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
      },
    };
  }

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const dbUser = await this.authService.getUserByFirebaseUid(
      user.firebaseUid,
    );
    if (!dbUser) {
      throw new Error('User not found');
    }
    return {
      user: {
        id: dbUser._id,
        firebaseUid: dbUser.firebaseUid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        language: dbUser.language,
      },
    };
  }

  @Post('google')
  async googleLogin(@Body() loginDto: LoginDto) {
    const user = await this.authService.verifyAndCreateUser(loginDto.idToken);
    return {
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
      },
    };
  }

  @Post('apple')
  async appleLogin(@Body() loginDto: LoginDto) {
    const user = await this.authService.verifyAndCreateUser(loginDto.idToken);
    return {
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
      },
    };
  }
}

