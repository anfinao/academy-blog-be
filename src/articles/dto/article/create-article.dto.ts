import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';

@InputType()
export class CreateArticleDto {
  @ApiProperty({
    example: 'Как работать с NestJS',
    description: 'Заголовок статьи',
  })
  @Field()
  title: string;

  @ApiProperty({
    example: 'Полный текст статьи',
    description: 'Содержимое статьи',
  })
  @Field()
  content: string;

  @Field({ nullable: true })
  imgSrc?: string;

  @Field({ nullable: true })
  image?: string;

  @ApiProperty({ example: 1, description: 'ID категории', required: false })
  @Field({ nullable: true })
  categoryId?: string;
}
