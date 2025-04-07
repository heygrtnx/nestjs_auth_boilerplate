import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { TokenService } from '../../helpers';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private readonly tokenService: TokenService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    // Extract tokens
    const accessToken = req.cookies['accessToken'];
    const refreshToken = req.cookies['refreshToken'];
    const secret = process.env.REFRESH_SECRET_KEY || 'fallback-secret';

    console.log('🔍 Checking tokens...');

    // If access token exists, proceed normally
    if (accessToken) {
      try {
        const isAuthenticated = (await super.canActivate(context)) as boolean;
        console.log('✅ Authentication result:', isAuthenticated);
        return isAuthenticated;
      } catch (err) {
        console.error('❌ Access token verification failed:', err.message);
      }
    }

    // If no access token but a refresh token is available, attempt refresh
    if (!accessToken && refreshToken) {
      try {
        console.log('🔄 Attempting to refresh access token...');

        // Decode the refresh token
        const decoded = jwt.verify(refreshToken, secret);

        // Validate and get new access token
        const newTokenData = await this.tokenService.refreshLogin(
          decoded.sub as string,
          refreshToken,
          res,
        );

        if (!newTokenData || !newTokenData.accessToken) {
          console.error('❌ Failed to retrieve new access token');
          throw new UnauthorizedException('Invalid or expired refresh token');
        }

        // **Manually update the request object with the new access token**
        req.cookies['accessToken'] = newTokenData.accessToken;

        // Retry authentication with the new access token
        const isAuthenticated = (await super.canActivate(context)) as boolean;
        console.log(
          '🚀 Retrying authentication after refresh:',
          isAuthenticated,
        );
        return isAuthenticated;
      } catch (error) {
        console.error('❌ Failed to refresh access token:', error.message);
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }

    console.log('🚫 Unauthorized: No valid access or refresh token found');
    throw new UnauthorizedException('Unauthorized');
  }
}
