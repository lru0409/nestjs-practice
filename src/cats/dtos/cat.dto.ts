import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCatDto {
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  @MaxLength(20, { message: 'name must be at most 20 characters long' })
  name: string;

  @IsNotEmpty({ message: 'age is required' })
  @IsInt({ message: 'age must be an integer' })
  @Min(0, { message: 'age must be zero or a positive integer' })
  age: number;

  @IsNotEmpty({ message: 'breed is required' })
  @IsString({ message: 'breed must be a string' })
  breed: string;
}

export class UpdateCatDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  @MaxLength(20, { message: 'name must be at most 20 characters long' })
  name?: string;

  @IsOptional()
  @IsInt({ message: 'age must be an integer' })
  @Min(0, { message: 'age must be zero or a positive integer' })
  age?: number;

  @IsOptional()
  @IsString({ message: 'breed must be a string' })
  breed?: string;
}
