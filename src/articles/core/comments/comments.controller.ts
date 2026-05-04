import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Post()
    @ApiOperation({ summary: 'Создать новый комментарий' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                username: { type: 'string', example: 'IvanIvanov' },
                content: { type: 'string', example: 'Отличная статья!' },
                articleId: { type: 'string', example: 'uuid-статьи' },
            },
            required: ['username', 'content', 'articleId'],
        },
    })
    @ApiResponse({ status: 201, description: 'Комментарий успешно создан' })
    create(@Body() dto: Partial<CommentEntity>) {
        return this.commentsService.create(dto);
    }

    @Get('article/:articleId')
    @ApiOperation({ summary: 'Получить все комментарии к статье' })
    @ApiParam({
        name: 'articleId',
        description: 'ID статьи, комментарии которой нужно найти',
    })
    @ApiResponse({ status: 200, description: 'Список комментариев получен' })
    getByArticle(@Param('articleId') articleId: string) {
        return this.commentsService.findByArticle(articleId);
    }

    @Patch(':id/rating')
    @ApiOperation({ summary: 'Изменить рейтинг комментария' })
    @ApiParam({ name: 'id', description: 'ID комментария' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                rating: { type: 'number', example: 5, description: 'Новое значение рейтинга' },
            },
            required: ['rating'],
        },
    })
    @ApiResponse({ status: 200, description: 'Рейтинг успешно обновлен' })
    changeRating(
        @Param('id') id: string,
        @Body('rating') rating: number,
    ) {
        return this.commentsService.updateRating(id, rating);
    }
}
