import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { ArticlesQueryInput } from 'src/articles/dto/article/articles-query.input';
import { ArticlesResponseOutput } from 'src/articles/dto/article/articles-response.output';
import { CreateArticleDto } from 'src/articles/dto/article/create-article.dto';
import { UpdateArticleInput } from 'src/articles/dto/article/update-article.input';
import { Roles } from 'src/auth/decorators/role.decorator';
import { GqlAuthGuard } from 'src/auth/guards/graphql-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/enums/roles';
import { ArticlesService } from './articles.service';
import { OptionalGqlAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Resolver(() => ArticleEntity)
export class ArticlesResolver {
  constructor(private readonly articlesService: ArticlesService) {}

  @Query(() => ArticleEntity, { name: 'article', nullable: true })
  @UseGuards(OptionalGqlAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  async getOne(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.articlesService.findOne(id, userId);
  }

  @Query(() => ArticlesResponseOutput, { name: 'articles' })
  @UseGuards(OptionalGqlAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  async getAll(
    @Args('query', { type: () => ArticlesQueryInput, nullable: true })
    query?: ArticlesQueryInput,
    @CurrentUser('id') userId?: string,
  ) {
    return this.articlesService.findAll(
      query?.page ?? 1,
      query?.limit ?? 10,
      query?.cumulative ?? false,
      userId,
    );
  }

  @ApiBearerAuth()
  @UseGuards(GqlAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => ArticleEntity)
  async createArticle(
    @Args('createArticleInput') createArticleInput: CreateArticleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.create({
      ...createArticleInput,
      authorId: userId,
    });
  }

  @ApiBearerAuth()
  @UseGuards(GqlAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => ArticleEntity)
  async updateArticle(
    @Args('id', { type: () => ID }) id: string,
    @Args('updateArticleInput') updateArticleInput: UpdateArticleInput,
  ) {
    return this.articlesService.update(id, updateArticleInput);
  }

  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  @Mutation(() => ArticleEntity)
  async articleRatingUp(@Args('id', { type: () => ID }) id: string) {
    return this.articlesService.ratingUp(id);
  }

  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  @Mutation(() => ArticleEntity)
  async articleRatingDown(@Args('id', { type: () => ID }) id: string) {
    return this.articlesService.ratingDown(id);
  }

  @ApiBearerAuth()
  @UseGuards(GqlAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Mutation(() => Boolean)
  async removeArticle(@Args('id', { type: () => ID }) id: string) {
    await this.articlesService.remove(id);
    return true;
  }

  @UseGuards(GqlAuthGuard) // Доступно только авторизированному пользователю
  @Mutation(() => ArticleEntity)
  async voteArticle(
    @Args('id', { type: () => ID }) id: string,
    @Args('vote', { type: () => Int }) vote: number,
    @CurrentUser('id') userId: string,
  ) {
    return this.articlesService.addVote(id, vote, userId);
  }
}
