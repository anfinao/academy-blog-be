import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { Roles } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/users/enums/roles';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список всех категорий' })
  @ApiResponse({ status: 200, description: 'Список категорий успешно получен' })
  getAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN) // Доступно лишь пользователю с ролью "admin"
  @ApiOperation({ summary: 'Создать категорию' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Технологии' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 201, description: 'Категория успешно создана' })
  create(@Body('name') name: string) {
    return this.categoriesService.create(name);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN) // Доступно лишь пользователю с ролью "admin"
  @ApiOperation({ summary: 'Обновить категорию' })
  @ApiParam({ name: 'id', example: '1', description: 'ID категории' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Наука' },
      },
      required: ['name'],
    },
  })
  @ApiResponse({ status: 200, description: 'Категория успешно обновлена' })
  update(@Param('id') id: string, @Body('name') name: string) {
    return this.categoriesService.update(id, name);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN) // Доступно лишь пользователю с ролью "admin"
  @ApiOperation({ summary: 'Удалить категорию' })
  @ApiParam({ name: 'id', example: '1', description: 'ID категории' })
  @ApiResponse({ status: 200, description: 'Категория успешно удалена' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
