import { Resolver, Query, Mutation, Args, ID, Int } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { CreateCommentInput } from 'src/articles/dto/comment/create-comment.input';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { OptionalGqlAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { GqlAuthGuard } from 'src/auth/guards/graphql-auth.guard';

@Resolver(() => CommentEntity)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => CommentEntity, { name: 'comment', nullable: true })
  @UseGuards(OptionalGqlAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  async getComment(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.commentsService.findOne(id, userId);
  }

  @Query(() => [CommentEntity], { name: 'commentsByArticle' })
  @UseGuards(OptionalGqlAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  async getCommentsByArticle(
    @Args('articleId', { type: () => ID }) articleId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.commentsService.findByArticle(articleId, userId);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  async createComment(
    @Args('createComment') createComment: CreateCommentInput,
    @CurrentUser('id') userId: string,
    @CurrentUser('username') username: string,
  ) {
    return this.commentsService.create({
      ...createComment,
      authorId: userId,
      username,
    });
  }

  @Mutation(() => CommentEntity)
  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  async updateCommentRating(
    @Args('id', { type: () => ID }) id: string,
    @Args('rating') rating: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.updateRating(id, rating, userId);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  async commentRatingUp(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.upRating(id, userId);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  async commentRatingDown(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.downRating(id, userId);
  }

  @Mutation(() => CommentEntity)
  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  async voteComment(
    @Args('id', { type: () => ID }) id: string,
    @Args('vote', { type: () => Int }) vote: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.addVote(id, vote, userId);
  }
}
