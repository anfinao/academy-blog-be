import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ArticleEntity } from "../article/article.entity";
import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";

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
    @ManyToOne(() => ArticleEntity, (article) => article.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'articleId' })
    article: ArticleEntity;

    @Field({ defaultValue: 0 })
    @Column({ default: 0 })
    rating: number;

    @Field(() => [Int], { nullable: true })
    @Column('simple-array', { nullable: true })
    votes?: number[];

    @Field(() => Float, { defaultValue: 0 })
    @Column({ type: 'float', default: 0 })
    avgRating: number;

    @Field(() => Int, { defaultValue: 0 })
    @Column({ default: 0 })
    votesCount: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;
}
