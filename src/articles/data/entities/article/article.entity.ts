import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { CommentEntity } from "../comment/comment.entity";
import { CategoryEntity } from "../category/category";
import { ApiProperty } from "@nestjs/swagger";

@Entity('article')
export class ArticleEntity {
    @ApiProperty({ example: 1, description: 'ID статьи' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({ example: 'Как работать с NestJS' })
    @Column({ unique: true })
    title: string;

    @ApiProperty({ example: 'Полный текст статьи' })
    @Column()
    content: string;

    @Column({ nullable: true })
    imgSrc: string;

    @ManyToOne(() => CategoryEntity, (category) => category.articles, { onDelete: 'SET NULL' })
    @JoinColumn()
    category: CategoryEntity;

    @ApiProperty({ example: 1 })
    @Column({ nullable: true })
    categoryId: string;

    @ApiProperty({ example: 10, description: 'Рейтинг' })
    @Column({ default: 0 })
    rating: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => CommentEntity, (comment) => comment.article)
    comments: CommentEntity[];
}
