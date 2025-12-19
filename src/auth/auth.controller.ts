import { Controller, Post, Body, Get, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { AppleLoginDto } from './dto/apple-login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LanguageHeader } from '../common/decorators/language.decorator';
import { Language } from '../common/enums/language.enum';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @LanguageHeader() language: Language,
  ) {
    const { user, token } = await this.authService.register(registerDto, language);
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        authProvider: user.authProvider,
      },
      token,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const { user, token } = await this.authService.login(loginDto);
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        authProvider: user.authProvider,
      },
      token,
    };
  }

  @Post('google')
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @LanguageHeader() language: Language,
  ) {
    const { user, token } = await this.authService.googleLogin(
      googleLoginDto.idToken,
      language,
    );
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        authProvider: user.authProvider,
        avatar: user.avatar,
      },
      token,
    };
  }

  @Post('apple')
  async appleLogin(
    @Body() appleLoginDto: AppleLoginDto,
    @LanguageHeader() language: Language,
  ) {
    const { user, token } = await this.authService.appleLogin(
      appleLoginDto.idToken,
      appleLoginDto.email,
      appleLoginDto.name,
      language,
    );
    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        language: user.language,
        authProvider: user.authProvider,
      },
      token,
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    const dbUser = await this.authService.getUserById(user.id);
    if (!dbUser) {
      throw new NotFoundException('auth.user_not_found');
    }
    return {
      user: {
        id: dbUser._id,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        language: dbUser.language,
        authProvider: dbUser.authProvider,
        avatar: dbUser.avatar,
      },
    };
  }
}

