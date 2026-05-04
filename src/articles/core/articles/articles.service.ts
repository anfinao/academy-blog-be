import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArticleEntity } from '../../data/entities/article/article.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ArticlesService {
    constructor(
        @InjectRepository(ArticleEntity)
        private readonly repository: Repository<ArticleEntity>,
    ) { }

    async findOne(id: string) {
        const article = await this.repository.findOne({
            where: { id },
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
        const newRating = (article?.rating ?? 0) + 1;
        return this.updateRating(id, newRating);
    }

    async ratingDown(id: string) {
        const article = await this.repository.findOneBy({ id });
        const newRating = (article?.rating ?? 0) - 1;
        return this.updateRating(id, newRating);
    }

    async updateRating(id: string, rating: number) {
        await this.repository.update(id, { rating });
        return this.repository.findOneBy({ id });
    }

    async remove(id: string) {
        const article = await this.repository.findOneBy({ id });
        if (!article) throw new NotFoundException('Статья не найдена');
        return this.repository.remove(article);
    }
}
