import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { CatsController } from './controllers/cats.controller';
import { CatsService } from './services/cats.service';

@Module({
  imports: [HttpModule],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
