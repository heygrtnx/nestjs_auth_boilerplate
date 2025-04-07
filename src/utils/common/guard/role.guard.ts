import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { ROLES_KEY } from '../decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    console.log('🔑 Role Guard Checking User:'); // Debugging log

    if (!user || !user.userId) {
      console.error('❌ No user found in request, rejecting access');
      throw new UnauthorizedException('User not authenticated');
    }

    const userFromDb = await this.prisma.user.findUnique({
      where: { userId: user.userId },
      include: { Admins: true },
    });

    console.log('📌 User Role from DB:', userFromDb?.role);

    if (!userFromDb) {
      throw new UnauthorizedException();
    }

    const userRole = userFromDb.role;
    return requiredRoles.includes(userRole);
  }
}
