import { Body, Controller, Delete, FileTypeValidator, Get, Param, ParseFilePipe, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArticleDto } from 'src/articles/dto/article/create-article.dto';
import { diskStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UpdateArticleDto } from 'src/articles/dto/article/update-article.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/enums/roles';
import { Roles } from 'src/auth/decorators/role.decorator';

@Controller('articles')
export class ArticlesController {
    constructor(private readonly articlesService: ArticlesService) { }

    @Get(':id')
    @ApiOperation({ summary: 'Получить статью по ID' })
    @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
    @ApiResponse({ status: 200, description: 'Статья успешно получена' })
    public getOne(@Param('id') id: string) {
        return this.articlesService.findOne(id);
    }

    @Get()
    @ApiOperation({ summary: 'Получить список статей' })
    @ApiQuery({ name: 'page', required: false, example: 1, description: 'Номер страницы' })
    @ApiQuery({ name: 'limit', required: false, example: 10, description: 'Количество элементов на странице' })
    @ApiQuery({ name: 'cumulative', required: false, example: false, description: 'Накопительная пагинация' })
    @ApiResponse({ status: 200, description: 'Список статей успешно получен' })
    public getAll(
        @Query('page') page: number,
        @Query('limit') limit: number,
        @Query('cumulative') cumulative: string, // передается как строка из URL
    ) {
        return this.articlesService.findAll(
            Number(page) || 1,
            Number(limit) || 10,
            cumulative === 'true',
        );
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Создать статью' })
    @ApiConsumes('multipart/form-data')
    @ApiCreatedResponse({ type: ArticleEntity })
    @ApiBody({ type: CreateArticleDto })
    @ApiResponse({ status: 201, description: 'Статья успешно создана' })
    @UseInterceptors(FileInterceptor('image', {
        fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Недопустимый тип файла'), false);
            }
        },
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${file.originalname}`;
                cb(null, uniqueName);
            },
        }),
    }),)
    public create(
        @Body() dto: CreateArticleDto,
        @UploadedFile(
            new ParseFilePipe({
                fileIsRequired: false,
            }),
        ) file?: Express.Multer.File,
    ) {
        const imgSrc = file && `/uploads/${file.filename}`;
        return this.articlesService.create({ ...dto, imgSrc });
    }

    @Patch(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Обновить статью' })
    @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
    @ApiResponse({ status: 200, description: 'Статья успешно обновлена' })
    @UseInterceptors(FileInterceptor('image', {
        fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml'];
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Недопустимый тип файла'), false);
            }
        },
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueName = `${Date.now()}-${file.originalname}`;
                cb(null, uniqueName);
            },
        }),
    }),)
    public update(
        @Param('id') id: string,
        @Body() dto: UpdateArticleDto,
        @UploadedFile(
            new ParseFilePipe({
                fileIsRequired: false,
            }),
        ) file?: Express.Multer.File,
    ) {
        if (file) {
            const imgSrc = file && `/uploads/${file.filename}`;
            return this.articlesService.update(id, { ...dto, imgSrc });
        }

        return this.articlesService.update(id, dto);
    }

    @Patch(':id/rating-up')
    @ApiOperation({ summary: 'Увеличить рейтинг статьи' })
    @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
    @ApiResponse({ status: 200, description: 'Рейтинг успешно обновлен' })
    public ratingUp(@Param('id') id: string) {
        return this.articlesService.ratingUp(id);
    }

    @Patch(':id/rating-down')
    @ApiOperation({ summary: 'Уменьшить рейтинг статьи' })
    @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
    @ApiResponse({ status: 200, description: 'Рейтинг успешно обновлен' })
    public ratingDown(@Param('id') id: string) {
        return this.articlesService.ratingDown(id);
    }

    @Delete(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Удалить статью' })
    @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
    @ApiResponse({ status: 200, description: 'Статья успешно удалена' })
    public remove(@Param('id') id: string) {
        return this.articlesService.remove(id);
    }

    @Post('vote/:id')
    @ApiOperation({ summary: 'Поставить оценку статье (1-5)' })
    @ApiParam({ name: 'id', description: 'ID статьи' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                vote: { type: 'number', example: 5, description: 'Оценка от 1 до 5' },
            },
            required: ['vote'],
        },
    })
    @ApiResponse({ status: 200, description: 'Голос успешно добавлен' })
    vote(
        @Param('id') articleId: string,
        @Body('vote') vote: number,
    ) {
        return this.articlesService.addVote(articleId, vote);
    }
}
