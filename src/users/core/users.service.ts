import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../data/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) { }

    async registerUser(createUserDto: CreateUserDto): Promise<UserEntity> {
        const { username, email, password } = createUserDto;

        const existingUser = await this.userRepository.findOne({
            where: [{ username }, { email }],
        });

        if (existingUser) {
            throw new ConflictException('Пользователь с таким именем или email уже существует');
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = this.userRepository.create({
            username,
            email,
            password: hashedPassword,
            lastActiveTime: new Date(),
        });

        return this.userRepository.save(user);
    }

    async blockUser(userId: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
        }

        if (user.isBlocked) {
            throw new BadRequestException(`Пользователь ${user.username} уже заблокирован`);
        }

        user.isBlocked = true;
        return this.userRepository.save(user);
    }

    async unblockUser(userId: string): Promise<UserEntity> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
        }

        if (!user.isBlocked) {
            throw new BadRequestException(`Пользователь ${user.username} не заблокирован`);
        }

        user.isBlocked = false;
        return this.userRepository.save(user);
    }

    async deleteUser(userId: string): Promise<void> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
        }

        await this.userRepository.delete(userId);
    }

    async findOne(userId: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { id: userId } });
    }

    async findOneByUsername(username: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { username } });
    }

    async findOneByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async updateLastActive(userId: string): Promise<void> {
        await this.userRepository.update(userId, { lastActiveTime: new Date() });
    }
}