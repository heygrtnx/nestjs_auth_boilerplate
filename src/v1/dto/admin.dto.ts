import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    description: 'Admin email address',
    example: 'admin@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Admin password',
    example: 'password123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
