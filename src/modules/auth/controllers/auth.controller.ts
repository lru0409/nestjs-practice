import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: { username: string; password: string }) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req: Request & { user: Record<string, unknown> }) {
    return req.user;
  }
}
