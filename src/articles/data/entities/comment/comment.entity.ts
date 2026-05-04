import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ArticleEntity } from "../article/article.entity";

@Entity('comment')
export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    username: string;

    @Column()
    content: string;

    @Column()
    articleId: string;

    @ManyToOne(() => ArticleEntity, (article) => article.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'articleId' })
    article!: ArticleEntity;

    @Column({ default: 0 })
    rating: number;

    @CreateDateColumn()
    createdAt: Date;
}
