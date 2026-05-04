import { Body, Controller, Delete, FileTypeValidator, Get, Param, ParseFilePipe, Patch, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArticleDto } from 'src/articles/dto/article/create-article.dto';
import { diskStorage } from 'multer';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { UpdateArticleDto } from 'src/articles/dto/article/update-article.dto';

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
    @ApiOperation({ summary: 'Удалить статью' })
    @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
    @ApiResponse({ status: 200, description: 'Статья успешно удалена' })
    public remove(@Param('id') id: string) {
        return this.articlesService.remove(id);
    }
}
