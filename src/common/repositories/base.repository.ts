import { Span } from 'opentracing';
import {
  Model,
  Document,
  FilterQuery,
  UpdateQuery,
  Types,
  HydratedDocument,
  MongooseError,
} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { HttpNotFoundException, HttpConflictException } from 'src/common/errors';
import {
  ERROR_CODE,
  RESPONSE_ERROR_MESSAGE,
} from 'src/common/consts/messages.const';

/**
 * Abstract base repository class for MongoDB operations
 * @typeparam T - Mongoose document type
 */
export abstract class BaseRepository<T extends Document> {
  /**
   * @param model - Injected Mongoose model
   */
  constructor(@InjectModel('') private readonly model: Model<T>) {}

  /**
   * Creates a new document
   * @param data - Data to create document with
   * @param span - Optional tracing span
   * @param idempotencyKey - Optional idempotency key
   * @returns Created document
   * @throws HttpConflictException if duplicate key error occurs
   */
  async create(
    data: Partial<T>,
    span?: Span,
    idempotencyKey?: string,
  ): Promise<HydratedDocument<T>> {
    try {
      if (idempotencyKey) {
        const existing = await this.findOneByCondition(
          { idempotencyKey },
          span,
        );
        if (existing) return existing;
      }

      span?.log({ event: 'create_document_start', data });
      const result = await this.model.create({
        ...data,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      });
      span?.log({ event: 'create_document_success', result });
      return result;
    } catch (error) {
      span?.log({ event: 'create_document_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Finds a document by ID
   * @param id - Document ID
   * @param span - Optional tracing span
   * @returns Found document or null
   * @throws HttpNotFoundException if invalid ID format
   */
  async findOneById(
    id: string,
    span?: Span,
  ): Promise<HydratedDocument<T> | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpNotFoundException(
          `${this.model.modelName} ${RESPONSE_ERROR_MESSAGE.INVALID_ID}`,
          ERROR_CODE.INVALID_ID,
        );
      }

      span?.log({ event: 'find_by_id_start', id });
      const result = await this.model.findById(new Types.ObjectId(id)).exec();
      span?.log({ event: 'find_by_id_result', result });
      return result;
    } catch (error) {
      span?.log({ event: 'find_by_id_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Finds a document by conditions
   * @param filter - Query conditions
   * @param span - Optional tracing span
   * @returns Found document or null
   */
  async findOneByCondition(
    filter: FilterQuery<T>,
    span?: Span,
  ): Promise<HydratedDocument<T> | null> {
    try {
      span?.log({ event: 'find_one_start', filter });
      const result = await this.model.findOne(filter).exec();
      span?.log({ event: 'find_one_result', result });
      return result;
    } catch (error) {
      span?.log({ event: 'find_one_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Finds a document by conditions or fails
   * @param filter - Query conditions
   * @param span - Optional tracing span
   * @param failReason - Custom fail reason
   * @returns Found document
   * @throws HttpNotFoundException if document not found
   */
  async findOneByConditionOrFail(
    filter: FilterQuery<T>,
    span?: Span,
    failReason?: { message: string; code: string },
  ): Promise<HydratedDocument<T>> {
    if (!failReason) {
      failReason = {
        message: `${this.model.modelName} ${RESPONSE_ERROR_MESSAGE.NOT_FOUND}`,
        code: ERROR_CODE.NOT_FOUND,
      };
    }

    span?.log({ event: 'find_one_or_fail_start', filter });
    const result = await this.findOneByCondition(filter, span);
    if (!result) {
      span?.log({ event: 'find_one_or_fail_not_found', filter });
      throw new HttpNotFoundException(failReason.message, failReason.code);
    }
    return result;
  }

  /**
   * Finds all documents matching conditions
   * @param filter - Query conditions
   * @param span - Optional tracing span
   * @returns Array of documents
   */
  async findAll(
    filter: FilterQuery<T> = {},
    span?: Span,
  ): Promise<HydratedDocument<T>[]> {
    try {
      span?.log({ event: 'find_all_start', filter });
      const result = await this.model.find(filter).exec();
      span?.log({ event: 'find_all_result', count: result.length });
      return result;
    } catch (error) {
      span?.log({ event: 'find_all_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Updates a document by ID
   * @param id - Document ID
   * @param data - Update data
   * @param span - Optional tracing span
   * @returns Updated document or null if not found
   * @throws HttpNotFoundException if invalid ID format
   */
  async updateById(
    id: string,
    data: UpdateQuery<T>,
    span?: Span,
  ): Promise<HydratedDocument<T> | null> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpNotFoundException(
          `${this.model.modelName} ${RESPONSE_ERROR_MESSAGE.INVALID_ID}`,
          ERROR_CODE.INVALID_ID,
        );
      }

      span?.log({ event: 'update_by_id_start', id, data });
      const result = await this.model
        .findByIdAndUpdate(new Types.ObjectId(id), data, { new: true })
        .exec();
      span?.log({ event: 'update_by_id_result', result });
      return result;
    } catch (error) {
      span?.log({ event: 'update_by_id_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Updates documents matching conditions
   * @param filter - Query conditions
   * @param data - Update data
   * @param span - Optional tracing span
   * @returns Updated document or null if not found
   */
  async updateWhere(
    filter: FilterQuery<T>,
    data: UpdateQuery<T>,
    span?: Span,
  ): Promise<HydratedDocument<T> | null> {
    try {
      span?.log({ event: 'update_where_start', filter, data });
      const result = await this.model
        .findOneAndUpdate(filter, data, { new: true })
        .exec();
      span?.log({ event: 'update_where_result', result });
      return result;
    } catch (error) {
      span?.log({ event: 'update_where_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Deletes a document by ID
   * @param id - Document ID
   * @param span - Optional tracing span
   * @returns True if document was deleted
   * @throws HttpNotFoundException if invalid ID format
   */
  async deleteById(id: string, span?: Span): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new HttpNotFoundException(
          `${this.model.modelName} ${RESPONSE_ERROR_MESSAGE.INVALID_ID}`,
          ERROR_CODE.INVALID_ID,
        );
      }

      span?.log({ event: 'delete_by_id_start', id });
      const result = await this.model
        .deleteOne({ _id: new Types.ObjectId(id) })
        .exec();
      span?.log({ event: 'delete_by_id_result', deletedCount: result.deletedCount });
      return result.deletedCount > 0;
    } catch (error) {
      span?.log({ event: 'delete_by_id_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Deletes documents matching conditions
   * @param filter - Query conditions
   * @param span - Optional tracing span
   * @returns True if any documents were deleted
   */
  async deleteWhere(filter: FilterQuery<T>, span?: Span): Promise<boolean> {
    try {
      span?.log({ event: 'delete_where_start', filter });
      const result = await this.model.deleteMany(filter).exec();
      span?.log({ event: 'delete_where_result', deletedCount: result.deletedCount });
      return result.deletedCount > 0;
    } catch (error) {
      span?.log({ event: 'delete_where_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Counts documents matching conditions
   * @param filter - Query conditions
   * @param span - Optional tracing span
   * @returns Count of documents
   */
  async count(filter: FilterQuery<T> = {}, span?: Span): Promise<number> {
    try {
      span?.log({ event: 'count_start', filter });
      const result = await this.model.countDocuments(filter).exec();
      span?.log({ event: 'count_result', count: result });
      return result;
    } catch (error) {
      span?.log({ event: 'count_error', error });
      throw this.handleDatabaseError(error);
    }
  }

  /**
   * Handles database errors and converts them to appropriate HTTP exceptions
   * @param error - Original error
   * @returns Appropriate HTTP exception
   */
  private handleDatabaseError(error: unknown): Error {
    if (error instanceof MongooseError) {
      // Handle duplicate key error (code 11000)
      if ('code' in error && error.code === 11000) {
        return new HttpConflictException(
          `${this.model.modelName} ${RESPONSE_ERROR_MESSAGE.DUPLICATE_KEY}`,
          ERROR_CODE.DUPLICATE_KEY,
        );
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        return new HttpConflictException(
          `${this.model.modelName} ${RESPONSE_ERROR_MESSAGE.VALIDATION_ERROR}`,
          ERROR_CODE.VALIDATION_ERROR,
          // @ts-ignore
          error.errors,
        );
      }
    }

    // For other errors, check if it's already an HTTP exception
    if (error instanceof Error && 'statusCode' in error) {
      return error;
    }

    // Fallback to generic error
    return new Error('Database operation failed');
  }
}