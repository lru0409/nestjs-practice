import { Injectable } from '@nestjs/common';

export type User = { userId: number; username: string; password: string };

@Injectable()
export class AuthUserService {
  private readonly users = [
    { userId: 1, username: 'john', password: 'changeme' },
    { userId: 2, username: 'maria', password: 'guess' },
  ];

  findOne(username: string): User | undefined {
    return this.users.find((user) => user.username === username);
  }
}
