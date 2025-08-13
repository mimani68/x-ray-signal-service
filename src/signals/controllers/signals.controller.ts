import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

import { SignalsService } from '../services/signals.service';
import { Signal } from '../schemas/signal.schema';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
    constructor(private readonly signalsService: SignalsService) { }

    @Get()
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page', example: 10 })
    @ApiQuery({ name: 'deviceId', required: false, type: String, description: 'Device ID filter' })
    @ApiQuery({ name: 'startTime', required: false, type: Number, description: 'Start time filter (timestamp)' })
    @ApiQuery({ name: 'endTime', required: false, type: Number, description: 'End time filter (timestamp)' })
    async getSignals(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
        @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
        @Query('deviceId') deviceId?: string,
        @Query('startTime', ParseIntPipe) startTime?: number,
        @Query('endTime', ParseIntPipe) endTime?: number,
    ): Promise<{ data: Signal[]; total: number; page: number; limit: number }> {
        return this.signalsService.getSignals(deviceId, startTime, endTime, page, limit);
    }
}