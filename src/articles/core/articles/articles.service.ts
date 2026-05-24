import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from '../../data/entities/article/article.entity';
import { In, Repository } from 'typeorm';
import { EventsGateway } from '../websocket/events.gateway';
import { WEBSOCKET_TYPES } from './constants';
import { ArticleVoteEntity } from 'src/articles/data/entities/article-vote/article-vote.entity';
import { CommentVoteEntity } from 'src/articles/data/entities/comment-vote/comment-vote.entity';

const ARTICLE_RELATIONS = [
  'author',
  'category',
  'votes',
  'comments',
  'comments.author',
  'comments.votes',
];

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(ArticleEntity)
    private readonly repository: Repository<ArticleEntity>,
    @InjectRepository(ArticleVoteEntity) // Добавлена сущность оценки статьи
    private readonly voteRepository: Repository<ArticleVoteEntity>,
    @InjectRepository(CommentVoteEntity) // Добавлена сущность оценки комментария
    private readonly commentVoteRepository: Repository<CommentVoteEntity>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async findOneWithRelations(id: string): Promise<ArticleEntity> {
    const article = await this.repository.findOne({
      where: { id },
      relations: ARTICLE_RELATIONS,
    });
    if (!article) {
      // 404 — статья не найдена по ID
      throw new NotFoundException(`Статья с ID "${id}" не найдена`);
    }
    return article;
  }

  async findOne(id: string, userId?: string) {
    // 404 — статья не найдена
    const article = await this.findOneWithRelations(id);

    if (!article) {
      throw new NotFoundException(`Статья с ID ${id} не найдена`);
    }

    if (userId) {
      const userVote = await this.voteRepository.findOne({
        where: { articleId: id, userId },
      });
      article.userVote = userVote?.vote ?? null;
    } else {
      article.userVote = null;
    }

    if (article.comments?.length) {
      if (userId) {
        const commentIds = article.comments.map((c) => c.id);
        const commentVotes = await this.commentVoteRepository.find({
          where: { commentId: In(commentIds), userId },
        });
        const voteMap = new Map(commentVotes.map((v) => [v.commentId, v.vote]));
        article.comments.forEach((c) => {
          c.userVote = voteMap.get(c.id) ?? null;
        });
      } else {
        article.comments.forEach((c) => (c.userVote = null));
      }
    }

    return article;
  }

  // Пагинация: постранично или накоплением до указанной страницы
  async findAll(
    page: number = 1,
    limit: number = 10,
    cumulative: boolean = false,
    userId?: string,
  ) {
    // 400 — некорректные параметры пагинации
    if (page < 1) {
      throw new BadRequestException('Номер страницы должен быть больше 0');
    }
    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Лимит должен быть от 1 до 100');
    }

    const skip = cumulative ? 0 : (page - 1) * limit;
    const take = page * limit; // Если cumulative=true, берем всё от 0 до текущей страницы

    const [items, total] = await this.repository.findAndCount({
      skip: cumulative ? 0 : skip,
      take: cumulative ? take : limit,
      order: { createdAt: 'DESC' },
      relations: ARTICLE_RELATIONS,
    });

    // Загрузка голосов текущего пользователя
    if (userId && items.length) {
      const articleIds = items.map((a) => a.id);

      // Загрузка голосов за статьи
      const articleVotes = await this.voteRepository.find({
        where: { articleId: In(articleIds), userId },
      });
      const articleVoteMap = new Map(
        articleVotes.map((v) => [v.articleId, v.vote]),
      );

      items.forEach((a) => {
        a.userVote = articleVoteMap.get(a.id) ?? null;
      });

      // Загрузка голосов за все комментарии всех статей
      const allComments = items.flatMap((a) => a.comments ?? []);
      if (allComments.length) {
        const commentIds = allComments.map((c) => c.id);
        const commentVotes = await this.commentVoteRepository.find({
          where: { commentId: In(commentIds), userId },
        });
        const commentVoteMap = new Map(
          commentVotes.map((v) => [v.commentId, v.vote]),
        );

        allComments.forEach((c) => {
          c.userVote = commentVoteMap.get(c.id) ?? null;
        });
      }
    } else {
      items.forEach((a) => {
        a.userVote = null;
        a.comments?.forEach((c) => (c.userVote = null));
      });
    }

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async create(dto: Partial<ArticleEntity>) {
    // 400 — обязательные поля
    if (!dto.title?.trim()) {
      throw new BadRequestException('Заголовок статьи обязателен');
    }
    if (!dto.content?.trim()) {
      throw new BadRequestException('Содержимое статьи обязательно');
    }

    // 409 — дубликат заголовка (unique constraint)
    const exists = await this.repository.existsBy({ title: dto.title });

    if (exists) {
      throw new ConflictException(
        `Статья с заголовком "${dto.title}" уже существует`,
      );
    }

    const article = this.repository.create(dto);
    const result = await this.repository.save(article);

    return this.repository.findOne({
      where: { id: result.id },
      relations: ARTICLE_RELATIONS,
    });
  }

  async update(id: string, dto: Partial<ArticleEntity>) {
    // 404 — статья не найдена
    const exists = await this.repository.existsBy({ id });
    if (!exists) {
      throw new NotFoundException(`Статья с ID "${id}" не найдена`);
    }

    await this.repository.update(id, dto);
    return this.repository.findOne({
      where: { id: id },
      relations: ARTICLE_RELATIONS,
    });
  }

  async ratingUp(id: string) {
    // 404 — статья не найдена
    const article = await this.repository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`Статья с ID "${id}" не найдена`);
    }

    const prevRating = article?.rating ?? 0;
    const newRating = prevRating + 1;
    const result = await this.updateRating(id, newRating, article);

    return result;
  }

  async ratingDown(id: string) {
    // 404 — статья не найдена
    const article = await this.repository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException(`Статья с ID "${id}" не найдена`);
    }

    const prevRating = article?.rating ?? 0;
    const newRating = prevRating - 1;
    const result = await this.updateRating(id, newRating, article);

    return result;
  }

  async updateRating(
    id: string,
    rating: number,
    articleEntity?: ArticleEntity | null,
  ) {
    const article = articleEntity ?? (await this.repository.findOneBy({ id }));

    // 404 — статья не найдена
    if (!article) {
      throw new NotFoundException(`Статья с ID "${id}" не найдена`);
    }

    const prevRating = article.rating;
    await this.repository.update(id, { rating });

    // 404 — не удалось перечитать после обновления
    const result = await this.findOneWithRelations(id);

    result.userVote = null;
    result.comments?.forEach((c) => (c.userVote = null));

    // Отправляем событие WebSocket
    this.eventsGateway.sendToTopic(`article:${id}`, 'article-rating-changed', {
      type: WEBSOCKET_TYPES.ARTICLE_RATING_CHANGED,
      payload: {
        articleId: id,
        rating,
        prevRating,
        /*
          Поле добавлено для сохранения интерфейса сообщения, хотя данный endpoint не использует систему голосов
         */
        votesCoint: null,
      },
    });

    return result;
  }

  async remove(id: string) {
    const article = await this.repository.findOneBy({ id });
    if (!article) {
      throw new NotFoundException('Статья не найдена');
    }

    return this.repository.remove(article);
  }

  // Голосование по звёздам (1-5). Повторный голос - замена предыдущего
  async addVote(articleId: string, vote: number, userId: string) {
    // 400 — некорректное значение голоса
    if (vote < 1 || vote > 5) {
      throw new BadRequestException('Оценка должна быть от 1 до 5');
    }

    // 404 — статья не найдена
    const article = await this.repository.findOneBy({ id: articleId });
    if (!article) {
      throw new NotFoundException(`Статья с ID "${articleId}" не найдена`);
    }

    const prevRating = article.avgRating;

    // Найти существующий голос или создать новый
    let existingVote = await this.voteRepository.findOne({
      where: { articleId, userId },
    });

    if (existingVote) {
      existingVote.vote = vote;
      await this.voteRepository.save(existingVote);
    } else {
      await this.voteRepository.save(
        this.voteRepository.create({ articleId, userId, vote }),
      );
    }

    // Пересчёт avgRating и votesCoun
    const { avg, count } = await this.voteRepository
      .createQueryBuilder('v')
      .select('AVG(v.vote)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('v.articleId = :articleId', { articleId })
      .getRawOne();

    const avgRating = parseFloat(avg) || 0;
    const votesCount = parseInt(count) || 0;

    await this.repository.update(articleId, { avgRating, votesCount });

    // 404 — не удалось перечитать после обновления
    const result = await this.findOneWithRelations(articleId);

    result.userVote = vote;
    result.comments?.forEach((c) => (c.userVote = null));

    // Отправляем событие WebSocket об изменении рейтинга
    this.eventsGateway.sendToTopic(
      `article:${articleId}`,
      'article-rating-changed',
      {
        type: WEBSOCKET_TYPES.ARTICLE_RATING_CHANGED,
        payload: {
          articleId,
          votesCount: votesCount,
          rating: avgRating,
          prevRating,
        },
      },
    );

    return result;
  }
}
