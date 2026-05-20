import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CommentEntity } from "../comment/comment.entity";
import { CategoryEntity } from "../category/category";
import { ApiProperty } from "@nestjs/swagger";
import { Field, Float, ID, Int, ObjectType } from "@nestjs/graphql";
import { Transform } from "class-transformer";
import { UserEntity } from "src/users/data/entities/user.entity";

@Entity('article')
@ObjectType()
export class ArticleEntity {
    @Field(() => ID)
    @ApiProperty({ example: 1, description: 'ID статьи' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @ApiProperty({ example: 'Как работать с NestJS' })
    @Column({ unique: true })
    title: string;

    @Field()
    @ApiProperty({ example: 'Полный текст статьи' })
    @Column()
    content: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    imgSrc: string;

    @Field(() => CategoryEntity, { nullable: true })
    @ManyToOne(() => CategoryEntity, (category) => category.articles, { onDelete: 'SET NULL' })
    @JoinColumn()
    category: CategoryEntity;

    @Field({ nullable: true })
    @ApiProperty({ example: '1' })
    @Column({ nullable: true })
    categoryId: string;

    @Field({ defaultValue: 0 })
    @ApiProperty({ example: 10, description: 'Рейтинг' })
    @Column({ default: 0 })
    rating: number;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => [CommentEntity], { nullable: 'itemsAndList' })
    @OneToMany(() => CommentEntity, (comment) => comment.article)
    comments: CommentEntity[];

    /**
     * Учет голосов для оценки от 1 до 5
     */
    @Field(() => [Int], { nullable: true })
    @Column('simple-array', { nullable: true })
    votes?: number[];

    @Field(() => Float, { defaultValue: 0, nullable: true })
    @Column({ type: 'float', default: 0, nullable: true })
    avgRating: number;

    @Field(() => Int, { defaultValue: 0, nullable: true })
    @Column({ default: 0, nullable: true })
    votesCount: number;

    @ApiProperty({ example: 'uuid-123', description: 'ID автора статьи' })
    @Column({ nullable: true })
    authorId?: string;

    @Field(() => UserEntity, { nullable: true })
    @ManyToOne(() => UserEntity, (user) => user.articles, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'authorId' })
    author?: UserEntity;
}
