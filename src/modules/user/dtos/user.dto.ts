import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  @MaxLength(20, { message: 'name must be at most 20 characters long' })
  name: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be a valid email' })
  email: string;
}
