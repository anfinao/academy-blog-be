import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { Repository } from 'typeorm';
import { EventsGateway } from '../websocket/events.gateway';
import { WEBSOCKET_TYPES } from './constants';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly repository: Repository<CommentEntity>,
        private readonly eventsGateway: EventsGateway,
    ) { }

    async findOne(id: string) {
        return this.repository.findOne({
            where: { id },
            relations: ['article'],
        });
    }

    async getCount() {
        return this.repository.count();
    }

    // Создание комментария
    async create(dto: Partial<CommentEntity>) {
        const comment = this.repository.create(dto);
        const result = await this.repository.save(comment);

        // Отправляем событие создания комментария
        this.eventsGateway.sendToTopic(`article:${comment.articleId}`, 'comment-created', {
            type: WEBSOCKET_TYPES.COMMENT_CREATED,
            payload: {
                commentId: result.id,
                articleId: result.articleId,
                content: result.content,
                username: result.username,
                createdAt: result.createdAt,
            },
        });

        return this.repository.findOne({
            where: { id: result.id },
            relations: ['article', 'article.comments'],
        });
    }

    // Получение комментариев по ID статьи
    async findByArticle(articleId: string) {
        return this.repository.find({
            where: { articleId },
            order: { createdAt: 'DESC' },
        });
    }

    async updateRating(id: string, rating: number, commentEntity?: CommentEntity | null) {
        const comment = commentEntity
            ? commentEntity
            : await this.repository.findOneBy({ id });

        if (!comment) {
            return null;
        }

        const prevRating = comment.rating;
        await this.repository.update(id, { rating });

        const result = await this.repository.findOne({
            where: { id },
            relations: ['article', 'article.comments'],
        });

        // Отправляем событие изменения рейтинга комментария
        this.eventsGateway.sendToTopic(`article:${comment.articleId}`, 'comment-rating-changed', {
            type: WEBSOCKET_TYPES.COMMENT_RATING_CHANGED,
            payload: {
                commentId: id,
                articleId: comment.articleId,
                rating: result?.rating,
                prevRating,
            },
        });

        return result;
    }

    // Увеличение рейтинга на 1
    async upRating(id: string) {
        const comment = await this.repository.findOneBy({ id });

        if (!comment) {
            return null;
        }
        const prevRating = comment.rating || 0;
        const newRating = prevRating + 1;
        const result = await this.updateRating(id, newRating, comment);

        return result;
    }

    // Уменьшение рейтинга на 1
    async downRating(id: string) {
        const comment = await this.repository.findOne({
            where: { id },
            relations: ['article', 'article.comments'],
        });

        if (!comment) {
            return null;
        }
        const prevRating = comment.rating || 0;
        const newRating = prevRating - 1;
        const result = await this.updateRating(id, newRating, comment);

        return result;
    }

    async addVote(commentId: string, vote: number) {
        if (vote < 1 || vote > 5) {
            throw new Error('Оценка должна быть от 1 до 5');
        }

        const comment = await this.repository.findOne({
            where: { id: commentId },
            relations: ['article', 'article.comments'],
        });
        if (!comment) {
            return null;
        }

        const prevAvgRating = comment.avgRating;

        // Добавляем голос в массив
        const votes = [...(comment.votes || []), vote];

        // Пересчёт средней оценки
        const count = votes.length;
        const sum = votes.reduce((acc, v) => acc + Number(v), 0);
        const avgRating = sum / count;

        comment.votes = votes;
        comment.votesCount = count;
        comment.avgRating = avgRating;

        const result = await this.repository.save(comment);

        // Отправляем событие изменения рейтинга комментария
        this.eventsGateway.sendToTopic(`article:${comment.articleId}`, 'comment-rating-changed', {
            type: WEBSOCKET_TYPES.COMMENT_RATING_CHANGED,
            payload: {
                commentId,
                articleId: comment.articleId,
                rating: avgRating,
                prevRating: prevAvgRating,
            },
        });

        return result;
    }
}
