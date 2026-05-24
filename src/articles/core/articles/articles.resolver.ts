import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { ArticlesQueryInput } from 'src/articles/dto/article/articles-query.input';
import { ArticlesResponseOutput } from 'src/articles/dto/article/articles-response.output';
import { CreateArticleDto } from 'src/articles/dto/article/create-article.dto';
import { UpdateArticleInput } from 'src/articles/dto/article/update-article.input';
import { ArticlesService } from './articles.service';

@Resolver(() => ArticleEntity)
export class ArticlesResolver {
    constructor(private readonly articlesService: ArticlesService) { }

    @Query(() => ArticleEntity, { name: 'article', nullable: true })
    async getOne(@Args('id', { type: () => ID }) id: string) {
        return this.articlesService.findOne(id);
    }

    @Query(() => ArticlesResponseOutput, { name: 'articles' })
    async getAll(
        @Args('query', { type: () => ArticlesQueryInput, nullable: true }) query?: ArticlesQueryInput,
    ) {
        return this.articlesService.findAll(
            query?.page ?? 1,
            query?.limit ?? 10,
            query?.cumulative ?? false,
        );
    }

    @Mutation(() => ArticleEntity)
    async createArticle(
        @Args('createArticleInput') createArticleInput: CreateArticleDto,
    ) {
        return this.articlesService.create(createArticleInput);
    }

    @Mutation(() => ArticleEntity)
    async updateArticle(
        @Args('id', { type: () => ID }) id: string,
        @Args('updateArticleInput') updateArticleInput: UpdateArticleInput,
    ) {
        return this.articlesService.update(id, updateArticleInput);
    }

    @Mutation(() => ArticleEntity)
    async articleUpdateRating(@Args('id', { type: () => ID }) id: string, @Args('rating') rating: number) {
        return this.articlesService.updateRating(id, rating);
    }

    @Mutation(() => ArticleEntity)
    async articleRatingUp(@Args('id', { type: () => ID }) id: string) {
        return this.articlesService.ratingUp(id);
    }

    @Mutation(() => ArticleEntity)
    async articleRatingDown(@Args('id', { type: () => ID }) id: string) {
        return this.articlesService.ratingDown(id);
    }

    @Mutation(() => Boolean)
    async removeArticle(@Args('id', { type: () => ID }) id: string) {
        await this.articlesService.remove(id);
        return true;
    }

    @Mutation(() => ArticleEntity)
    async voteArticle(
        @Args('id', { type: () => ID }) id: string,
        @Args('vote') vote: number,
    ) {
        return this.articlesService.addVote(id, vote);
    }
}