import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  NotFoundException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { UserDto } from '../auth/dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(): Promise<UserDto[]> {
    const users = await this.usersService.findAll();
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
    }));
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<UserDto> {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body()
    dto: { email: string; password: string; role?: UserRole },
  ): Promise<UserDto> {
    const user = await this.usersService.create(
      dto.email,
      dto.password,
      dto.role ?? UserRole.STUDENT,
    );
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: { role: UserRole },
  ): Promise<UserDto> {
    const user = await this.usersService.updateRole(id, dto.role);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
