import { HttpStatus, Injectable } from '@nestjs/common';
import { handleResponse, AuthHelper, TokenService } from 'src/utils';
import { AdminLoginDto } from 'src/v1/dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { Response } from 'express';
@Injectable()
export class AdminService {
  constructor(
    private authHelper: AuthHelper,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: AdminLoginDto, res: Response) {
    const admin = await this.authHelper.validateAdmin(loginDto.email);

    // Verify if password is correct
    const isPasswordValid = await this.authHelper.verifyHashedData(
      admin.Admins?.password ?? '',
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Password Incorrect');
    }

    // Generate JWT token and set cookies
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(admin.userId);
    const tokens = {
      accessToken: {
        name: 'accessToken',
        value: accessToken,
        expiry: process.env.ACCESS_TOKEN_EXPIRY ?? '15m',
      },
      refreshToken: {
        name: 'refreshToken',
        value: refreshToken,
        expiry: process.env.REFRESH_TOKEN_EXPIRY ?? '7d',
      },
    };

    // Set both cookies using a single loop
    Object.values(tokens).forEach(({ name, value, expiry }) => {
      this.authHelper.setAuthCookie(res, name, value as string, expiry);
    });

    const sanitizedAdminData = this.authHelper.sanitizeUser(admin);

    return new handleResponse(HttpStatus.OK, 'Admin login successful', {
      ...sanitizedAdminData,
    }).getResponse();
  }
  //view admin profile
  async viewProfile(email: string) {
    const admin = await this.authHelper.validateAdmin(email);

    const sanitizedAdminData = this.authHelper.sanitizeUser(admin);

    return new handleResponse(
      HttpStatus.OK,
      'Admin profile fetched successfully',
      sanitizedAdminData,
    ).getResponse();
  }

  //logout
  async logout(userId: string, res: Response) {
    //generate random number
    const randomNumber = Math.floor(Math.random() * 1000000);

    // Clear refresh token and optionally increment tokenVersion
    await this.prisma.user.update({
      where: { userId },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null,
        isActive: false,
        tokenVersion: { increment: randomNumber }, // Optional: Ensures all tokens are invalid
      },
    });

    //remove cookies
    ['accessToken', 'refreshToken'].forEach((token) =>
      this.authHelper.removeAuthCookie(res, token),
    );

    return new handleResponse(HttpStatus.OK, 'Logout successful').getResponse();
  }
}
