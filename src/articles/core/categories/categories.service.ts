import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from 'src/articles/data/entities/category/category';
import { Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repository: Repository<CategoryEntity>,
  ) {}

  create(name: string) {
    const category = this.repository.create({ name });
    return this.repository.save(category);
  }

  findAll() {
    return this.repository.find();
  }

  async update(id: string, name: string) {
    await this.repository.update(id, { name });
    return this.repository.findOneBy({ id });
  }

  async remove(id: string) {
    const category = await this.repository.findOneBy({ id });
    if (!category) throw new NotFoundException('Категория не найдена');
    return this.repository.remove(category);
  }
}
