import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);

        // Извлекаем контекст из GraphQL
        const graphqlCtx = ctx.getContext();

        return graphqlCtx.req || graphqlCtx;
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
        if (err || !user || info) {
            throw err || new UnauthorizedException('Unauthorized');
        }

        return user;
    }
}