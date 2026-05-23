import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateCommentInput } from 'src/articles/dto/comment/create-comment.input';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @Get('count')
    @ApiOperation({ summary: 'Получить кол-во комментариев' })
    @ApiResponse({ status: 200, description: 'Кол-во комментариев получен' })
    getCountComments() {
        return this.commentsService.getCount();
    }

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
    create(@Body() dto: CreateCommentInput) {
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

    @Post('up-rating/:id')
    @ApiOperation({ summary: 'Увеличить рейтинг комментария на 1' })
    @ApiParam({ name: 'id', description: 'ID комментария' })
    @ApiResponse({ status: 200, description: 'Рейтинг успешно увеличен' })
    upRating(@Param('id') id: string) {
        return this.commentsService.upRating(id);
    }

    @Post('down-rating/:id')
    @ApiOperation({ summary: 'Уменьшить рейтинг комментария на 1' })
    @ApiParam({ name: 'id', description: 'ID комментария' })
    @ApiResponse({ status: 200, description: 'Рейтинг успешно уменьшен' })
    downRating(@Param('id') id: string) {
        return this.commentsService.downRating(id);
    }

    @Post('vote/:id')
    @ApiOperation({ summary: 'Поставить оценку комментария (1-5)' })
    @ApiParam({ name: 'id', description: 'ID комментария' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                vote: { type: 'number', example: 5, description: 'Оценка от 1 до 5' },
            },
            required: ['vote'],
        },
    })
    @ApiResponse({ status: 200, description: 'Голос успешно добавлен' })
    vote(
        @Param('id') commentId: string,
        @Body('vote') vote: number,
    ) {
        return this.commentsService.addVote(commentId, vote);
    }
}
