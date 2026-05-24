import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRole } from '../enums/roles';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Пользователь успешно зарегистрирован',
  })
  @ApiResponse({
    status: 409,
    description: 'Пользователь с таким именем или email уже существует',
  })
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.registerUser(
      createUserDto.isAdmin
        ? { role: UserRole.ADMIN, ...createUserDto }
        : createUserDto,
    );
    return {
      message: 'Пользователь успешно зарегистрирован',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        lastActiveTime: user.lastActiveTime,
        isBlocked: user.isBlocked,
        role: user.role,
      },
    };
  }

  @Post(':userId/block')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Блокировка пользователя' })
  @ApiParam({
    name: 'userId',
    description: 'ID пользователя',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно заблокирован',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 400, description: 'Пользователь уже заблокирован' })
  async blockUser(@Param('userId') userId: string) {
    const user = await this.usersService.blockUser(userId);
    return {
      message: `Пользователь ${user.username} успешно заблокирован`,
      user: {
        id: user.id,
        username: user.username,
        isBlocked: user.isBlocked,
      },
    };
  }

  @Post(':userId/unblock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Разблокировка пользователя' })
  @ApiParam({
    name: 'userId',
    description: 'ID пользователя',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Пользователь успешно разблокирован',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  @ApiResponse({ status: 400, description: 'Пользователь не заблокирован' })
  async unblockUser(@Param('userId') userId: string) {
    const user = await this.usersService.unblockUser(userId);
    return {
      message: `Пользователь ${user.username} успешно разблокирован`,
      user: {
        id: user.id,
        username: user.username,
        isBlocked: user.isBlocked,
      },
    };
  }

  @Delete(':userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удаление пользователя' })
  @ApiParam({
    name: 'userId',
    description: 'ID пользователя',
    example: 'uuid-123',
  })
  @ApiResponse({ status: 204, description: 'Пользователь успешно удалён' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  async deleteUser(@Param('userId') userId: string): Promise<void> {
    await this.usersService.deleteUser(userId);
  }
}
