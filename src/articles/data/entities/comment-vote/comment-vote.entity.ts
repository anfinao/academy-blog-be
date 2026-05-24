import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from 'src/users/data/entities/user.entity';
import { CommentEntity } from '../comment/comment.entity';

/*
  Сущность оценки комментария. Содержит информацию о 
  голосах пользователей и их влиянии на рейтинг комментария.
 */
@ObjectType()
@Entity('comment_vote')
@Unique(['commentId', 'userId']) // один голос на комментарий от одного пользователя
export class CommentVoteEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  commentId: string;

  @Field()
  @Column()
  userId: string;

  /*
    Голос пользователя. Может быть от -1 до 1, 
    где 1 - это дизлайк, 1 - лайк, а 0 - это отсутсвие оценки
    (Рейтинг лайк/дизлайк)
   */
  @Field(() => Int)
  @Column({ type: 'int' })
  vote: number;

  @ManyToOne(() => CommentEntity, (comment) => comment.votes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: CommentEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
}
