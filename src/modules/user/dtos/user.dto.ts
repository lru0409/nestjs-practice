import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiSchema, ApiProperty } from '@nestjs/swagger';

import { User } from '@/prisma/generated/client';
@ApiSchema({ description: 'Data required to create a new user.' })
export class CreateUserDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  @MaxLength(20, { message: 'name must be at most 20 characters long' })
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string;
}

@ApiSchema({ description: 'User response model.' })
export class UserDto implements User {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}
