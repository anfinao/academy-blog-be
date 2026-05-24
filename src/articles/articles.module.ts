import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './data/entities/article/article.entity';
import { CommentsService } from './core/comments/comments.service';
import { CommentsController } from './core/comments/comments.controller';
import { ArticlesController } from './core/articles/articles.controller';
import { ArticlesService } from './core/articles/articles.service';
import { CommentEntity } from './data/entities/comment/comment.entity';
import { CategoriesController } from './core/categories/categories.controller';
import { CategoriesService } from './core/categories/categories.service';
import { CategoryEntity } from './data/entities/category/category';
import { ArticlesResolver } from './core/articles/articles.resolver';
import { CommentsResolver } from './core/comments/comments.resolver';
import { EventsGateway } from './core/websocket/events.gateway';
import { ArticleVoteEntity } from './data/entities/article-vote/article-vote.entity';
import { CommentVoteEntity } from './data/entities/comment-vote/comment-vote.entity';
import { UserEntity } from 'src/users/data/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ArticleEntity,
      CommentEntity,
      CategoryEntity,
      UserEntity,
      ArticleVoteEntity,
      CommentVoteEntity,
    ]),
  ],
  controllers: [ArticlesController, CommentsController, CategoriesController],
  providers: [
    ArticlesService,
    ArticlesResolver,
    CommentsService,
    CommentsResolver,
    CategoriesService,
    EventsGateway,
  ],
  exports: [EventsGateway],
})
export class ArticlesModule {}
