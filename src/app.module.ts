import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { ArticleEntity } from './articles/data/entities/article/article.entity';
import { CategoryEntity } from './articles/data/entities/category/category';
import { CommentEntity } from './articles/data/entities/comment/comment.entity';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './users/data/entities/user.entity';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { RefreshToken } from './users/data/entities/refresh-token.entity';
import { SseModule } from './articles/core/sse/sse.module';
import { ArticleVoteEntity } from './articles/data/entities/article-vote/article-vote.entity';
import { CommentVoteEntity } from './articles/data/entities/comment-vote/comment-vote.entity';

@Module({
  imports: [
    ArticlesModule,
    UsersModule,
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'blog.db',
      entities: [
        ArticleEntity,
        CommentEntity,
        CategoryEntity,
        ArticleVoteEntity,
        CommentVoteEntity,
        UserEntity,
        RefreshToken,
      ],
      synchronize: true,
      logging: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      context: ({ req, res }) => ({ req, res }),
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    SseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
