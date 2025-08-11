import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

import { SignalsService } from '../services/signals.service';
import { SignalEntity } from '../entities/signal';
import { SortParams } from '../dto/sort';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
    constructor(private readonly signalsService: SignalsService) { }

    @Get()
    @ApiQuery({ name: 'title', required: false, type: String, description: 'Filter by job title' })
    @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location' })
    @ApiQuery({ name: 'minSalary', required: false, type: Number, description: 'Filter by minimum salary' })
    @ApiQuery({ name: 'maxSalary', required: false, type: Number, description: 'Filter by maximum salary' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
    @ApiQuery({
        name: 'sortBy',
        required: false,
        enum: ['title', 'companyName', 'location', 'postedDate', 'salaryRange.min', 'salaryRange.max'],
        description: 'Field to sort by'
    })
    @ApiQuery({
        name: 'sortDirection',
        required: false,
        enum: ['ASC', 'DESC'],
        description: 'Sort direction (ASC or DESC)',
        example: 'DESC'
    })
    async getSignals(
        @Query('title') title?: string,
        @Query('location') location?: string,
        @Query('minSalary') minSalary?: number,
        @Query('maxSalary') maxSalary?: number,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query() sortParams?: SortParams,
    ): Promise<{ data: SignalEntity[]; total: number; page: number; limit: number }> {
        return this.signalsService.getSignals(
            title,
            location,
            minSalary,
            maxSalary,
            page,
            limit,
            sortParams?.sortBy,
            sortParams?.sortDirection
        );
    }
}