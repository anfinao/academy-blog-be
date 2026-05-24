import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateCommentInput } from 'src/articles/dto/comment/create-comment.input';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { toCommentResponse } from 'src/articles/dto/response/mappers';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
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
  async create(
    @Body() dto: CreateCommentInput,
    @CurrentUser('id') userId: string,
    @CurrentUser('username') username: string,
  ) {
    const comment = await this.commentsService.create({
      ...dto,
      authorId: userId,
      username,
    });

    return toCommentResponse(comment!);
  }

  @Get('article/:articleId')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  @ApiOperation({ summary: 'Получить все комментарии к статье' })
  @ApiParam({
    name: 'articleId',
    description: 'ID статьи, комментарии которой нужно найти',
  })
  @ApiResponse({ status: 200, description: 'Список комментариев получен' })
  async getByArticle(
    @Param('articleId') articleId: string,
    @CurrentUser('id') userId?: string,
  ) {
    const comments = await this.commentsService.findByArticle(
      articleId,
      userId,
    );

    return comments.map(toCommentResponse);
  }

  @Patch(':id/rating')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
  @ApiOperation({ summary: 'Изменить рейтинг комментария' })
  @ApiParam({ name: 'id', description: 'ID комментария' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rating: {
          type: 'number',
          example: 5,
          description: 'Новое значение рейтинга',
        },
      },
      required: ['rating'],
    },
  })
  @ApiResponse({ status: 200, description: 'Рейтинг успешно обновлен' })
  async changeRating(
    @Param('id') id: string,
    @Body('rating') rating: number,
    @CurrentUser('id') userId: string,
  ) {
    const comment = await this.commentsService.updateRating(id, rating, userId);

    return toCommentResponse(comment);
  }

  @Post('up-rating/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
  @ApiOperation({ summary: 'Увеличить рейтинг комментария на 1' })
  @ApiParam({ name: 'id', description: 'ID комментария' })
  @ApiResponse({ status: 200, description: 'Рейтинг успешно увеличен' })
  async upRating(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const comment = await this.commentsService.upRating(id, userId);

    return toCommentResponse(comment);
  }

  @Post('down-rating/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
  @ApiOperation({ summary: 'Уменьшить рейтинг комментария на 1' })
  @ApiParam({ name: 'id', description: 'ID комментария' })
  @ApiResponse({ status: 200, description: 'Рейтинг успешно уменьшен' })
  async downRating(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const comment = await this.commentsService.downRating(id, userId);

    return toCommentResponse(comment);
  }

  @Post('vote/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
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
  async vote(
    @Param('id') commentId: string,
    @Body('vote') vote: number,
    @CurrentUser('id') userId: string,
  ) {
    const comment = await this.commentsService.addVote(commentId, vote, userId);

    return toCommentResponse(comment);
  }
}
