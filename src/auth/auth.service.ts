import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from '../schemas/user.schema';
import { Role } from '../common/enums/role.enum';
import { Language } from '../common/enums/language.enum';
import { AuthProvider } from '../common/enums/auth-provider.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Session, SessionDocument } from '../schemas/session.schema';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  async register(registerDto: RegisterDto, language?: Language) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('auth.user_exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.userModel.create({
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
      role: Role.USER,
      language: language || Language.AR,
      authProvider: AuthProvider.EMAIL,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    // Check if user has password (email auth)
    if (!user.password) {
      throw new UnauthorizedException('auth.social_login_required');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('auth.invalid_credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, ...tokens };
  }

  async googleLogin(idToken: string, language?: Language) {
    try {
      // Verify Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('auth.google_token_invalid');
      }

      const email = payload.email;
      if (!email) {
        throw new UnauthorizedException('auth.email_required');
      }

      // Find or create user
      let user = await this.userModel.findOne({ email });

      if (!user) {
        user = await this.userModel.create({
          email,
          name: payload.name || payload.email?.split('@')[0] || '',
          role: Role.USER,
          language: language || Language.AR,
          authProvider: AuthProvider.GOOGLE,
          avatar: payload.picture,
        });
      } else {
        // Update language if provided
        if (language && user.language !== language) {
          user.language = language;
          await user.save();
        }
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return { user, ...tokens };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('auth.google_token_invalid');
    }
  }

  async appleLogin(
    idToken: string,
    email?: string,
    name?: string,
    language?: Language,
  ) {
    try {
      // Apple ID token verification
      // Note: For production, you should verify the token with Apple's servers
      // This is a simplified version - you may want to use a library like apple-auth
      const decodedToken = this.decodeAppleToken(idToken);

      const userEmail = email || decodedToken.email;
      if (!userEmail) {
        throw new UnauthorizedException('auth.email_required');
      }

      // Find or create user
      let user = await this.userModel.findOne({ email: userEmail });

      if (!user) {
        user = await this.userModel.create({
          email: userEmail,
          name: name || userEmail.split('@')[0],
          role: Role.USER,
          language: language || Language.AR,
          authProvider: AuthProvider.APPLE,
        });
      } else {
        // Update language if provided
        if (language && user.language !== language) {
          user.language = language;
          await user.save();
        }
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return { user, ...tokens };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('auth.apple_token_invalid');
    }
  }

  async getUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async getUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  private async generateTokens(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
      expiresIn: '30d',
    });

    // Hash and store refresh token in session
    const hashedRT = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await this.sessionModel.create({
      userId: user._id,
      refreshToken: hashedRT,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('auth.user_not_found');
      }

      // Check if session exists and RT matches
      const sessions = await this.sessionModel.find({ userId: user._id });

      let currentSession = null;
      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refreshToken);
        if (isMatch) {
          currentSession = session;
          break;
        }
      }

      if (!currentSession) {
        throw new UnauthorizedException('auth.session_expired');
      }

      // Token Rotation: Delete old session and issue new tokens
      await this.sessionModel.findByIdAndDelete(currentSession._id);

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('auth.session_invalid');
    }
  }

  async verifySession(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('auth.user_not_found');
      }

      // Check session in DB
      const sessions = await this.sessionModel.find({ userId: user._id });
      let sessionExists = false;
      for (const session of sessions) {
        if (await bcrypt.compare(refreshToken, session.refreshToken)) {
          sessionExists = true;
          break;
        }
      }

      if (!sessionExists) {
        throw new UnauthorizedException('auth.session_invalid');
      }

      // Return user and new tokens (Facebook-like check-in)
      const tokens = await this.generateTokens(user);
      return { user, ...tokens };
    } catch (error) {
      throw new UnauthorizedException('auth.session_invalid');
    }
  }

  async logout(refreshToken: string) {
    const payload = this.jwtService.decode(refreshToken) as any;
    if (!payload || !payload.sub) return;

    const sessions = await this.sessionModel.find({ userId: payload.sub });
    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.refreshToken)) {
        await this.sessionModel.findByIdAndDelete(session._id);
        break;
      }
    }
  }

  async revokeAllSessions(userId: string) {
    await this.sessionModel.deleteMany({ userId });
  }

  private decodeAppleToken(idToken: string): any {
    // Simple JWT decode - in production, verify with Apple's public keys
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        Buffer.from(base64, 'base64')
          .toString()
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new UnauthorizedException('auth.apple_token_invalid');
    }
  }
}

