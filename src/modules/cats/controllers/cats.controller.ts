import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Patch,
  Param,
  HttpCode,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiConflictResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { CreateCatDto, UpdateCatDto, CatDto } from '../dtos/cats.dto';
import { CatsService } from '../services/cats.service';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  @Roles(['admin'])
  @ApiCreatedResponse({
    description: 'The cat has been successfully created.',
    type: CatDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiConflictResponse({ description: 'The cat name already exists.' })
  create(@Body() createCatDto: CreateCatDto): CatDto {
    return this.catsService.create(createCatDto);
  }

  @Get()
  @ApiOkResponse({
    description: 'The cats have been successfully retrieved.',
    type: [CatDto],
  })
  findAll(): CatDto[] {
    return this.catsService.findAll();
  }

  @Get(':name')
  @ApiOkResponse({
    description: 'The cat has been successfully retrieved.',
    type: CatDto,
  })
  @ApiNotFoundResponse({ description: 'The cat not found.' })
  findOne(@Param('name') name: string): CatDto {
    return this.catsService.findOne(name);
  }

  @Delete(':name')
  @Roles(['admin'])
  @HttpCode(204)
  @ApiNoContentResponse({
    description: 'The cat has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'The cat not found.' })
  remove(@Param('name') name: string) {
    this.catsService.remove(name);
  }

  @Patch(':name')
  @Roles(['admin'])
  @ApiOkResponse({
    description: 'The cat has been successfully updated.',
    type: CatDto,
  })
  @ApiBadRequestResponse({ description: 'Bad request' })
  @ApiNotFoundResponse({ description: 'The cat not found.' })
  @ApiConflictResponse({ description: 'The cat name already exists.' })
  update(
    @Param('name') name: string,
    @Body() updateCatDto: UpdateCatDto,
  ): CatDto {
    return this.catsService.update(name, updateCatDto);
  }
}
