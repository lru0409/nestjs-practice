import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';

import { User as UserModel } from '@/prisma/generated/client';
import { CreateUserDto, UserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'The user has been successfully created.',
    type: UserDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'The user email already exists.' })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserModel> {
    return this.userService.createUser(createUserDto);
  }
}
