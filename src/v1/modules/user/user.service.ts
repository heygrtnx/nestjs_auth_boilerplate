import { HttpStatus, Injectable } from '@nestjs/common';
import { PaystackService } from 'src/lib/paystack/paystack.service';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { handleResponse, AuthHelper } from 'src/utils';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authHelper: AuthHelper,
    private readonly paystackService: PaystackService,
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        Wallet: true,
        WalletBalance: true,
        Referral: true,
      },
    });

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'User not found');
    }

    //sanitize the user data
    const sanitizedUser = this.authHelper.sanitizeUser(user);

    return new handleResponse(
      HttpStatus.OK,
      'User found',
      sanitizedUser,
    ).getResponse();
  }

  async getAllUsers(email: string) {
    await this.authHelper.validateAdmin(email);

    const users = await this.prisma.user.findMany({
      include: {
        Wallet: true,
        WalletBalance: true,
        Referral: true,
      },
    });

    if (!users) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Users not found');
    }

    //sanitize the user data
    const sanitizedUsers = users.map((user) =>
      this.authHelper.sanitizeUser(user),
    );

    return new handleResponse(
      HttpStatus.OK,
      'Users fetched successfully',
      sanitizedUsers,
    ).getResponse();
  }

  async getUserById(userId: string, email: string) {
    await this.authHelper.validateAdmin(email);

    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        Wallet: true,
        WalletBalance: true,
        Referral: true,
      },
    });

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'User not found');
    }

    //sanitize the user data
    const sanitizedUser = this.authHelper.sanitizeUser(user);

    return new handleResponse(
      HttpStatus.OK,
      'User found',
      sanitizedUser,
    ).getResponse();
  }

  async subscribe(userId: string, subscription: any) {
    const user = await this.prisma.pushSubscription.upsert({
      where: { userId },
      update: { subscription },
      create: { userId, subscription },
    });

    if (!user) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'User not found');
    }

    return new handleResponse(
      HttpStatus.OK,
      'Subscription',
      user,
    ).getResponse();
  }

  async unsubscribe(userId: string, endpoint: string) {
    const data = await this.prisma.pushSubscription.deleteMany({
      where: {
        userId,
        subscription: {
          path: ['endpoint'], // Check inside the JSON subscription object
          equals: endpoint,
        },
      },
    });

    if (!data) {
      throw new handleResponse(HttpStatus.NOT_FOUND, 'Subscription not found');
    }

    return new handleResponse(
      HttpStatus.OK,
      'Unsubscribed successfully',
      data,
    ).getResponse();
  }
}
