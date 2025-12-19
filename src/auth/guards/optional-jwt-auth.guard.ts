import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // Try to authenticate, but don't throw error if token is missing or invalid
    const result = super.canActivate(context);
    
    if (result instanceof Promise) {
      return result.catch(() => true);
    }
    
    if (result instanceof Observable) {
      return result.pipe(
        map(() => true),
        catchError(() => of(true))
      );
    }
    
    // If it's a boolean, return it
    return result;
  }

  handleRequest(err: any, user: any) {
    // Return user if authenticated, otherwise return null (don't throw error)
    return user || null;
  }
}
