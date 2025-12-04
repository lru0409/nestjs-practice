import { PostsService } from './posts.service';

describe('PostsService (unit)', () => {
  let service: PostsService;
  let prisma: {
    post: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      post: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new PostsService(prisma as any);
  });

  describe('post', () => {
    it('should call prisma.post.findUnique with the correct args', async () => {
      prisma.post.findUnique.mockResolvedValue({
        id: 1,
        title: 'title',
        content: 'content',
        published: false,
        authorId: 1,
      });
      const result = await service.post({ id: 1 });

      expect(prisma.post.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        id: 1,
        title: 'title',
        content: 'content',
        published: false,
        authorId: 1,
      });
    });
  });

  describe('posts', () => {
    it('should call prisma.post.findMany with the correct args', async () => {
      const params = { where: { published: true } };
      prisma.post.findMany.mockResolvedValue([
        {
          id: 1,
          title: 'title',
          content: 'content',
          published: true,
          authorId: 1,
        },
      ]);
      const result = await service.posts(params);

      expect(prisma.post.findMany).toHaveBeenCalledWith(params);
      expect(result).toEqual([
        {
          id: 1,
          title: 'title',
          content: 'content',
          published: true,
          authorId: 1,
        },
      ]);
    });
  });

  describe('createPost', () => {
    it('should call prisma.post.create with correct args', async () => {
      const data = {
        title: 'title',
        content: 'content',
        author: { connect: { email: 'author@gmail.com' } },
      };
      prisma.post.create.mockResolvedValue({
        id: 1,
        ...data,
        published: false,
      });

      const result = await service.createPost(data);

      expect(prisma.post.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual({ id: 1, ...data, published: false });
    });
  });

  describe('updatePost', () => {
    it('should call prisma.post.update with correct args', async () => {
      const params = { where: { id: 1 }, data: { published: true } };
      prisma.post.update.mockResolvedValue({
        id: 1,
        title: 'title',
        content: 'content',
        published: true,
        authorId: 1,
      });
      const result = await service.updatePost(params);
      expect(prisma.post.update).toHaveBeenCalledWith(params);
      expect(result).toEqual({
        id: 1,
        title: 'title',
        content: 'content',
        published: true,
        authorId: 1,
      });
    });
  });

  describe('deletePost', () => {
    it('should call prisma.post.delete with correct args', async () => {
      prisma.post.delete.mockResolvedValue({
        id: 1,
        title: 'title',
        content: 'content',
        published: false,
        authorId: 1,
      });
      const result = await service.deletePost({ id: 1 });

      expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual({
        id: 1,
        title: 'title',
        content: 'content',
        published: false,
        authorId: 1,
      });
    });
  });
});
