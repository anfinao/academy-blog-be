import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    let user: any;

    if (ctx.getType() === 'http') {
      // REST-контекст
      const request = ctx.switchToHttp().getRequest();

      user = request.user;
    } else {
      // GraphQL-контекст
      const gqlCtx = GqlExecutionContext.create(ctx);
      const req = gqlCtx.getContext().req || gqlCtx.getContext();

      user = req.user;
    }

    // Если передали ключ (например 'id' или 'email'), возвращаем поле
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
