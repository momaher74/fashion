import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class OptionalFirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      // No token provided, continue without user
      return true;
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      };
      return true;
    } catch (error) {
      // Invalid token, continue without user
      return true;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
