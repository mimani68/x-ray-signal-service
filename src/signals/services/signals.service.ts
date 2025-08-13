import { Injectable, Logger } from '@nestjs/common';

import { HttpBadRequestException, HttpConflictException, HttpInternalException, HttpNotFoundException } from 'src/common/errors';
import { SignalRepository } from '../repositories/signal.repository';
import { Signal } from '../schemas/signal.schema';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly signalRepository: SignalRepository
  ) { }

  async saveSignals(signals: Partial<Signal>[]): Promise<Signal[]> {
    if (!signals || !Array.isArray(signals)) {
      throw new HttpBadRequestException('Invalid signals data');
    }

    try {
      return await this.signalRepository.bulkCreate(signals);
    } catch (error) {
      this.logger.error(`Failed to save signals: ${error.message}`);
      if (error.name === 'SignalRepositoryError') {
        if (error.code === 'DUPLICATE_KEY') {
          this.logger.warn('Duplicate signals detected');
          throw new HttpConflictException('Some signals already exist');
        }
        if (error.code === 'VALIDATION_ERROR') {
          throw new HttpBadRequestException(error.message);
        }
      }
      throw new HttpInternalException('Failed to save signals');
    }
  }

  async getSignals(
    deviceId?: string,
    startTime?: number,
    endTime?: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{ data: Signal[]; total: number; page: number; limit: number }> {
    if (page < 1) throw new HttpBadRequestException('Page number must be at least 1');
    if (limit < 1 || limit > 100) throw new HttpBadRequestException('Limit must be between 1 and 100');
    if (startTime && endTime && startTime > endTime) {
      throw new HttpBadRequestException('Start time cannot be greater than end time');
    }

    const query: Record<string, any> = {};
    if (deviceId) query.deviceId = deviceId;
    if (startTime || endTime) {
      query.time = {};
      if (startTime) query.time.$gte = startTime;
      if (endTime) query.time.$lte = endTime;
    }

    try {
      return await this.signalRepository.getAll(query, page, limit);
    } catch (error) {
      this.logger.error(`Failed to retrieve signals: ${error.message}`);
      throw new HttpInternalException('Failed to retrieve signals');
    }
  }

  async getSignalById(id: string): Promise<Signal> {
    try {
      const signal = await this.signalRepository.getSingle(id);
      if (!signal) throw new HttpNotFoundException('Signal not found');
      return signal;
    } catch (error) {
      this.logger.error(`Failed to retrieve signal ${id}: ${error.message}`);
      if (error.name === 'SignalRepositoryError' && error.code === 'INVALID_ID') {
        throw new HttpBadRequestException('Invalid signal ID');
      }
      throw new HttpInternalException('Failed to retrieve signal');
    }
  }

  async deleteSignals(ids: string[]): Promise<number> {
    if (!ids || !Array.isArray(ids)) {
      throw new HttpBadRequestException('Invalid signal IDs');
    }

    try {
      return await this.signalRepository.deleteBulk(ids);
    } catch (error) {
      this.logger.error(`Failed to delete signals: ${error.message}`);
      if (error.name === 'SignalRepositoryError' && error.code === 'INVALID_ID') {
        throw new HttpBadRequestException('Invalid signal ID in the list');
      }
      throw new HttpInternalException('Failed to delete signals');
    }
  }

  async updateSignals(ids: string[], updateData: Partial<Signal>): Promise<number> {
    if (!ids || !Array.isArray(ids)) {
      throw new HttpBadRequestException('Invalid signal IDs');
    }
    if (!updateData || typeof updateData !== 'object') {
      throw new HttpBadRequestException('Invalid update data');
    }

    try {
      return await this.signalRepository.updateBulk(ids, updateData);
    } catch (error) {
      this.logger.error(`Failed to update signals: ${error.message}`);
      if (error.name === 'SignalRepositoryError') {
        if (error.code === 'INVALID_ID') {
          throw new HttpBadRequestException('Invalid signal ID in the list');
        }
        if (error.code === 'DUPLICATE_KEY') {
          throw new HttpConflictException('Update would create duplicate signals');
        }
      }
      throw new HttpInternalException('Failed to update signals');
    }
  }
}
