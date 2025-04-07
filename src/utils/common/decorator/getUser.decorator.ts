import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: any | undefined, ctx: ExecutionContext) => {
    const request: Express.Request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      return null;
    }
    if (data) {
      return request.user[data];
    }
    return request.user;
  },
);
