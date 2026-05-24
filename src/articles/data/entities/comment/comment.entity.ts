import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ArticleEntity } from '../article/article.entity';
import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { UserEntity } from 'src/users/data/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CommentVoteEntity } from '../comment-vote/comment-vote.entity';

@ObjectType()
@Entity('comment')
export class CommentEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  username: string;

  @Field()
  @Column()
  content: string;

  @Field()
  @Column()
  articleId: string;

  @Field(() => ArticleEntity)
  @ManyToOne(() => ArticleEntity, (article) => article.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'articleId' })
  article: ArticleEntity;

  @Field({ defaultValue: 0 })
  @Column({ default: 0 })
  rating: number;

  @ApiProperty({ example: 'uuid-123', description: 'ID автора комментария' })
  @Column({ nullable: true })
  authorId?: string;

  @Field(() => UserEntity, { nullable: true })
  @ManyToOne(() => UserEntity, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author?: UserEntity;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  /*
    Счётчики системы vote (-1/0/1)
    Обновляются в addVote
   */
  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  likesCount: number;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ default: 0 })
  dislikesCount: number;

  /*
    Учет голосов для оценки от -1 до 1
   */
  @Field(() => [CommentVoteEntity], { nullable: 'itemsAndList' })
  @OneToMany(() => CommentVoteEntity, (vote) => vote.comment)
  votes?: CommentVoteEntity[];

  /* 
    Поле не хранится в БД
    Поле предоставлеят голос текушего пользователя
   */
  @Field(() => Int, { nullable: true })
  userVote?: number | null;
}
