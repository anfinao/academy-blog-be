import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class ArticlesQueryInput {
    @Field(() => Int, { defaultValue: 1 })
    page: number = 1;

    @Field(() => Int, { defaultValue: 10 })
    limit: number = 10;

    @Field(() => Boolean, { defaultValue: false })
    cumulative: boolean = false;
}