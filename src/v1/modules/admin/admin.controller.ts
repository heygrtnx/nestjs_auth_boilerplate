import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminLoginDto } from 'src/v1/dto';
import { JwtGuard, GetUser, RolesGuard, Roles } from 'src/utils';
import { Role, User } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Admin')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Admin successfully logged in',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
  })
  async login(
    @Body() loginDto: AdminLoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.adminService.login(loginDto, response);
  }

  /** View Admin Profile */
  @ApiBearerAuth('Authorization')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.DEVELOPER,
    Role.FINANCE,
    Role.SUPPORT,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin profile fetched successfully',
  })
  @ApiOperation({ summary: 'View Admin Profile' })
  @Get('profile')
  viewProfile(@GetUser() user: User) {
    return this.adminService.viewProfile(user.email);
  }

  @ApiBearerAuth('Authorization')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(
    Role.ADMIN,
    Role.SUPER_ADMIN,
    Role.DEVELOPER,
    Role.FINANCE,
    Role.SUPPORT,
  )
  @ApiOperation({ summary: 'Logout' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Logout failed',
  })
  @Post('logout')
  logout(@GetUser() user: User, @Res({ passthrough: true }) res: Response) {
    return this.adminService.logout(user.userId, res);
  }
}
