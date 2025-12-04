import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePostDto {
  @IsNotEmpty({ message: 'title is required' })
  @IsString({ message: 'title must be a string' })
  @MinLength(2, { message: 'title must be at least 2 characters long' })
  @MaxLength(30, { message: 'title must be at most 30 characters long' })
  title: string;

  @IsOptional()
  @IsString({ message: 'content must be a string' })
  @MinLength(2, { message: 'content must be at least 2 characters long' })
  @MaxLength(500, { message: 'content must be at most 500 characters long' })
  content?: string;

  @IsNotEmpty({ message: 'authorEmail is required' })
  @IsEmail({}, { message: 'authorEmail must be a valid email' })
  authorEmail: string;
}
