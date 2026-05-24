import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateArticleDto } from 'src/articles/dto/article/create-article.dto';
import { diskStorage } from 'multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UpdateArticleDto } from 'src/articles/dto/article/update-article.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/enums/roles';
import { Roles } from 'src/auth/decorators/role.decorator';
import { OptionalJwtAuthGuard } from 'src/auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import {
  toArticleResponse,
  toArticlesListResponse,
} from 'src/articles/dto/response/mappers';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  @ApiOperation({ summary: 'Получить статью по ID' })
  @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
  @ApiResponse({ status: 200, description: 'Статья успешно получена' })
  public async getOne(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ) {
    const article = await this.articlesService.findOne(id, userId);

    return toArticleResponse(article);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard) // Нужно для получения в теле ответа оценки авторизированного пользователя
  @ApiOperation({ summary: 'Получить список статей' })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Номер страницы',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Количество элементов на странице',
  })
  @ApiQuery({
    name: 'cumulative',
    required: false,
    example: false,
    description: 'Накопительная пагинация',
  })
  @ApiResponse({ status: 200, description: 'Список статей успешно получен' })
  public async getAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('cumulative') cumulative: string, // передается как строка из URL
    @CurrentUser('id') userId?: string,
  ) {
    const articles = await this.articlesService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      cumulative === 'true',
      userId,
    );

    return toArticlesListResponse(articles);
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
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/svg+xml',
          'image/webp',
        ];
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
    }),
  )
  public async create(
    @Body() dto: CreateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
    @CurrentUser('id') userId?: string,
  ) {
    const imgSrc = file && `/uploads/${file.filename}`;
    const article = await this.articlesService.create({
      ...dto,
      imgSrc,
      authorId: userId,
    });
    return toArticleResponse(article!);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Обновить статью' })
  @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
  @ApiResponse({ status: 200, description: 'Статья успешно обновлена' })
  @UseInterceptors(
    FileInterceptor('image', {
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/svg+xml',
          'image/webp',
        ];
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
    }),
  )
  public async update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    if (file) {
      const imgSrc = file && `/uploads/${file.filename}`;
      const article = await this.articlesService.update(id, { ...dto, imgSrc });

      return toArticleResponse(article!);
    }

    const article = await this.articlesService.update(id, dto);

    return toArticleResponse(article!);
  }

  @Patch(':id/rating-up')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
  @ApiOperation({ summary: 'Увеличить рейтинг статьи' })
  @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
  @ApiResponse({ status: 200, description: 'Рейтинг успешно обновлен' })
  public async ratingUp(@Param('id') id: string) {
    const article = await this.articlesService.ratingUp(id);

    return toArticleResponse(article);
  }

  @Patch(':id/rating-down')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
  @ApiOperation({ summary: 'Уменьшить рейтинг статьи' })
  @ApiParam({ name: 'id', example: '1', description: 'ID статьи' })
  @ApiResponse({ status: 200, description: 'Рейтинг успешно обновлен' })
  public async ratingDown(@Param('id') id: string) {
    const article = await this.articlesService.ratingDown(id);

    return toArticleResponse(article);
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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard) // Доступно только авторизированному пользователю
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
  async vote(
    @Param('id') articleId: string,
    @Body('vote') vote: number,
    @CurrentUser('id') userId: string,
  ) {
    const article = await this.articlesService.addVote(articleId, vote, userId);

    return toArticleResponse(article);
  }
}
