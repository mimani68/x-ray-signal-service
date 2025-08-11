import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Like, QueryFailedError } from 'typeorm';

import { HttpBadRequestException, HttpConflictException, HttpInternalException, HttpNotFoundException } from 'src/common/errors'
import { SignalEntity } from '../entities/signal';
import { SignalRepository } from '../repositories/signal.repository';

@Injectable()
export class SignalsService {
  private readonly logger = new Logger(SignalsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly signalRepository: SignalRepository
  ) { }

  async saveSignals(signals: SignalEntity[]): Promise<void> {
    if (!signals || !Array.isArray(signals)) {
      throw new HttpBadRequestException('Invalid job offers data');
    }

    try {
      for (const signal of signals) {
        if (!signal || typeof signal !== 'object') {
          this.logger.warn('Invalid job offer entry skipped');
          continue;
        }

        try {
          const existingSignal = await this.signalRepository.findOne({
            where: {
              title: signal.title,
              companyName: signal.companyName,
              location: signal.location,
              postedDate: signal.postedDate,
            },
          });

          if (!existingSignal) {
            await this.signalRepository.save(signal);
            this.logger.log(`Job offer saved: ${signal.title}`);
          } else {
            this.logger.log(`Job offer already exists: ${signal.title}`);
          }
        } catch (error) {
          if (error instanceof QueryFailedError) {
            // Handle specific PostgreSQL errors
            if (error.message.includes('duplicate key value')) {
              this.logger.warn(`Duplicate job offer detected: ${signal.title}`);
              continue;
            }
            if (error.message.includes('violates not-null constraint')) {
              this.logger.error(`Missing required fields for job offer: ${signal.title}`);
              continue;
            }
          }
          this.logger.error(`Failed to process job offer ${signal.title}: ${error.message}`);
          throw new HttpInternalException('Failed to process job offers');
        }
      }
    } catch (error) {
      this.logger.error(`Critical error in saveSignals: ${error.message}`);
      if (error instanceof HttpInternalException) {
        throw error;
      }
      throw new HttpInternalException('Failed to save job offers');
    }
  }

  async getSignals(
    title?: string,
    location?: string,
    minSalary?: number,
    maxSalary?: number,
    page: number = 1,
    limit: number = 10,
    sortBy?: string,
    sortDirection: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{ data: SignalEntity[]; total: number; page: number; limit: number }> {
    if (page < 1) {
      throw new HttpBadRequestException('Page number must be at least 1');
    }
    if (limit < 1 || limit > 100) {
      throw new HttpBadRequestException('Limit must be between 1 and 100');
    }
    if (minSalary && maxSalary && minSalary > maxSalary) {
      throw new HttpBadRequestException('Minimum salary cannot be greater than maximum salary');
    }

    const validSortFields = ['title', 'companyName', 'location', 'postedDate', 'salaryRange.min', 'salaryRange.max'];
    if (sortBy && !validSortFields.includes(sortBy)) {
      throw new HttpBadRequestException(`Invalid sort field. Must be one of: ${validSortFields.join(', ')}`);
    }

    const skip = (page - 1) * limit;
    const whereConditions: any = {};

    if (title) {
      whereConditions.title = Like(`%${title}%`);
    }
    if (location) {
      whereConditions.location = Like(`%${location}%`);
    }
    if (minSalary) {
      whereConditions.salaryRange = { min: minSalary };
    }
    if (maxSalary) {
      whereConditions.salaryRange = { max: maxSalary };
    }

    let order = {};
    if (sortBy) {
      if (sortBy.includes('salaryRange.')) {
        const [parent, field] = sortBy.split('.');
        order = { [parent]: { [field]: sortDirection } };
      } else {
        order = { [sortBy]: sortDirection };
      }
    } else {
      order = { postedDate: sortDirection };
    }

    try {
      const {data, total} = await this.signalRepository.findAndCount({
        where: whereConditions,
        skip,
        take: limit,
        order,
      });

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve job offers: ${error.message}`);
      if (error instanceof QueryFailedError) {
        if (error.message.includes('invalid input syntax')) {
          throw new HttpBadRequestException('Invalid search parameters');
        }
        if (error.message.includes('column "') && error.message.includes(' does not exist')) {
          throw new HttpBadRequestException('Invalid sort field');
        }
      }
      throw new HttpInternalException('Failed to retrieve job offers');
    }
  }
}