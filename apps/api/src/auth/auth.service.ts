import {
  Injectable,
  OnModuleInit,
  Logger,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(user: User): Promise<AuthResponseDto> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = jwt.sign(
      payload,
      this.configService.get<string>('jwt.secret')!,
      {
        expiresIn: this.configService.get<string>('jwt.expiresIn')! as any,
      },
    );

    return {
      accessToken,
      user: this.toUserDto(user),
    };
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      this.configService.get<number>('bcrypt.saltRounds')!,
    );

    const userEntity = this.userRepository.create({
      email: dto.email,
      passwordHash,
      role: UserRole.STUDENT,
    } as Partial<User>);
    await this.userRepository.save(userEntity);

    const accessToken = jwt.sign(
      { sub: userEntity.id, email: userEntity.email, role: userEntity.role },
      this.configService.get<string>('jwt.secret')!,
      {
        expiresIn: this.configService.get<string>('jwt.expiresIn')! as any,
      },
    );

    return {
      accessToken,
      user: this.toUserDto(userEntity),
    };
  }

  async bootstrapAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>('admin.email');
    const adminPassword = this.configService.get<string>('admin.password');

    if (!adminEmail || !adminPassword) {
      this.logger.error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be set to provision the initial Admin account. Aborting startup.',
      );
      throw new Error(
        'ADMIN_EMAIL and ADMIN_PASSWORD must be set to provision the initial Admin account.',
      );
    }

    const existingAdmin = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });
    if (existingAdmin) {
      this.logger.log('Admin account already exists; bootstrap skipped.');
      return;
    }

    const passwordHash = await bcrypt.hash(
      adminPassword,
      this.configService.get<number>('bcrypt.saltRounds')!,
    );

    const admin = this.userRepository.create({
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
    } as Partial<User>);
    await this.userRepository.save(admin);

    this.logger.log(`Admin account provisioned: ${adminEmail}`);
  }

  private toUserDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async onModuleInit(): Promise<void> {
    await this.bootstrapAdmin();
  }
}
