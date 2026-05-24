import { Field, InputType } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field(() => String)
  @IsString()
  content: string;

  @Field(() => String)
  @IsString()
  articleId: string;

  // Поле убрано т.к. создание комментария доступно илшь авторизированному пользователю
  // @Field(() => String)
  // @IsString()
  // username: string;
}
