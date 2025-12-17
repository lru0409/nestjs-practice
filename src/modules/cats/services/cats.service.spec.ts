import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { HttpService } from '@/shared/http/services/http.service';
import { CatsService } from './cats.service';

describe('CatsService (unit)', () => {
  let service: CatsService;
  let httpService: { get: jest.Mock };

  beforeEach(async () => {
    httpService = { get: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CatsService,
        {
          provide: HttpService,
          useValue: httpService,
        },
      ],
    }).compile();

    service = module.get(CatsService);
  });

  describe('getRandomImage', () => {
    it('should return a random cat image', async () => {
      httpService.get.mockResolvedValue([
        {
          id: 'ams',
          url: 'https://cdn2.thecatapi.com/images/ams.jpg',
          width: 500,
          height: 453,
        },
      ]);

      const result = await service.getRandomImage();
      expect(httpService.get).toHaveBeenCalledWith(
        'https://api.thecatapi.com/v1/images/search',
      );
      expect(result).toEqual({
        url: 'https://cdn2.thecatapi.com/images/ams.jpg',
      });
    });

    it('should throw NotFoundException if no image is found', async () => {
      httpService.get.mockResolvedValue([]);
      await expect(service.getRandomImage()).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a cat', () => {
      const cat = service.create({ name: 'nabi', age: 2, breed: 'persian' });
      expect(cat).toEqual({ name: 'nabi', age: 2, breed: 'persian' });
    });

    it('should throw ConflictException for duplicate name', () => {
      service.create({ name: 'nabi', age: 2, breed: 'persian' });
      expect(() =>
        service.create({ name: 'nabi', age: 3, breed: 'mix' }),
      ).toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return an empty array initially', () => {
      expect(service.findAll()).toEqual([]);
    });

    it('should return all created cats', () => {
      service.create({ name: 'nabi', age: 2, breed: 'persian' });
      service.create({ name: 'choco', age: 3, breed: 'mix' });

      expect(service.findAll()).toEqual([
        { name: 'nabi', age: 2, breed: 'persian' },
        { name: 'choco', age: 3, breed: 'mix' },
      ]);
    });
  });

  describe('findOne', () => {
    it('should return a cat by name', () => {
      service.create({ name: 'nabi', age: 2, breed: 'persian' });
      const cat = service.findOne('nabi');

      expect(cat).toEqual({ name: 'nabi', age: 2, breed: 'persian' });
    });

    it('should throw NotFoundException if cat does not exist', () => {
      expect(() => service.findOne('nabi')).toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove the cat', () => {
      service.create({ name: 'nabi', age: 2, breed: 'persian' });
      service.remove('nabi');

      expect(service.findAll()).toEqual([]);
    });

    it('should throw NotFoundException if cat does not exist', () => {
      expect(() => service.remove('nabi')).toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update the cat fields', () => {
      service.create({ name: 'nabi', age: 2, breed: 'persian' });
      const updated = service.update('nabi', { age: 3, breed: 'mix' });

      expect(updated).toEqual({ name: 'nabi', age: 3, breed: 'mix' });
    });

    it('should throw NotFoundException if cat does not exist', () => {
      expect(() => service.update('nabi', { age: 3, breed: 'mix' })).toThrow(
        NotFoundException,
      );
    });

    it('should throw ConflictException when changing name to an existing one', () => {
      service.create({ name: 'nabi', age: 2, breed: 'persian' });
      service.create({ name: 'choco', age: 3, breed: 'mix' });
      expect(() => service.update('nabi', { name: 'choco' })).toThrow(
        ConflictException,
      );
    });
  });
});
