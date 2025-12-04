import { UserService } from './user.service';

describe('UserService (unit)', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new UserService(prisma as any);
  });

  describe('user', () => {
    it('should call prisma.user.findUnique with the correct args', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 1,
        name: 'rowoon',
        email: 'rowoon@gmail.com',
      });
      const result = await service.user({ id: 1 });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        id: 1,
        name: 'rowoon',
        email: 'rowoon@gmail.com',
      });
    });
  });

  describe('users', () => {
    it('should call prisma.user.findMany with the correct args', async () => {
      const params = { where: { name: 'rowoon' } };
      prisma.user.findMany.mockResolvedValue([
        { id: 1, name: 'rowoon', email: 'rowoon@gmail.com' },
      ]);
      const result = await service.users(params);

      expect(prisma.user.findMany).toHaveBeenCalledWith(params);
      expect(result).toEqual([
        {
          id: 1,
          name: 'rowoon',
          email: 'rowoon@gmail.com',
        },
      ]);
    });
  });

  describe('createUser', () => {
    it('should call prisma.user.create with the correct args', async () => {
      const data = { name: 'rowoon', email: 'rowoon@gmail.com' };
      prisma.user.create.mockResolvedValue({ id: 1, ...data });
      const result = await service.createUser(data);

      expect(prisma.user.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual({ id: 1, ...data });
    });
  });

  describe('updateUser', () => {
    it('should call prisma.user.update with the correct args', async () => {
      const params = { where: { id: 1 }, data: { name: 'new' } };
      prisma.user.update.mockResolvedValue({
        id: 1,
        name: 'new',
        email: 'rowoon@gmail.com',
      });
      const result = await service.updateUser(params);

      expect(prisma.user.update).toHaveBeenCalledWith(params);
      expect(result).toEqual({ id: 1, name: 'new', email: 'rowoon@gmail.com' });
    });
  });

  describe('deleteUser', () => {
    it('should call prisma.user.delete with the correct args', async () => {
      prisma.user.delete.mockResolvedValue({
        id: 1,
        name: 'rowoon',
        email: 'rowoon@gmail.com',
      });
      const result = await service.deleteUser({ id: 1 });

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        id: 1,
        name: 'rowoon',
        email: 'rowoon@gmail.com',
      });
    });
  });
});
