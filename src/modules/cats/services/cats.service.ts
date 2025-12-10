import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreateCatDto, UpdateCatDto } from '../dtos/cats.dto';
import { Cat } from '../interfaces/cats.interface';

@Injectable()
export class CatsService {
  private readonly cats: Cat[] = [];

  create(cat: CreateCatDto): Cat {
    // name 중복 체크
    const exist = this.cats.find((c) => c.name === cat.name);
    if (exist) {
      throw new ConflictException(`Cat with name ${cat.name} already exists`);
    }
    this.cats.push(cat);
    return cat;
  }

  findAll(): Cat[] {
    return this.cats;
  }

  findOne(name: string): Cat {
    const cat = this.cats.find((c) => c.name === name);
    if (!cat) {
      throw new NotFoundException(`Cat with name ${name} not found`);
    }
    return cat;
  }

  remove(name: string): void {
    const index = this.cats.findIndex((c) => c.name === name);
    if (index == -1) {
      throw new NotFoundException(`Cat with name ${name} not found`);
    }
    this.cats.splice(index, 1);
  }

  update(name: string, updateData: UpdateCatDto): Cat {
    const cat = this.findOne(name);

    // name 중복 검사
    if (updateData.name && updateData.name !== name) {
      const exist = this.cats.find((c) => c.name === updateData.name);
      if (exist) {
        throw new ConflictException(
          `Cat with name ${updateData.name} already exists`,
        );
      }
    }

    Object.assign(cat, {
      name: updateData.name ?? cat.name,
      age: updateData.age ?? cat.age,
      breed: updateData.breed ?? cat.breed,
    });
    return cat;
  }
}
