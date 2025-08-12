import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { BaseRepository } from 'src/common/repositories/base.repository';
import { Signal } from 'src/signals/schemas/signal.schema';
import { 
  ERROR_CODE,
  RESPONSE_ERROR_MESSAGE 
} from 'src/common/consts/messages.const';
import { 
  paginationMinTakeCount,
  paginationMaxTakeCount 
} from 'src/common/consts/pagination.const';
import { SignalRepositoryError } from 'src/common/errors/repository.error'
import { SignalRepositoryInterface } from '../interfaces/signal.interfaces';

@Injectable()
export class SignalRepository extends BaseRepository<Signal> implements SignalRepositoryInterface {
  constructor(
    @InjectModel(Signal.name) private readonly signalModel: Model<Signal>
  ) {
    super(signalModel);
  }

  private validateId(id: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch (error) {
      throw new SignalRepositoryError(
        ERROR_CODE.INVALID_ID,
        RESPONSE_ERROR_MESSAGE.INVALID_ID,
        { id }
      );
    }
  }

  private validateInput<T>(input: T, fieldName: string): void {
    if (!input || (typeof input === 'object' && Object.keys(input).length === 0)) {
      throw new SignalRepositoryError(
        ERROR_CODE.VALIDATION_ERROR,
        `${fieldName} cannot be empty`,
        { input }
      );
    }
  }

  async bulkCreate(signals: Partial<Signal>[]): Promise<Signal[]> {
    this.validateInput(signals, 'Signals');

    try {
      const createdSignals = await this.signalModel.insertMany(signals, { ordered: false });
      return createdSignals;
    } catch (error) {
      if (error.code === 11000) {
        throw new SignalRepositoryError(
          ERROR_CODE.DUPLICATE_KEY,
          RESPONSE_ERROR_MESSAGE.DUPLICATE_KEY,
          error.keyValue
        );
      }
      throw new SignalRepositoryError(
        ERROR_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getAll(
    query: Record<string, any> = {},
    page: number = 1,
    limit: number = paginationMinTakeCount
  ): Promise<{ data: Signal[]; total: number; page: number; limit: number }> {
    try {
      // Validate and adjust pagination parameters
      page = Math.max(1, page);
      limit = Math.max(
        paginationMinTakeCount,
        Math.min(limit, paginationMaxTakeCount)
      );

      const [data, total] = await Promise.all([
        this.signalModel
          .find(query)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        this.signalModel.countDocuments(query),
      ]);

      return { data,
        total,
        page,
        limit
      };
    } catch (error) {
      throw new SignalRepositoryError(
        ERROR_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async getSingle(id: string): Promise<Signal> {
    const objectId = this.validateId(id);

    try {
      const signal = await this.signalModel.findById(objectId).lean();
      if (!signal) {
        throw new SignalRepositoryError(
          ERROR_CODE.NOT_FOUND,
          RESPONSE_ERROR_MESSAGE.NOT_FOUND,
          { id }
        );
      }
      return signal;
    } catch (error) {
      if (error instanceof SignalRepositoryError) throw error;
      throw new SignalRepositoryError(
        ERROR_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async deleteBulk(ids: string[]): Promise<number> {
    this.validateInput(ids, 'IDs');

    try {
      const objectIds = ids.map(id => this.validateId(id));
      const result = await this.signalModel.deleteMany({ _id: { $in: objectIds } });
      return result.deletedCount;
    } catch (error) {
      throw new SignalRepositoryError(
        ERROR_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }

  async updateBulk(
    ids: string[],
    updateData: Partial<Signal>
  ): Promise<number> {
    this.validateInput(ids, 'IDs');
    this.validateInput(updateData, 'Update data');

    try {
      const objectIds = ids.map(id => this.validateId(id));
      const result = await this.signalModel.updateMany(
        { _id: { $in: objectIds } },
        updateData
      );
      return result.modifiedCount;
    } catch (error) {
      if (error.code === 11000) {
        throw new SignalRepositoryError(
          ERROR_CODE.DUPLICATE_KEY,
          RESPONSE_ERROR_MESSAGE.DUPLICATE_KEY,
          error.keyValue
        );
      }
      throw new SignalRepositoryError(
        ERROR_CODE.INTERNAL_SERVER_ERROR,
        RESPONSE_ERROR_MESSAGE.INTERNAL_SERVER_ERROR,
        error
      );
    }
  }
}
