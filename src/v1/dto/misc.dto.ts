import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class ResolveAccountDto {
  @ApiProperty({
    description: 'The account number to resolve',
    example: '0001234567',
  })
  @IsString({ message: 'Account number must be a string' })
  @IsNotEmpty({ message: 'Account number cannot be empty' })
  @Matches(/^\d{10}$/, {
    message: 'Account number must be a 10-digit number',
  })
  @Transform(({ value }) => value.trim()) // Transformer to remove any leading/trailing spaces
  accountNumber: string;

  @ApiProperty({ description: 'The bank code for the account', example: '058' })
  @IsString({ message: 'Bank code must be a string' })
  @IsNotEmpty({ message: 'Bank code cannot be empty' })
  @Matches(/^\d{3}$/, {
    message: 'Bank code must be a 3-digit number',
  })
  @Transform(({ value }) => value.trim()) // Transformer to remove any leading/trailing spaces
  bankCode: string;
}
