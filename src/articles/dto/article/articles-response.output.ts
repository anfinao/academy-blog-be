import { Field, ObjectType, Int } from '@nestjs/graphql';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';

@ObjectType()
export class ArticlesResponseOutput {
    @Field(() => [ArticleEntity])
    items: ArticleEntity[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    page: number;

    @Field(() => Int)
    limit: number;
}