import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { CatsController } from './controllers/cats.controller';
import { CatsService } from './services/cats.service';

@Module({
  imports: [ConfigModule],
  controllers: [CatsController],
  providers: [CatsService],
})
export class CatsModule {}
