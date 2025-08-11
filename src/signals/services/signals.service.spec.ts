import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Like, QueryFailedError } from 'typeorm';
import { HttpBadRequestException, HttpInternalException } from 'src/common/errors';
import { SignalsService } from './signals.service';
import { SignalRepository } from '../repositories/signal.repository';
import { SignalEntity } from '../entities/signal';
import { SignalType } from '../enums/signal-type.enum';

describe('SignalsService', () => {
  let service: SignalsService;
  let signalRepository: jest.Mocked<SignalRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignalsService,
        {
          provide: SignalRepository,
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SignalsService>(SignalsService);
    signalRepository = module.get(SignalRepository);
    configService = module.get(ConfigService);
  });

  describe('saveSignals', () => {
    const mockSignal: SignalEntity = {
      id: 1,
      title: 'Software Engineer',
      companyName: 'Tech Corp',
      location: 'Remote',
      postedDate: new Date(),
      salaryRange: { min: 50000, max: 80000, currency: 'USD' },
      externalId: '',
      experience: '',
      provider: '',
      industry: '',
      type: SignalType.FULL_TIME,
      createdAt: undefined,
      updatedAt: undefined
    };

    it('should throw HttpBadRequestException if signals is not an array', async () => {
      await expect(service.saveSignals(null)).rejects.toThrow(HttpBadRequestException);
      await expect(service.saveSignals('invalid' as any)).rejects.toThrow(HttpBadRequestException);
    });

    it('should skip invalid job offer entries', async () => {
      const invalidOffers = [null, undefined, 'invalid', 123];
      await service.saveSignals(invalidOffers as any);
      expect(signalRepository.findOne).not.toHaveBeenCalled();
    });

    it('should save new job offers', async () => {
      signalRepository.findOne.mockResolvedValue(null);
      await service.saveSignals([mockSignal]);
      expect(signalRepository.save).toHaveBeenCalledWith(mockSignal);
    });

    it('should skip existing job offers', async () => {
      signalRepository.findOne.mockResolvedValue(mockSignal);
      await service.saveSignals([mockSignal]);
      expect(signalRepository.save).not.toHaveBeenCalled();
    });

    it('should handle duplicate key errors', async () => {
      signalRepository.findOne.mockResolvedValue(null);
      signalRepository.save.mockRejectedValue(
        new QueryFailedError('', [], new Error('duplicate key value violates unique constraint'))
      );
      await service.saveSignals([mockSignal]);
      expect(signalRepository.save).toHaveBeenCalled();
    });

    it('should handle null constraint errors', async () => {
      signalRepository.findOne.mockResolvedValue(null);
      signalRepository.save.mockRejectedValue(
        new QueryFailedError('', [], new Error('violates not-null constraint'))
      );
      await service.saveSignals([mockSignal]);
      expect(signalRepository.save).toHaveBeenCalled();
    });

    it('should throw HttpInternalException for other errors', async () => {
      signalRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(service.saveSignals([mockSignal])).rejects.toThrow(HttpInternalException);
    });
  });

  describe('getSignals', () => {
    const mockSignals: SignalEntity[] = [
      {
        id: 1,
        title: 'Software Engineer',
        companyName: 'Tech Corp',
        location: 'Remote',
        postedDate: new Date(),
        salaryRange: { min: 50000, max: 80000, currency: 'USD' },
        externalId: '',
        experience: '',
        provider: '',
        industry: '',
        type: SignalType.FULL_TIME,
        createdAt: undefined,
        updatedAt: undefined
      },
      {
        id: 2,
        title: 'Product Manager',
        companyName: 'Tech Corp',
        location: 'Office',
        postedDate: new Date(),
        salaryRange: { min: 70000, max: 100000, currency: 'USD' },
        externalId: '',
        experience: '',
        provider: '',
        industry: '',
        type: SignalType.FULL_TIME,
        createdAt: undefined,
        updatedAt: undefined
      },
    ];

    beforeEach(() => {
      signalRepository.findAndCount.mockResolvedValue({data: mockSignals, total: mockSignals.length});
    });

    it('should throw HttpBadRequestException for invalid page', async () => {
      await expect(service.getSignals(undefined, undefined, undefined, undefined, 0)).rejects.toThrow(HttpBadRequestException);
    });

    it('should throw HttpBadRequestException for invalid limit', async () => {
      await expect(service.getSignals(undefined, undefined, undefined, undefined, 1, 0)).rejects.toThrow(HttpBadRequestException);
      await expect(service.getSignals(undefined, undefined, undefined, undefined, 1, 101)).rejects.toThrow(HttpBadRequestException);
    });

    it('should throw HttpBadRequestException for invalid salary range', async () => {
      await expect(service.getSignals(undefined, undefined, 80000, 50000)).rejects.toThrow(HttpBadRequestException);
    });

    it('should throw HttpBadRequestException for invalid sort field', async () => {
      await expect(service.getSignals(undefined, undefined, undefined, undefined, 1, 10, 'invalidField')).rejects.toThrow(HttpBadRequestException);
    });

    it('should return job offers with default pagination and sorting', async () => {
      const result = await service.getSignals();
      expect(result).toEqual({
        data: mockSignals,
        total: mockSignals.length,
        page: 1,
        limit: 10,
      });
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { postedDate: 'DESC' },
      });
    });

    it('should filter by title', async () => {
      await service.getSignals('Engineer');
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: { title: Like('%Engineer%') },
        skip: 0,
        take: 10,
        order: { postedDate: 'DESC' },
      });
    });

    it('should filter by location', async () => {
      await service.getSignals(undefined, 'Remote');
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: { location: Like('%Remote%') },
        skip: 0,
        take: 10,
        order: { postedDate: 'DESC' },
      });
    });

    it('should filter by min salary', async () => {
      await service.getSignals(undefined, undefined, 60000);
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: { salaryRange: { min: 60000 } },
        skip: 0,
        take: 10,
        order: { postedDate: 'DESC' },
      });
    });

    it('should filter by max salary', async () => {
      await service.getSignals(undefined, undefined, undefined, 90000);
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: { salaryRange: { max: 90000 } },
        skip: 0,
        take: 10,
        order: { postedDate: 'DESC' },
      });
    });

    it('should handle custom sorting', async () => {
      await service.getSignals(undefined, undefined, undefined, undefined, 1, 10, 'title', 'ASC');
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { title: 'ASC' },
      });
    });

    it('should handle nested sorting (salaryRange.min)', async () => {
      await service.getSignals(undefined, undefined, undefined, undefined, 1, 10, 'salaryRange.min', 'ASC');
      expect(signalRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        order: { salaryRange: { min: 'ASC' } },
      });
    });

    it('should handle database errors', async () => {
      signalRepository.findAndCount.mockRejectedValue(new QueryFailedError('', [], new Error('invalid input syntax')));
      await expect(service.getSignals()).rejects.toThrow(HttpBadRequestException);
    });

    it('should throw HttpInternalException for unexpected errors', async () => {
      signalRepository.findAndCount.mockRejectedValue(new Error('Unexpected error'));
      await expect(service.getSignals()).rejects.toThrow(HttpInternalException);
    });
  });
});