import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RefreshToken } from 'src/users/data/entities/refresh-token.entity';
import { UsersService } from '../users/core/users.service';

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(login: string, password: string): Promise<UserPayload> {
    const user = await this.usersService.findOneByLogin(login);

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Пользователь заблокирован');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: UserPayload) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    // Создаём refresh токен
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: '1h',
      refresh_token: refreshToken.token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async createRefreshToken(userId: string): Promise<RefreshToken> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() +
        parseInt(this.configService.get('REFRESH_TOKEN_EXPIRATION', '7')),
    );

    const refreshToken = await this.usersService.createRefreshToken({
      userId,
      token,
      expiresAt,
      isRevoked: false,
    } as any);

    return refreshToken;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    // Находим refresh токен в БД
    const tokenRecord =
      await this.usersService.findRefreshTokenByToken(refreshToken);

    if (!tokenRecord) {
      throw new UnauthorizedException('Неверный refresh токен');
    }

    if (tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh токен отозван');
    }

    if (new Date() > tokenRecord.expiresAt) {
      // Токен истёк — отменяем его
      await this.usersService.revokeRefreshToken(tokenRecord.id);
      throw new UnauthorizedException('Refresh токен истёк');
    }

    // Получаем пользователя
    const user = await this.usersService.findOneById(tokenRecord.userId);

    if (!user || user.isBlocked) {
      throw new UnauthorizedException(
        'Пользователь не найден или заблокирован',
      );
    }

    // Создаём новый access токен
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = this.jwtService.sign(payload);

    // Создаём новый refresh токен и отменяем старый
    await this.usersService.revokeRefreshToken(tokenRecord.id);
    const newRefreshToken = await this.createRefreshToken(user.id);

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken.token,
    };
  }

  async logoutRefreshToken(refreshToken: string): Promise<void> {
    const tokenRecord =
      await this.usersService.findRefreshTokenByToken(refreshToken);
    if (tokenRecord) {
      await this.usersService.revokeRefreshToken(tokenRecord.id);
    }
  }
}
