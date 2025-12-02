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

import { Roles } from '../roles.decorator';
import { CreateCatDto, UpdateCatDto } from './dtos/cat.dto';
import { CatsService } from './cats.service';
import { Cat } from './interfaces/cat.interface';

@Controller('cats')
export class CatsController {
  constructor(private catsService: CatsService) {}

  @Post()
  @Roles(['admin'])
  create(@Body() createCatDto: CreateCatDto) {
    return this.catsService.create(createCatDto);
  }

  @Get()
  findAll(): Cat[] {
    return this.catsService.findAll();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.catsService.findOne(name);
  }

  @Delete(':name')
  @Roles(['admin'])
  @HttpCode(204)
  remove(@Param('name') name: string) {
    this.catsService.remove(name);
  }

  @Patch(':name')
  @Roles(['admin'])
  update(@Param('name') name: string, @Body() updateCatDto: UpdateCatDto) {
    return this.catsService.update(name, updateCatDto);
  }
}
