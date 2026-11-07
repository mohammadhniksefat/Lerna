import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
export declare class AuthService implements OnModuleInit {
    private readonly userRepository;
    private readonly configService;
    private readonly logger;
    constructor(userRepository: Repository<User>, configService: ConfigService);
    findByEmail(email: string): Promise<User | null>;
    validateUser(email: string, password: string): Promise<User | null>;
    login(user: User): Promise<AuthResponseDto>;
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    bootstrapAdmin(): Promise<void>;
    private toUserDto;
    onModuleInit(): Promise<void>;
}
