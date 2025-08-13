import { Test, TestingModule } from '@nestjs/testing';
import { SignalsService } from './signals.service';
import { SignalRepository } from '../repositories/signal.repository';
import { HttpBadRequestException, HttpConflictException, HttpInternalException, HttpNotFoundException } from 'src/common/errors';
import { Signal } from '../schemas/signal.schema';
import { Logger } from '@nestjs/common';

describe('SignalsService', () => {
    let service: SignalsService;
    let signalRepository: SignalRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SignalsService,
                {
                    provide: SignalRepository,
                    useValue: {
                        bulkCreate: jest.fn(),
                        getAll: jest.fn(),
                        getSingle: jest.fn(),
                        deleteBulk: jest.fn(),
                        updateBulk: jest.fn(),
                    },
                },
                {
                    provide: Logger,
                    useValue: {
                        error: jest.fn(),
                        warn: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<SignalsService>(SignalsService);
        signalRepository = module.get<SignalRepository>(SignalRepository);
    });

    describe('saveSignals', () => {
        it('should throw HttpBadRequestException if signals is not an array', async () => {
            await expect(service.saveSignals(null)).rejects.toThrow(HttpBadRequestException);
        });

        it('should call bulkCreate on signalRepository', async () => {
            const signals: Partial<Signal>[] = [{ deviceId: 'device1' }];
            (signalRepository.bulkCreate as jest.Mock).mockResolvedValue([{} as Signal]);
            await service.saveSignals(signals);
            expect(signalRepository.bulkCreate).toHaveBeenCalledWith(signals);
        });

        it('should throw HttpConflictException if duplicate signals detected', async () => {
            const error = { name: 'SignalRepositoryError', code: 'DUPLICATE_KEY' };
            (signalRepository.bulkCreate as jest.Mock).mockRejectedValue(error);
            await expect(service.saveSignals([{}])).rejects.toThrow(HttpConflictException);
        });

        it('should throw HttpBadRequestException if validation error occurs', async () => {
            const error = { name: 'SignalRepositoryError', code: 'VALIDATION_ERROR', message: 'Validation error' };
            (signalRepository.bulkCreate as jest.Mock).mockRejectedValue(error);
            await expect(service.saveSignals([{}])).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpInternalException if unknown error occurs', async () => {
            (signalRepository.bulkCreate as jest.Mock).mockRejectedValue(new Error('Unknown error'));
            await expect(service.saveSignals([{}])).rejects.toThrow(HttpInternalException);
        });
    });

    describe('getSignals', () => {
        it('should throw HttpBadRequestException if page is less than 1', async () => {
            await expect(service.getSignals(undefined, undefined, undefined, 0)).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpBadRequestException if limit is not between 1 and 100', async () => {
            await expect(service.getSignals(undefined, undefined, undefined, 1, 0)).rejects.toThrow(HttpBadRequestException);
            await expect(service.getSignals(undefined, undefined, undefined, 1, 101)).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpBadRequestException if startTime is greater than endTime', async () => {
            await expect(service.getSignals(undefined, 2, 1)).rejects.toThrow(HttpBadRequestException);
        });

        it('should call getAll on signalRepository with correct query', async () => {
            const query = { deviceId: 'device1', time: { $gte: 1, $lte: 2 } };
            (signalRepository.getAll as jest.Mock).mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 });
            await service.getSignals('device1', 1, 2);
            expect(signalRepository.getAll).toHaveBeenCalledWith(query, 1, 10);
        });

        it('should throw HttpInternalException if unknown error occurs', async () => {
            (signalRepository.getAll as jest.Mock).mockRejectedValue(new Error('Unknown error'));
            await expect(service.getSignals()).rejects.toThrow(HttpInternalException);
        });
    });

    describe('getSignalById', () => {
        it('should throw HttpNotFoundException if signal is not found', async () => {
            (signalRepository.getSingle as jest.Mock).mockResolvedValue(null);
            await expect(service.getSignalById('id')).rejects.toThrow(HttpNotFoundException);
        });

        it('should call getSingle on signalRepository', async () => {
            (signalRepository.getSingle as jest.Mock).mockResolvedValue({} as Signal);
            await service.getSignalById('id');
            expect(signalRepository.getSingle).toHaveBeenCalledWith('id');
        });

        it('should throw HttpBadRequestException if invalid ID is provided', async () => {
            const error = { name: 'SignalRepositoryError', code: 'INVALID_ID' };
            (signalRepository.getSingle as jest.Mock).mockRejectedValue(error);
            await expect(service.getSignalById('id')).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpInternalException if unknown error occurs', async () => {
            (signalRepository.getSingle as jest.Mock).mockRejectedValue(new Error('Unknown error'));
            await expect(service.getSignalById('id')).rejects.toThrow(HttpInternalException);
        });
    });

    describe('deleteSignals', () => {
        it('should throw HttpBadRequestException if ids is not an array', async () => {
            await expect(service.deleteSignals(null)).rejects.toThrow(HttpBadRequestException);
        });

        it('should call deleteBulk on signalRepository', async () => {
            (signalRepository.deleteBulk as jest.Mock).mockResolvedValue(1);
            await service.deleteSignals(['id']);
            expect(signalRepository.deleteBulk).toHaveBeenCalledWith(['id']);
        });

        it('should throw HttpBadRequestException if invalid ID is in the list', async () => {
            const error = { name: 'SignalRepositoryError', code: 'INVALID_ID' };
            (signalRepository.deleteBulk as jest.Mock).mockRejectedValue(error);
            await expect(service.deleteSignals(['id'])).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpInternalException if unknown error occurs', async () => {
            (signalRepository.deleteBulk as jest.Mock).mockRejectedValue(new Error('Unknown error'));
            await expect(service.deleteSignals(['id'])).rejects.toThrow(HttpInternalException);
        });
    });

    describe('updateSignals', () => {
        it('should throw HttpBadRequestException if ids is not an array', async () => {
            await expect(service.updateSignals(null, {})).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpBadRequestException if updateData is not an object', async () => {
            await expect(service.updateSignals(['id'], null)).rejects.toThrow(HttpBadRequestException);
        });

        it('should call updateBulk on signalRepository', async () => {
            (signalRepository.updateBulk as jest.Mock).mockResolvedValue(1);
            await service.updateSignals(['id'], {});
            expect(signalRepository.updateBulk).toHaveBeenCalledWith(['id'], {});
        });

        it('should throw HttpBadRequestException if invalid ID is in the list', async () => {
            const error = { name: 'SignalRepositoryError', code: 'INVALID_ID' };
            (signalRepository.updateBulk as jest.Mock).mockRejectedValue(error);
            await expect(service.updateSignals(['id'], {})).rejects.toThrow(HttpBadRequestException);
        });

        it('should throw HttpConflictException if update would create duplicate signals', async () => {
            const error = { name: 'SignalRepositoryError', code: 'DUPLICATE_KEY' };
            (signalRepository.updateBulk as jest.Mock).mockRejectedValue(error);
            await expect(service.updateSignals(['id'], {})).rejects.toThrow(HttpConflictException);
        });

        it('should throw HttpInternalException if unknown error occurs', async () => {
            (signalRepository.updateBulk as jest.Mock).mockRejectedValue(new Error('Unknown error'));
            await expect(service.updateSignals(['id'], {})).rejects.toThrow(HttpInternalException);
        });
    });
});