import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class UpdateArticleInput {
  @Field()
  title: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  imgSrc?: string;

  @Field({ nullable: true })
  categoryId?: string;
}
