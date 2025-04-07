import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiTags,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { GetUser, Roles, JwtGuard, RolesGuard } from 'src/utils';
import { Role, User } from '@prisma/client';

@ApiBearerAuth('Authorization')
@UseGuards(JwtGuard, RolesGuard)
@ApiTags('User')
@Controller({ path: 'user', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(Role.USER)
  @ApiOperation({ summary: 'User Profile' })
  @ApiResponse({
    status: 200,
    description: 'User Profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @Get()
  getMe(@GetUser() user: User) {
    return this.userService.getMe(user.userId);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DEVELOPER, Role.SUPPORT)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'Users fetched successfully',
  })
  @Get('admin/all')
  getAllUsers(@GetUser() user: User) {
    return this.userService.getAllUsers(user.email);
  }

  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.DEVELOPER, Role.SUPPORT)
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({
    status: 200,
    description: 'User fetched successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiParam({ name: 'id', description: 'User id' })
  @Get('admin/:id')
  getUserById(@GetUser() user: User, @Param('id') id: string) {
    return this.userService.getUserById(id, user.email);
  }

  @Roles(Role.USER)
  @Post('/webpush/subscribe')
  async subscribe(
    @Body() { subscription }: { subscription: any },
    @GetUser() user: User,
  ) {
    return this.userService.subscribe(user.userId, subscription);
  }

  @Roles(Role.USER)
  @Delete('/webpush/unsubscribe')
  async unsubscribe(
    @Body() { endpoint }: { endpoint: string }, // Extract the endpoint from the request
    @GetUser() user: User,
  ) {
    return this.userService.unsubscribe(user.userId, endpoint);
  }
}
