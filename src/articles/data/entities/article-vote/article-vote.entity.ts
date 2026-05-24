import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { CommentEntity } from '../comment/comment.entity';
import { CategoryEntity } from '../category/category';
import { ApiProperty } from '@nestjs/swagger';
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { UserEntity } from 'src/users/data/entities/user.entity';
import { ArticleEntity } from '../article/article.entity';

/*
  Сущность оценки статьи. Содержит информацию о 
  голосах пользователей и их влиянии на рейтинг статьи
 */
@ObjectType()
@Entity('article_vote')
@Unique(['articleId', 'userId']) // Один голос на статью от одного пользователя
export class ArticleVoteEntity {
  @Field(() => ID)
  @ApiProperty({ example: 1, description: 'ID оценки' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @ApiProperty({ example: '1', description: 'ID статьи' })
  @Column()
  articleId: string;

  @Field()
  @ApiProperty({ example: '1', description: 'ID пользователя' })
  @Column()
  userId: string;

  /*
    Голос пользователя. Может быть от 1 до 5, 
    где 1 - самая низкая оценка, а 5 - самая высокая
    (Рейтинг звездочки)
   */
  @Field(() => Int)
  @Column({ type: 'int' })
  @ApiProperty({ example: 1, description: 'Голос пользователя (от 1 до 5)' })
  vote: number;

  @ManyToOne(() => ArticleEntity, (article) => article.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'articleId' })
  article: ArticleEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
