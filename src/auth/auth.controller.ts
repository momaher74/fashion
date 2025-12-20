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
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @LanguageHeader() language: Language,
  ) {
    const result = await this.authService.register(registerDto, language);
    return {
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        language: result.user.language,
        authProvider: result.user.authProvider,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        language: result.user.language,
        authProvider: result.user.authProvider,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('google')
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @LanguageHeader() language: Language,
  ) {
    const result = await this.authService.googleLogin(
      googleLoginDto.idToken,
      language,
    );
    return {
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        language: result.user.language,
        authProvider: result.user.authProvider,
        avatar: result.user.avatar,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('apple')
  async appleLogin(
    @Body() appleLoginDto: AppleLoginDto,
    @LanguageHeader() language: Language,
  ) {
    const result = await this.authService.appleLogin(
      appleLoginDto.idToken,
      appleLoginDto.email,
      appleLoginDto.name,
      language,
    );
    return {
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        language: result.user.language,
        authProvider: result.user.authProvider,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
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

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refreshTokens(refreshToken);
    return tokens;
  }

  @Post('verify-session')
  async verifySession(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.verifySession(refreshToken);
    return {
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        language: result.user.language,
        authProvider: result.user.authProvider,
        avatar: result.user.avatar,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return { message: 'auth.logged_out_successfully' };
  }
}

