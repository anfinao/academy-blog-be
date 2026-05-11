import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentEntity } from 'src/articles/data/entities/comment/comment.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(CommentEntity)
        private readonly repository: Repository<CommentEntity>,
    ) { }

    async findOne(id: string) {
        return this.repository.findOneBy({ id });
    }

    // Создание комментария
    async create(dto: Partial<CommentEntity>) {
        const comment = this.repository.create(dto);
        return this.repository.save(comment);
    }

    // Получение комментариев по ID статьи
    async findByArticle(articleId: string) {
        return this.repository.find({
            where: { articleId },
            order: { createdAt: 'DESC' },
        });
    }

    // Изменение рейтинга комментария
    async updateRating(id: string, rating: number) {
        await this.repository.update(id, { rating });
        return this.repository.findOneBy({ id });
    }

    // Увеличение рейтинга на 1
    async upRating(id: string) {
        const comment = await this.repository.findOneBy({ id });
        if (!comment) {
            return null;
        }
        comment.rating = (comment.rating || 0) + 1;
        return this.repository.save(comment);
    }

    // Уменьшение рейтинга на 1
    async downRating(id: string) {
        const comment = await this.repository.findOneBy({ id });
        if (!comment) {
            return null;
        }
        comment.rating = (comment.rating || 0) - 1;
        return this.repository.save(comment);
    }

    async addVote(commentId: string, vote: number) {
        if (vote < 1 || vote > 5) {
            throw new Error('Оценка должна быть от 1 до 5');
        }

        const comment = await this.repository.findOneBy({ id: commentId });
        if (!comment) {
            return null;
        }

        // Добавляем голос в массив
        const votes = comment.votes || [];
        votes.push(vote);

        // Пересчёт средней оценки
        const count = votes.length;
        const sum = votes.reduce((acc, v) => acc + v, 0);
        const avgRating = sum / count;

        comment.votes = votes;
        comment.votesCount = count;
        comment.avgRating = avgRating;

        return this.repository.save(comment);
    }
}
