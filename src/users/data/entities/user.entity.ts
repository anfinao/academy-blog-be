import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Field, ID, ObjectType } from "@nestjs/graphql";

@Entity('user')
@ObjectType()
export class UserEntity {
    @Field(() => ID)
    @ApiProperty({ example: '1', description: 'ID пользователя' })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @ApiProperty({ example: 'john_doe', description: 'Имя пользователя' })
    @Column({ unique: true })
    username: string;

    @Field()
    @ApiProperty({ example: 'john@example.com', description: 'Email пользователя' })
    @Column({ unique: true })
    email: string;

    @Field()
    @ApiProperty({ example: 'hashed_password', description: 'Хеш пароля' })
    @Column()
    password: string;

    @Field()
    @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Время создания' })
    @CreateDateColumn()
    createdAt: Date;

    @Field({ nullable: true })
    @ApiProperty({ example: '2024-01-15T12:00:00Z', description: 'Время последней активности' })
    @Column({ nullable: true })
    lastActiveTime: Date;

    @Field()
    @ApiProperty({ example: '2024-01-15T12:00:00Z', description: 'Время обновления' })
    @UpdateDateColumn()
    updatedAt: Date;

    @Field(() => Boolean, { defaultValue: false })
    @ApiProperty({ example: false, description: 'Признак блокировки пользователя' })
    @Column({ default: false })
    isBlocked: boolean;
}