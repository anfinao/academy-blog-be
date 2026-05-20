import { Field, ID, ObjectType } from "@nestjs/graphql";
import { ApiProperty } from "@nestjs/swagger";

@ObjectType()
export class UserOutput {
    @Field(() => ID)
    @ApiProperty({ example: 'uuid-123', description: 'ID пользователя' })
    id: string;

    @Field()
    @ApiProperty({ example: 'john_doe', description: 'Имя пользователя' })
    username: string;

    @Field()
    @ApiProperty({ example: 'john@example.com', description: 'Email пользователя' })
    email: string;

    @Field()
    @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Время создания' })
    createdAt: Date;

    @Field({ nullable: true })
    @ApiProperty({ example: '2024-01-15T12:00:00Z', description: 'Время последней активности' })
    lastActiveTime: Date;

    @Field()
    @ApiProperty({ example: '2024-01-15T12:00:00Z', description: 'Время обновления' })
    updatedAt: Date;

    @Field(() => Boolean)
    @ApiProperty({ example: false, description: 'Признак блокировки пользователя' })
    isBlocked: boolean;
}

@ObjectType()
export class UserResponse {
    @Field(() => UserOutput)
    @ApiProperty({ description: 'Данные пользователя' })
    user: UserOutput;

    @Field(() => String)
    @ApiProperty({ example: 'success', description: 'Статус операции' })
    message: string;
}

@ObjectType()
export class MessageResponse {
    @Field(() => String)
    @ApiProperty({ example: 'success', description: 'Статус операции' })
    message: string;
}