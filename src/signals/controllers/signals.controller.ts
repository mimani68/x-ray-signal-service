import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

import { SignalsService } from '../services/signals.service';
import { Signal } from '../schemas/signal.schema';
import { GetSignalsDto } from '../dto/get-signals.dto';

@ApiTags('signals')
@Controller('signals')
export class SignalsController {
    constructor(private readonly signalsService: SignalsService) { }

    @Get()
    async getSignals(
        @Query(new ValidationPipe({ transform: true })) query: GetSignalsDto,
    ): Promise<{ data: Signal[]; total: number; page: number; limit: number }> {
        const { page = 1, limit = 10, deviceId, startTime, endTime } = query;
        return this.signalsService.getSignals(deviceId, startTime, endTime, page, limit);
    }
}