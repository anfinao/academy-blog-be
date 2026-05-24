import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserEntity } from '../data/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enums/roles';
import { RefreshToken } from '../data/entities/refresh-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async registerUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { username, email, password } = createUserDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ username }, { email }],
    });

    if (existingUser) {
      throw new ConflictException(
        'Пользователь с таким именем или email уже существует',
      );
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = this.userRepository.create({
      username,
      email,
      password: hashedPassword,
      role: createUserDto.role ?? UserRole.USER,
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
      throw new BadRequestException(
        `Пользователь ${user.username} уже заблокирован`,
      );
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
      throw new BadRequestException(
        `Пользователь ${user.username} не заблокирован`,
      );
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

  async findOneById(userId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findOneByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findOneByLogin(login: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: [{ username: login }, { email: login }],
    });
  }

  async findOneByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async updateLastActive(userId: string): Promise<void> {
    await this.userRepository.update(userId, { lastActiveTime: new Date() });
  }

  async createRefreshToken(refreshToken: RefreshToken): Promise<RefreshToken> {
    return this.refreshTokenRepository.save(refreshToken);
  }

  async findRefreshTokenByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findOne({ where: { token } });
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.refreshTokenRepository.update(tokenId, { isRevoked: true });
  }

  async findRefreshTokensByUserId(userId: string): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: { userId, isRevoked: false },
    });
  }
}
