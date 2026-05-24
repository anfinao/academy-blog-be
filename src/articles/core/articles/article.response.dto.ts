import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from 'src/articles/dto/category/category.response.dto';
import { UserResponseDto } from 'src/articles/dto/user/user.response.dto';
import { CommentInArticleDto } from '../comments/comment.response.dto';

export class ArticleInCommentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  avgRating: number;

  @ApiProperty()
  votesCount: number;

  @ApiProperty({ nullable: true })
  imgSrc?: string | null;

  @ApiProperty({ nullable: true })
  categoryId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  author?: UserResponseDto | null;

  @ApiProperty({ type: () => CategoryResponseDto, nullable: true })
  category?: CategoryResponseDto | null;
}

// Полный ответ статьи
export class ArticleResponseDto extends ArticleInCommentDto {
  @ApiProperty()
  content: string;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => [CommentInArticleDto], nullable: true })
  comments?: CommentInArticleDto[] | null;

  @ApiProperty({ nullable: true })
  userVote?: number | null;
}

// Ответ для paginated списка
export class ArticlesListResponseDto {
  @ApiProperty({ type: () => [ArticleResponseDto] })
  items: ArticleResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
