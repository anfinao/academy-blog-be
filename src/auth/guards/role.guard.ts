import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UserRole } from 'src/users/enums/roles';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const gqlContext = GqlExecutionContext.create(context);
        const request = context.switchToHttp().getRequest() ?? gqlContext.getContext().req;
        if (!request || !request.user) {
            return false;
        }

        return requiredRoles.some((role) => request.user.role === role);
    }
}