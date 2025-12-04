import { Controller, Post, Body } from '@nestjs/common';

import { User as UserModel } from '@/prisma/generated/client';
import { CreateUserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<UserModel> {
    return this.userService.createUser(createUserDto);
  }
}
