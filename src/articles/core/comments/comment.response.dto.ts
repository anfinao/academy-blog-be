import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/articles/dto/user/user.response.dto';
import { ArticleInCommentDto } from '../articles/article.response.dto';

export class CommentInArticleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  articleId: string;

  @ApiProperty()
  rating: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  dislikesCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  author?: UserResponseDto | null;

  @ApiProperty({ nullable: true })
  userVote?: number | null;
}

// Полный ответ комментария — включает краткую инфо о статье
export class CommentResponseDto extends CommentInArticleDto {
  @ApiProperty({ type: () => ArticleInCommentDto, nullable: true })
  article?: ArticleInCommentDto | null;
}
