import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { UserEntity } from 'src/users/data/entities/user.entity';
import { CategoryEntity } from 'src/articles/data/entities/category/category';
import { UserResponseDto } from '../user/user.response.dto';
import { CategoryResponseDto } from '../category/category.response.dto';
import {
  CommentInArticleDto,
  CommentResponseDto,
} from 'src/articles/core/comments/comment.response.dto';
import {
  ArticleInCommentDto,
  ArticleResponseDto,
  ArticlesListResponseDto,
} from 'src/articles/core/articles/article.response.dto';

export function toUserResponse(user: UserEntity): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
  };
}

export function toCategoryResponse(
  category: CategoryEntity,
): CategoryResponseDto {
  return {
    id: category.id,
    name: category.name,
  };
}

export function toCommentInArticle(
  comment: CommentEntity,
): CommentInArticleDto {
  return {
    id: comment.id,
    content: comment.content,
    username: comment.username,
    articleId: comment.articleId,
    rating: comment.rating,
    likesCount: comment.likesCount,
    dislikesCount: comment.dislikesCount,
    createdAt: comment.createdAt,
    author: comment.author ? toUserResponse(comment.author) : null,
    userVote: comment.userVote ?? null,
  };
}

export function toArticleInComment(
  article: ArticleEntity,
): ArticleInCommentDto {
  return {
    id: article.id,
    title: article.title,
    rating: article.rating,
    avgRating: article.avgRating,
    votesCount: article.votesCount,
    imgSrc: article.imgSrc ?? null,
    categoryId: article.categoryId ?? null,
    createdAt: article.createdAt,
    author: article.author ? toUserResponse(article.author) : null,
    category: article.category ? toCategoryResponse(article.category) : null,
  };
}

export function toArticleResponse(article: ArticleEntity): ArticleResponseDto {
  return {
    ...toArticleInComment(article),
    content: article.content,
    updatedAt: article.updatedAt,
    comments: article.comments
      ? article.comments.map(toCommentInArticle)
      : null,
    userVote: article.userVote ?? null,
  };
}

export function toArticlesListResponse(data: {
  items: ArticleEntity[];
  total: number;
  page: number;
  limit: number;
}): ArticlesListResponseDto {
  return {
    items: data.items.map(toArticleResponse),
    total: data.total,
    page: data.page,
    limit: data.limit,
  };
}

export function toCommentResponse(comment: CommentEntity): CommentResponseDto {
  return {
    ...toCommentInArticle(comment),
  };
}
