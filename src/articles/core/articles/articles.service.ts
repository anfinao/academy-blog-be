import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from '../../data/entities/article/article.entity';
import { Repository } from 'typeorm';
import { EventsGateway } from '../websocket/events.gateway';
import { WEBSOCKET_TYPES } from './constants';

@Injectable()
export class ArticlesService {
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly repository: Repository<ArticleEntity>,
        private readonly eventsGateway: EventsGateway,
    ) { }

    async findOne(id: string) {
        const article = await this.repository.findOne({
            where: { id },
            relations: ['comments']
        });

        if (!article) {
            throw new NotFoundException(`Статья с ID ${id} не найдена`);
        }

        return article;
    }

    // Пагинация: постранично или накоплением до указанной страницы
    async findAll(page: number = 1, limit: number = 10, cumulative: boolean = false) {
        const skip = cumulative ? 0 : (page - 1) * limit;
        const take = page * limit; // Если cumulative=true, берем всё от 0 до текущей страницы

        const [items, total] = await this.repository.findAndCount({
            skip: cumulative ? 0 : skip,
            take: cumulative ? take : limit,
            order: { createdAt: 'DESC' },
        });

        return {
            items,
            total,
            page,
            limit,
        };
    }

    create(dto: Partial<ArticleEntity>) {
        const article = this.repository.create(dto);
        return this.repository.save(article);
    }

    async update(id: string, dto: Partial<ArticleEntity>) {
        await this.repository.update(id, dto);
        return this.repository.findOneBy({ id });
    }

    async ratingUp(id: string) {
        const article = await this.repository.findOneBy({ id });
        const prevRating = article?.rating ?? 0;
        const newRating = prevRating + 1;
        const result = await this.updateRating(id, newRating);

        return result;
    }

    async ratingDown(id: string) {
        const article = await this.repository.findOneBy({ id });
        const prevRating = article?.rating ?? 0;
        const newRating = prevRating - 1;
        const result = await this.updateRating(id, newRating);

        return result;
    }

    async updateRating(id: string, rating: number) {
        const article = await this.repository.findOneBy({ id });
        const prevRating = article?.rating;
        await this.repository.update(id, { rating });

        const result = await this.repository.findOneBy({ id });

        // Отправляем событие WebSocket
        this.eventsGateway.server.emit('article-rating-changed', {
            type: WEBSOCKET_TYPES.ARTICLE_RATING_CHANGED,
            payload: {
                articleId: id,
                rating,
                prevRating,
            },
        });

        return result;
    }

    async remove(id: string) {
        const article = await this.repository.findOneBy({ id });
        if (!article) throw new NotFoundException('Статья не найдена');
        return this.repository.remove(article);
    }

    async addVote(articleId: string, vote: number) {
        if (vote < 1 || vote > 5) {
            throw new Error('Оценка должна быть от 1 до 5');
        }

        const article = await this.repository.findOneBy({ id: articleId });
        if (!article) {
            return null;
        }

        const prevRating = article.avgRating;
        const prevVotes = article.votes || [];

        // Добавляем голос в массив
        const votes = [...prevVotes, vote];

        // Пересчёт средней оценки
        const count = votes.length;
        const sum = votes.reduce((acc, v) => acc + v, 0);
        const avgRating = sum / count;

        article.votes = votes;
        article.votesCount = count;
        article.avgRating = avgRating;

        const result = await this.repository.save(article);

        // Отправляем событие WebSocket об изменении рейтинга
        this.eventsGateway.server.emit('article-rating-changed', {
            type: WEBSOCKET_TYPES.ARTICLE_RATING_CHANGED,
            payload: {
                articleId,
                rating: avgRating,
                prevRating,
            },
        });

        return result;
    }
}
