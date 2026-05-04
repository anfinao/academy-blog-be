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

@Module({
    imports: [TypeOrmModule.forFeature([ArticleEntity, CommentEntity, CategoryEntity])],
    controllers: [ArticlesController, CommentsController, CategoriesController],
    providers: [ArticlesService, CommentsService, CategoriesService]
})
export class ArticlesModule { }
