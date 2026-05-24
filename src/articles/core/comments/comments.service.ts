import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { In, Repository } from 'typeorm';
import { EventsGateway } from '../websocket/events.gateway';
import { WEBSOCKET_TYPES } from './constants';
import { CommentVoteEntity } from 'src/articles/data/entities/comment-vote/comment-vote.entity';
import { ArticleEntity } from 'src/articles/data/entities/article/article.entity';
import { UserEntity } from 'src/users/data/entities/user.entity';

const COMMENT_RELATIONS = [
  'author',
  'votes',
  'article',
  'article.author',
  'article.category',
  'article.votes',
];

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repository: Repository<CommentEntity>,
    @InjectRepository(CommentVoteEntity)
    private readonly voteRepository: Repository<CommentVoteEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepository: Repository<ArticleEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private async findOneWithRelations(id: string): Promise<CommentEntity> {
    const comment = await this.repository.findOne({
      where: { id },
      relations: COMMENT_RELATIONS,
    });
    if (!comment) {
      // 404 — комментарий не найден по ID
      throw new NotFoundException(`Комментарий с ID "${id}" не найден`);
    }
    return comment;
  }

  private async loadUserVote(
    commentId: string,
    userId?: string | null | undefined,
  ): Promise<number | null> {
    if (!userId) {
      return null;
    }

    const vote = await this.voteRepository.findOne({
      where: { commentId, userId },
    });

    return vote?.vote ?? null;
  }

  async findOne(id: string, userId?: string) {
    // 404 — статья не найдена
    const articleExists = await this.articleRepository.existsBy({ id: id });

    if (!articleExists) {
      throw new NotFoundException(`Статья с ID "${id}" не найдена`);
    }

    const comment = await this.repository.findOne({
      where: { id },
      relations: COMMENT_RELATIONS,
    });

    if (comment) {
      comment.userVote = await this.loadUserVote(id, userId);
    }

    return comment;
  }

  // Создание комментария
  async create(dto: Partial<CommentEntity>) {
    // 400 — обязательные поля
    if (!dto.content?.trim()) {
      throw new BadRequestException('Содержимое комментария обязательно');
    }
    if (!dto.articleId) {
      throw new BadRequestException('ID статьи обязателен');
    }
    if (!dto.authorId) {
      throw new BadRequestException('ID автора обязателен');
    }

    // 404 — статья не существует
    const articleExists = await this.articleRepository.existsBy({
      id: dto.articleId,
    });
    if (!articleExists) {
      throw new NotFoundException(`Статья с ID "${dto.articleId}" не найдена`);
    }

    // 404 — пользователь не существует
    const authorExists = await this.userRepository.existsBy({
      id: dto.authorId,
    });
    if (!authorExists) {
      throw new NotFoundException(
        `Пользователь с ID "${dto.authorId}" не найден`,
      );
    }

    const comment = this.repository.create(dto);
    const result = await this.repository.save(comment);

    // Отправляем событие создания комментария
    this.eventsGateway.sendToTopic(
      `article:${result.articleId}`,
      'comment-created',
      {
        type: WEBSOCKET_TYPES.COMMENT_CREATED,
        payload: {
          commentId: result.id,
          articleId: result.articleId,
          content: result.content,
          username: result.username,
          createdAt: result.createdAt,
        },
      },
    );

    const created = await this.repository.findOne({
      where: { id: result.id },
      relations: COMMENT_RELATIONS,
    });

    created!.userVote = null;

    return created;
  }

  // Получение комментариев по ID статьи
  async findByArticle(articleId: string, userId?: string) {
    // 404 — статья не существует
    const articleExists = await this.articleRepository.existsBy({
      id: articleId,
    });
    if (!articleExists) {
      throw new NotFoundException(`Статья с ID "${articleId}" не найдена`);
    }

    const comments = await this.repository.find({
      where: { articleId },
      relations: COMMENT_RELATIONS,
      order: { createdAt: 'DESC' },
    });

    // Загрузка голосов текущего пользователя
    if (userId && comments.length) {
      const ids = comments.map((c) => c.id);
      const votes = await this.voteRepository.find({
        where: { commentId: In(ids), userId },
      });
      const voteMap = new Map(votes.map((v) => [v.commentId, v.vote]));

      comments.forEach((c) => {
        c.userVote = voteMap.get(c.id) ?? null;
      });
    } else {
      comments.forEach((c) => (c.userVote = null));
    }

    return comments;
  }

  async updateRating(
    id: string,
    rating: number,
    userId: string,
    commentEntity?: CommentEntity | null,
  ) {
    const comment = commentEntity
      ? commentEntity
      : await this.repository.findOneBy({ id });

    // 404 — комментарий не найден
    if (!comment) {
      throw new NotFoundException(`Комментарий с ID "${id}" не найден`);
    }

    const prevRating = comment.rating;
    await this.repository.update(id, { rating });

    // 404 — не удалось перечитать после обновления
    const result = await this.findOneWithRelations(id);

    result.userVote = await this.loadUserVote(id, userId);

    // Отправляем событие изменения рейтинга комментария
    this.eventsGateway.sendToTopic(
      `article:${result.articleId}`,
      'comment-rating-changed',
      {
        type: WEBSOCKET_TYPES.COMMENT_RATING_CHANGED,
        payload: {
          commentId: id,
          articleId: comment.articleId,
          rating: result?.rating,
          prevRating,
          likesCount: result.likesCount,
          dislikesCount: result.dislikesCount,
        },
      },
    );

    return result;
  }

  // Увеличение рейтинга на 1
  async upRating(id: string, userId: string) {
    // 404 — комментарий не найден
    const comment = await this.repository.findOneBy({ id });

    if (!comment) {
      throw new NotFoundException(`Комментарий с ID "${id}" не найден`);
    }

    const prevRating = comment.rating || 0;
    const newRating = prevRating + 1;
    const result = await this.updateRating(id, newRating, userId, comment);

    return result;
  }

  // Уменьшение рейтинга на 1
  async downRating(id: string, userId: string) {
    // 404 — комментарий не найден
    const comment = await this.repository.findOneBy({ id });

    if (!comment) {
      throw new NotFoundException(`Комментарий с ID "${id}" не найден`);
    }

    const prevRating = comment.rating || 0;
    const newRating = prevRating - 1;
    const result = await this.updateRating(id, newRating, userId, comment);

    return result;
  }

  // Голосование лайк/дизлайк (-1, 0, 1). Повторный голос — замена
  async addVote(commentId: string, vote: number, userId: string) {
    // 400 — некорректное значение голоса
    if (![-1, 0, 1].includes(vote)) {
      throw new BadRequestException(
        'Голос должен быть -1 (дизлайк), 0 (нейтральный) или 1 (лайк)',
      );
    }

    // 404 — комментарий не найден
    const comment = await this.repository.findOneBy({ id: commentId });

    if (!comment) {
      throw new NotFoundException(`Комментарий с ID "${commentId}" не найден`);
    }

    // Найти существующий голос или создать новый
    let existingVote = await this.voteRepository.findOne({
      where: { commentId, userId },
    });

    if (existingVote) {
      existingVote.vote = vote;
      await this.voteRepository.save(existingVote);
    } else {
      await this.voteRepository.save(
        this.voteRepository.create({ commentId, userId, vote }),
      );
    }

    const allVotes = await this.voteRepository.find({ where: { commentId } });
    const likesCount = allVotes.filter((v) => v.vote === 1).length;
    const dislikesCount = allVotes.filter((v) => v.vote === -1).length;

    await this.repository.update(commentId, { likesCount, dislikesCount });

    this.eventsGateway.sendToTopic(
      `article:${comment.articleId}`,
      'comment-rating-changed',
      {
        type: WEBSOCKET_TYPES.COMMENT_RATING_CHANGED,
        payload: {
          commentId,
          articleId: comment.articleId,
          rating: comment.rating,
          prevRating: comment.rating,
          likesCount: likesCount,
          dislikesCount: dislikesCount,
        },
      },
    );

    // 404 — не удалось перечитать после обновления
    const result = await this.findOneWithRelations(commentId);

    result.userVote = vote;

    return result;
  }
}
