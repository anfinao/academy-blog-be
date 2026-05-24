import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john_doe',
    description: 'Имя пользователя или email',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Пароль',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
