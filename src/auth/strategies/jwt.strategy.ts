import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/core/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret || secret.trim() === '') {
      throw new Error('JWT_SECRET must be defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret as string,
    });

    this.logger.log(`JWT_SECRET loaded: ${secret ? 'YES' : 'NO'}`);
  }

  async validate(payload: any) {
    this.logger.log(`Validating payload:`, payload);
    const user = await this.usersService.findOneById(payload.sub);

    if (!user || user.isBlocked) {
      this.logger.error(`User with ID ${payload.sub} not found or blocked`);
      throw new UnauthorizedException(
        'Пользователь не найден или заблокирован',
      );
    }
    this.logger.log(`User validated:`, {
      userId: user.id,
      username: user.username,
    });
    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      role: payload.role,
    };
  }
}
