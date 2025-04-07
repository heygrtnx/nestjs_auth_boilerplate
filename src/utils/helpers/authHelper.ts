import { Injectable, Global } from '@nestjs/common';
import * as argon from 'argon2';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SendMailsService } from 'src/lib/email/sendMail.service';
import { handleResponse } from 'src/utils';
import { HttpStatus } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { Response } from 'express';

@Global()
@Injectable()
export class AuthHelper {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly sendMail: SendMailsService,
  ) {}

  // Helper function to hash password
  hashData = async (data: string) => {
    return await argon.hash(data);
  };

  //helper funtion to verify hashed data
  verifyHashedData = async (hashedData: string, data: string) => {
    return await argon.verify(hashedData, data);
  };

  // Helper function to generate OTP
  generateOtp = async (length: number = 4): Promise<number> => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1));
  };

  // Helper function to generate referral code
  generateRefCode = async (): Promise<string> => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  };

  // Helper function to generate OTP expiration date
  generateOtpExpiration = async (minutes: number = 2): Promise<Date> => {
    const otpExpiration = new Date();
    otpExpiration.setMinutes(otpExpiration.getMinutes() + minutes);
    return otpExpiration;
  };

  // Helper function to send email
  sendEmail = async (
    firstName: string,
    lastName: string,
    email: string,
    template: string,
    subject: string,
    value?: string,
    valueKey?: string,
  ) => {
    const to = {
      name: firstName,
      address: email,
    };
    const context = {
      name: `${firstName} ${lastName}`,
      ...(valueKey && value && { [valueKey]: value }),
      platform: this.configService.get<string>('PLATFORM_NAME'),
      platformMail: this.configService.get<string>('PLATFORM_SUPPORT'),
      currentYear: new Date().getFullYear(),
    };

    const emailSent = await this.sendMail.sendEmail(
      to,
      subject,
      template,
      context,
    );

    if (!emailSent) {
      throw new handleResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to send email',
      );
    }
  };

  //helper function to send alarm notification
  sendAlarmNotification = async (message: string) => {
    const developers = await this.prisma.user.findMany({
      where: {
        role: Role.DEVELOPER,
      },
      include: {
        Admins: {
          where: {
            inviteStatus: Status.APPROVED,
          },
        },
      },
    });

    const to = developers.map((dev) => ({
      name: `${dev.firstName} ${dev.lastName}`,
      address: dev.email,
    }));

    const subject = 'Error on Mobiflex!';
    const template = 'alarmNotification';
    const context = {
      message,
      platform: this.configService.get<string>('PLATFORM_NAME'),
      currentYear: new Date().getFullYear(),
    };

    const emailPromises = to.map((recipient) =>
      this.sendMail.sendEmail(recipient, subject, template, context),
    );

    try {
      await Promise.all(emailPromises);
    } catch (error) {
      throw new handleResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        'Failed to send email',
      );
    }
  };

  //helper function to validate admin
  validateAdmin = async (identifier: string) => {
    const admin = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { userId: identifier }],
      },
      include: {
        Admins: true,
      },
    });

    // Check if admin exists in the database
    if (!admin || !admin.Admins) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'User not found in admin record',
      );
    }

    // Verify if user has admin privileges
    if (!['ADMIN', 'SUPER_ADMIN', 'DEVELOPER'].includes(admin.role)) {
      throw new handleResponse(
        HttpStatus.UNAUTHORIZED,
        'You dont have admin privileges',
      );
    }

    return admin;
  };

  //helper function to sanitize response
  sanitizeUser(data: any) {
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.otp;
    delete sanitized.otpExpiry;
    delete sanitized.refreshToken;
    delete sanitized.refreshTokenExpiry;
    delete sanitized.tokenVersion;
    if (sanitized.Admins) {
      delete sanitized.Admins.password;
    }
    return sanitized;
  }

  //validate user account
  validateUserAccount = async (searchParams: {
    email?: string;
    telephoneNumber?: string;
    userId?: string;
  }) => {
    if (
      !searchParams.email &&
      !searchParams.telephoneNumber &&
      !searchParams.userId
    ) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'At least one search parameter is required',
      );
    }

    const whereClause: any = {};
    if (searchParams.email) whereClause.email = searchParams.email;
    if (searchParams.telephoneNumber)
      whereClause.telephoneNumber = searchParams.telephoneNumber;
    if (searchParams.userId) whereClause.userId = searchParams.userId;

    const user = await this.prisma.user.findUnique({
      where: whereClause,
      include: {
        Wallet: true,
        WalletBalance: true,
      },
    });

    if (!user) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'User not found');
    }

    return user;
  };

  parseExpiryToMs(expiry: string): number {
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

  parseExpiryToCookie(expiry: string): number {
    const unit = expiry.slice(-1); // Get the last character (unit)
    const value = parseInt(expiry.slice(0, -1)); // Get the numeric part of expiry

    if (isNaN(value)) {
      throw new Error('Invalid expiry value');
    }

    switch (unit) {
      case 'm':
        return value * 60 * 1000; // Minutes to milliseconds
      case 'h':
        return value * 60 * 60 * 1000; // Hours to milliseconds
      case 'd':
        return value * 24 * 60 * 60 * 1000; // Days to milliseconds
      default:
        throw new Error(`Invalid expiry unit: ${unit}`); // Throw error if unit is invalid
    }
  }

  // ✅ Set authentication cookie
  setAuthCookie(res: Response, name: string, value: string, expiry: string) {
    try {
      const maxAge = this.parseExpiryToMs(expiry);

      const isLive = process.env.ENVIRONMENT === 'LIVE';
      const domain =
        isLive && process.env.PLATFORM_DOMAIN
          ? process.env.PLATFORM_DOMAIN
          : undefined;

      res.cookie(name, value, {
        httpOnly: true,
        //secure: !!domain, // Secure true in prod (over HTTPS)
        secure: true,
        //sameSite: domain ? 'none' : 'lax', // 'none' for cross-site, 'lax' for dev
        sameSite: 'none',
        maxAge,
        domain, // Only set in prod
        path: '/',
      });

      console.log(`✅ Cookie "${name}" set successfully`);
    } catch (error: any) {
      console.error('❌ Error setting cookie:', error.message);
    }
  }

  // ✅ Remove authentication cookie
  removeAuthCookie(res: Response, name: string) {
    try {
      const isLive = process.env.ENVIRONMENT === 'LIVE';
      const domain =
        isLive && process.env.PLATFORM_DOMAIN
          ? process.env.PLATFORM_DOMAIN
          : undefined;

      res.cookie(name, '', {
        httpOnly: true,
        //secure: !!domain, // Match production HTTPS settings
        secure: true,
        //sameSite: domain ? 'none' : 'lax', // Match SameSite strategy
        sameSite: 'none',
        maxAge: 0, // Deletes the cookie
        domain,
        path: '/',
      });

      console.log(`✅ Cookie "${name}" removed successfully`);
    } catch (error: any) {
      console.error('❌ Error removing cookie:', error.message);
    }
  }
}
