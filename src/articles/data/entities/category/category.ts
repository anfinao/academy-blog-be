import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ArticleEntity } from "../article/article.entity";
import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
@Entity('category')
export class CategoryEntity {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column({ unique: true })
    name: string;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field({ nullable: true })
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => [ArticleEntity], { nullable: 'itemsAndList' })
    @OneToMany(() => ArticleEntity, (article) => article.category, { lazy: true })
    articles: ArticleEntity[];
}
