import { Module } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService],
})
export class UserModule {}
