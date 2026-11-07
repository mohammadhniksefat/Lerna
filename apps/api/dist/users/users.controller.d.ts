import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { UserDto } from '../auth/dto/user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<UserDto[]>;
    findOne(id: string): Promise<UserDto>;
    create(dto: {
        email: string;
        password: string;
        role?: UserRole;
    }): Promise<UserDto>;
    updateRole(id: string, dto: {
        role: UserRole;
    }): Promise<UserDto>;
}
