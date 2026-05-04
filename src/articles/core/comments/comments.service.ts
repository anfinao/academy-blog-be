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
}
