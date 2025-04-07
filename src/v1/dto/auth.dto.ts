import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsPhoneNumber,
  IsEmail,
  IsString,
  IsOptional,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john.doe@example.com',
    required: true,
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Telephone number of the user',
    example: '+2348164664465',
    required: true,
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  telephoneNumber: string;

  @ApiProperty({
    description: 'Date of birth of the user',
    example: '1990-01-01',
    required: true,
  })
  @IsNotEmpty()
  @IsDateString()
  dob: string;

  @ApiProperty({
    description: 'Referral code (optional)',
    example: 'REF123',
    required: false,
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Telephone number of the user',
    example: '+2348164664465',
    required: true,
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  telephoneNumber: string;

  @ApiProperty({
    description: 'OTP of the user',
    example: '123456',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    description: 'Push subscription data from the frontend (optional)',
    example: {
      endpoint: 'https://fcm.googleapis.com/fcm/send/dkkjj1k23',
      keys: {
        p256dh: 'BESrXb...',
        auth: 'Fs5XwD...',
      },
    },
    required: false, // The subscription is optional
  })
  @IsOptional()
  @IsObject()
  subscription?: Record<string, any>; // Adjust this type if needed
}

export class LoginDto {
  @ApiProperty({
    description: 'Telephone number of the user',
    example: '+2348164664465',
    required: true,
  })
  @IsNotEmpty()
  @IsPhoneNumber()
  telephoneNumber: string;
}
