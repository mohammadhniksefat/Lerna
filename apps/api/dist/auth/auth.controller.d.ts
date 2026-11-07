import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserDto } from './dto/user.dto';
import { User } from '../users/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    login(req: {
        user: User;
    }): Promise<AuthResponseDto>;
    me(req: {
        user: User;
    }): Promise<UserDto>;
}
