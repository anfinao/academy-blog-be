import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Logger, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(
        private readonly authService: AuthService,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Вход в систему' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: 200, description: 'Успешный вход' })
    @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
    async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
        const user = await this.authService.validateUser(loginDto.login, loginDto.password);
        const result = await this.authService.login(user);

        // Устанавливаем refresh токен в HTTP-only cookie
        response.cookie('refresh_token', result.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '7') * 24 * 60 * 60 * 1000, // в миллисекундах
            path: '',
        });

        // Возвращаем только access токен в ответе
        const { refresh_token, ...accessTokenResponse } = result;
        return accessTokenResponse;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Обновление access токена' })
    @ApiResponse({ status: 200, description: 'Успешное обновление токена' })
    @ApiResponse({ status: 401, description: 'Неверный refresh токен' })
    async refresh(@Res({ passthrough: true }) response: Response, @Req() req: any) {
        const refreshToken = req.cookies?.refresh_token;

        // Устанавливаем новый refresh токен в cookie
        response.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRATION || '7') * 24 * 60 * 60 * 1000,
            path: '/',
        });

        const result = await this.authService.refreshAccessToken(refreshToken);
        return {
            access_token: result.access_token,
            token_type: 'Bearer',
            expires_in: '1h',
        };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Выход из системы' })
    @ApiResponse({ status: 200, description: 'Успешный выход' })
    async logout(@Body() body: { refresh_token?: string }, @Res({ passthrough: true }) response: Response) {
        // Если refresh токен передан — отменяем его в БД
        if (body?.refresh_token) {
            await this.authService.logoutRefreshToken(body.refresh_token);
        }

        // Очищаем cookie
        response.clearCookie('refresh_token', {
            path: '/auth',
        });

        return { message: 'Успешный выход' };
    }

    @Get('me')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Получить информацию о текущем пользователе' })
    @ApiResponse({ status: 200, description: 'Успешное получение данных пользователя' })
    @ApiResponse({ status: 401, description: 'Неавторизованный доступ' })
    async getMe(@CurrentUser() user: any) {
        if (!user || !user.userId) {
            this.logger.error(`User not found in request!`);
            throw new UnauthorizedException('Пользователь не найден в запросе');
        }

        this.logger.log(`Successfully authenticated user:`, { userId: user.userId, username: user.username });
        return {
            id: user.userId,
            username: user.username,
            email: user.email,
            role: user.role
        };
    }
}