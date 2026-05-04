import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'Получить список всех категорий' })
    @ApiResponse({ status: 200, description: 'Список категорий успешно получен' })
    getAll() {
        return this.categoriesService.findAll();
    }

    @Post()
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
    @ApiOperation({ summary: 'Удалить категорию' })
    @ApiParam({ name: 'id', example: '1', description: 'ID категории' })
    @ApiResponse({ status: 200, description: 'Категория успешно удалена' })
    remove(@Param('id') id: string) {
        return this.categoriesService.remove(id);
    }
}
