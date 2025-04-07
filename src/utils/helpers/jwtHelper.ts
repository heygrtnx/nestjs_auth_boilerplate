import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import * as argon from 'argon2';
import { handleResponse } from '../common';
import { AuthHelper } from './authHelper';
import { Response } from 'express';
@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly authHelper: AuthHelper,
  ) {}

  private parseExpiryToMs(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));

    switch (unit) {
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000; // Default to 7 days
    }
  }

  async generateTokens(userId: string, isRefresh = false) {
    // Update tokenVersion and fetch latest user data in one query
    const user = await this.prisma.user.update({
      where: { userId },
      data: isRefresh ? { tokenVersion: { increment: 1 } } : {},
      select: { tokenVersion: true },
    });

    if (!user) throw new Error('User not found');

    const payload = { sub: userId, tokenVersion: user.tokenVersion };

    // Get expiry times from env
    const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY || '15m';
    const refreshTokenExpiryStr = process.env.REFRESH_TOKEN_EXPIRY || '7d';

    // Generate tokens
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.SECRET_KEY || 'fallback-secret',
      expiresIn: accessTokenExpiry,
    });

    if (!isRefresh) {
      const refreshToken = await this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_SECRET_KEY || 'fallback-refresh-secret',
        expiresIn: refreshTokenExpiryStr,
      });

      // Hash refresh token and store it in DB
      const hashedToken = await argon.hash(refreshToken);
      const refreshTokenExpiry = new Date(
        Date.now() + this.parseExpiryToMs(refreshTokenExpiryStr),
      );

      await this.prisma.user.update({
        where: { userId },
        data: { refreshToken: hashedToken, refreshTokenExpiry },
      });

      return { accessToken, refreshToken };
    }

    // If it's a refresh, return only the new access token
    return { accessToken };
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { refreshToken: true, refreshTokenExpiry: true },
    });

    //if user has a refresh token
    if (user && user.refreshToken) {
      //verify refreshotken
      const isRefreshTokenValid = await argon.verify(
        user.refreshToken,
        refreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new handleResponse(
          HttpStatus.BAD_REQUEST,
          'Invalid refresh token',
        );
      }

      //check if refresh token is expired
      if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
        //generate new tokens
        return await this.generateTokens(userId);
      }

      //refresh new access token if refresh token is not expired
      return await this.generateTokens(userId, true);
    }

    return await this.generateTokens(userId);
  }

  async refreshLogin(user: string, refreshToken: string, res: Response) {
    const isRefreshTokenValid = await this.validateRefreshToken(
      user,
      refreshToken,
    );

    if (!isRefreshTokenValid.refreshToken) {
      this.authHelper.setAuthCookie(
        res,
        'accessToken',
        isRefreshTokenValid.accessToken,
        process.env.ACCESS_TOKEN_EXPIRY ?? '15m',
      );
      return { accessToken: isRefreshTokenValid.accessToken };
    }

    const tokens = {
      accessToken: {
        name: 'accessToken',
        value: isRefreshTokenValid.accessToken,
        expiry: process.env.ACCESS_TOKEN_EXPIRY ?? '15m',
      },
      refreshToken: {
        name: 'refreshToken',
        value: isRefreshTokenValid.refreshToken,
        expiry: process.env.REFRESH_TOKEN_EXPIRY ?? '15m',
      },
    };

    // Set both cookies and return token values
    Object.values(tokens).forEach(({ name, value, expiry }) => {
      this.authHelper.setAuthCookie(res, name, value, expiry);
    });

    return {
      accessToken: isRefreshTokenValid.accessToken,
      refreshToken: isRefreshTokenValid.refreshToken,
    };
  }
}
