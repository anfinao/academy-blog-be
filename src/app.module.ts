import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleEntity } from './articles/data/entities/article/article.entity';
import { CommentEntity } from './articles/data/entities/comment/comment.entity';
import { CategoryEntity } from './articles/data/entities/category/category';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { EventsGateway } from './articles/core/websocket/events.gateway';
import { UserEntity } from './users/data/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
    imports: [
        ArticlesModule,
        UsersModule,
        TypeOrmModule.forRoot({
            type: 'sqlite',
            database: 'blog.db',
            entities: [ArticleEntity, CommentEntity, CategoryEntity, UserEntity],
            synchronize: true,
            logging: false,
        }),
        ServeStaticModule.forRoot({
            rootPath: join(__dirname, '..', 'uploads'),
            serveRoot: '/uploads',
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            sortSchema: true,
        }),
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
