import { ApiProperty } from "@nestjs/swagger";

export class CreateArticleDto {
    @ApiProperty({ example: 'Как работать с NestJS', description: 'Заголовок статьи' })
    title: string;
    @ApiProperty({ example: 'Полный текст статьи', description: 'Содержимое статьи' })
    content: string;
    image?: string;
    @ApiProperty({ example: 1, description: 'ID категории', required: false })
    categoryId?: string;
}
