import {
  IsString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiSchema, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ApiSchema({ description: 'Data required to create a new cat.' })
export class CreateCatDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  @MaxLength(20, { message: 'name must be at most 20 characters long' })
  name: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'age is required' })
  @IsInt({ message: 'age must be an integer' })
  @Min(0, { message: 'age must be zero or a positive integer' })
  age: number;

  @ApiProperty()
  @IsNotEmpty({ message: 'breed is required' })
  @IsString({ message: 'breed must be a string' })
  breed: string;
}

@ApiSchema({ description: 'Data required to update a cat.' })
export class UpdateCatDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MinLength(2, { message: 'name must be at least 2 characters long' })
  @MaxLength(20, { message: 'name must be at most 20 characters long' })
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt({ message: 'age must be an integer' })
  @Min(0, { message: 'age must be zero or a positive integer' })
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString({ message: 'breed must be a string' })
  breed?: string;
}
