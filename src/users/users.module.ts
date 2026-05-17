import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './data/entities/user.entity';
import { UsersController } from './core/users.controller';
import { UsersService } from './core/users.service';
import { RefreshToken } from './data/entities/refresh-token.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserEntity, RefreshToken])],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService, TypeOrmModule],
})
export class UsersModule { }