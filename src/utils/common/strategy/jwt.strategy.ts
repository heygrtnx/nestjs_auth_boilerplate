import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/lib/prisma/prisma.service';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  tokenVersion: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies['accessToken'], // Extract token from cookies
      ]),
      secretOrKey: process.env.SECRET_KEY || 'fallback-secret',
      ignoreExpiration: false, // Ensure expiration is checked
    });
  }

  // Validate method for checking if user exists and token version is valid
  async validate(payload: JwtPayload) {
    // If no payload (i.e., the token is missing or expired), allow the middleware to refresh it
    if (!payload) {
      throw new UnauthorizedException('Access token is missing or invalid');
    }

    // Retrieve user from the database based on the token payload
    const user = await this.prisma.user.findUnique({
      where: {
        userId: payload.sub,
        tokenVersion: payload.tokenVersion, // Ensures token version is correct
      },
    });

    // If no user is found or token version doesn't match, throw UnauthorizedException
    if (!user) {
      console.error(
        `User with ID ${payload.sub} not found or token version mismatch`,
      );
      throw new UnauthorizedException('Access denied');
    }

    return user; // Return user details after successful validation
  }
}
