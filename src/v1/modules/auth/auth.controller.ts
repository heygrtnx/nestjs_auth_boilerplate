import { Controller, Post, Body, Query, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginDto, VerifyOtpDto } from 'src/v1/dto';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { JwtGuard, GetUser, RolesGuard, Roles } from 'src/utils';
import { Response } from 'express';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @Post('signup')
  create(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Verify OTP' })
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @Post('verify')
  verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyOtp(verifyOtpDto, res);
  }

  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({
    status: 200,
    description: 'OTP resent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @ApiQuery({ name: 'email', required: true, type: String })
  @Post('resend')
  resendOtp(@Query('email') email: string) {
    return this.authService.resendOtp(email);
  }

  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.USER)
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  @Post('logout')
  logout(@GetUser() user: User, @Res({ passthrough: true }) res: Response) {
    return this.authService.logout(user.userId, res);
  }
}
