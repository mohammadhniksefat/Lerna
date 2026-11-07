import { UserDto } from './user.dto';

export class AuthResponseDto {
  accessToken!: string;
  user!: UserDto;
}
