import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/enums/roles';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
