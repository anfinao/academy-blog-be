import { Field, InputType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserRole } from '../enums/roles';

@InputType()
export class CreateUserDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Имя пользователя',
    minLength: 3,
  })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email пользователя',
  })
  @Field()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Пароль пользователя',
    minLength: 6,
  })
  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  isAdmin?: boolean;
  role?: UserRole;
}
