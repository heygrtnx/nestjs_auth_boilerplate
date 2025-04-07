import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto, LoginDto, VerifyOtpDto } from 'src/v1/dto';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { handleResponse, AuthHelper, TokenService } from 'src/utils';
import { Status } from '@prisma/client';
import { PaystackService } from 'src/lib/paystack/paystack.service';
import { Response } from 'express';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authHelper: AuthHelper,
    private readonly tokenService: TokenService,
    private readonly paystackService: PaystackService,
  ) {}

  //create user
  async create(createUserDto: CreateUserDto) {
    //check if email exists
    const emailExists = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (emailExists) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Email already exists');
    }

    //check if phone number exists
    const phoneExists = await this.prisma.user.findUnique({
      where: { telephoneNumber: createUserDto.telephoneNumber },
    });

    if (phoneExists) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'Phone number already exists',
      );
    }

    //generate otp and otp expiration date
    const otp = await this.authHelper.generateOtp();
    const otpExpiration = await this.authHelper.generateOtpExpiration();

    //hash the otp
    const hashedOtp = await this.authHelper.hashData(otp.toString());

    //create user
    const newUser = await this.prisma.user.create({
      data: {
        ...createUserDto,
        otp: hashedOtp,
        otpExpiry: otpExpiration,
      },
    });

    //send otp to user email
    await this.authHelper.sendEmail(
      newUser.firstName, //firstName
      newUser.lastName, //lastName
      newUser.email, //email
      'activateAccount', //template
      'Activate Account', //subject
      otp.toString(), //value
      'otpCode', //valueKey
    );

    //sanitixze user data
    const sanitizedUser = this.authHelper.sanitizeUser(newUser);

    return new handleResponse(
      HttpStatus.CREATED,
      'User Created Successfully',
      sanitizedUser,
    ).getResponse();
  }

  //verify otp
  async verifyOtp(verifyOtpDto: VerifyOtpDto, res: Response) {
    const user = await this.authHelper.validateUserAccount({
      telephoneNumber: verifyOtpDto.telephoneNumber,
    });

    // Check if OTP exists
    if (!user.otp) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'No existing OTP saved for this account',
      );
    }

    //verify hashed otp
    const isRightOtp = await this.authHelper.verifyHashedData(
      user.otp,
      verifyOtpDto.otp,
    );

    if (!isRightOtp) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'Wrong OTP');
    }

    //check if otp is expired
    const isOtpExpired =
      user.otp && user.otpExpiry && user.otpExpiry < new Date();

    if (isOtpExpired) {
      throw new handleResponse(
        HttpStatus.BAD_REQUEST,
        'OTP expired, please request for a new OTP',
      );
    }

    //create random refcode
    const referralCode = await this.authHelper.generateRefCode();

    //update user account status
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        ...(user.accountStatus === Status.PENDING && {
          isActive: true,
          accountStatus: Status.ACTIVE,
        }),
        otp: null,
        otpExpiry: null,
        referralCode,
      },
    });

    // Create Paystack customer
    const paystackCustomer = await this.paystackService.createPaystackCustomer(
      user.email,
      user.firstName,
      user.lastName,
      user.telephoneNumber,
    );

    if (paystackCustomer.status === true) {
      const paystackAccount = await this.paystackService.createDedicatedAccount(
        paystackCustomer.data.customer_code,
      );

      // Check if the user already exists in the walletBalance database
      const existingUser = await this.prisma.walletBalance.findUnique({
        where: {
          userId: user.userId,
        },
      });

      // If the user does not exist, create a new entry
      if (!existingUser) {
        await this.prisma.walletBalance.create({
          data: {
            userId: user.userId,
          },
        });
      }

      // Check if a wallet with the same accountNumber exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: {
          accountNumber: paystackAccount.data.account_number,
        },
      });

      if (!existingWallet) {
        await this.prisma.wallet.create({
          data: {
            userId: user.userId,
            accountNumber: paystackAccount.data.account_number,
            bankName: paystackAccount.data.bank.name,
            accountName: paystackAccount.data.account_name,
            bankId: paystackAccount.data.bank.id,
            currency: paystackAccount.data.currency,
            cust_code: paystackAccount.data.customer.customer_code,
            cust_id: paystackAccount.data.customer.id,
            dva_id: paystackAccount.data.id,
          },
        });
      }
    }

    //get the update user details
    const updatedUser = await this.authHelper.validateUserAccount({
      email: user.email,
    });

    // Check if the user already has a push subscription
    const existingSubscription = await this.prisma.pushSubscription.findFirst({
      where: { userId: user.userId },
    });

    // If no subscription exists, create one (otherwise, skip)
    if (!existingSubscription) {
      await this.prisma.pushSubscription.create({
        data: {
          userId: user.userId,
          subscription: {}, // Set this to the actual subscription data from the frontend
        },
      });
    }

    // Generate JWT token and set cookies
    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(user.userId);
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

    //sanitixze user data
    const sanitizedUser = this.authHelper.sanitizeUser(updatedUser);

    return new handleResponse(HttpStatus.OK, 'OTP verified successfully', {
      ...sanitizedUser,
    }).getResponse();
  }

  //resend otp
  async resendOtp(email: string) {
    const user = await this.authHelper.validateUserAccount({ email });

    //generate otp and otp expiration date
    const otp = await this.authHelper.generateOtp();
    const otpExpiration = await this.authHelper.generateOtpExpiration();
    //hash the otp
    const hashedOtp = await this.authHelper.hashData(otp.toString());

    //update user account
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        otp: hashedOtp,
        otpExpiry: otpExpiration,
      },
    });

    //send otp to email of agent
    await this.authHelper.sendEmail(
      user.firstName, //firstName
      user.lastName, //lastName
      email, //email
      'resend', //template
      'OTP Request', //subject
      otp.toString(), //value
      'otpCode', //valueKey
    );

    return new handleResponse(
      HttpStatus.OK,
      'OTP resent successfully',
    ).getResponse();
  }

  //login
  async login(loginDto: LoginDto) {
    const user = await this.authHelper.validateUserAccount({
      telephoneNumber: loginDto.telephoneNumber,
    });

    if (!user) {
      throw new handleResponse(HttpStatus.BAD_REQUEST, 'User not found');
    }

    //generate otp
    const otp = await this.authHelper.generateOtp();
    const otpExpiration = await this.authHelper.generateOtpExpiration();

    //hash the otp
    const hashedOtp = await this.authHelper.hashData(otp.toString());

    //update the db
    await this.prisma.user.update({
      where: { userId: user.userId },
      data: {
        otp: hashedOtp,
        otpExpiry: otpExpiration,
        refreshToken: null,
      },
    });

    //send the otp to email
    await this.authHelper.sendEmail(
      user.firstName, //firstName
      user.lastName, //lastName
      user.email, //email
      'login', //template
      'Login OTP', //subject
      otp.toString(), //value
      'otpCode', //valueKey
    );

    return new handleResponse(
      HttpStatus.OK,
      'Login OTP sent successful',
    ).getResponse();
  }

  //logout
  async logout(userId: string, res: Response) {
    //validate user
    await this.authHelper.validateUserAccount({ userId });

    //generate random number
    const randomNumber = Math.floor(Math.random() * 1000000);

    //update db with token and active status
    await this.prisma.user.update({
      where: { userId },
      data: {
        refreshToken: null,
        isActive: false,
        refreshTokenExpiry: null,
        tokenVersion: { increment: randomNumber },
      },
    });

    //remove cookies
    ['accessToken', 'refreshToken'].forEach((token) =>
      this.authHelper.removeAuthCookie(res, token),
    );

    return new handleResponse(HttpStatus.OK, 'Logout successful').getResponse();
  }
}
