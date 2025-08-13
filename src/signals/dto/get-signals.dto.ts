import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetSignalsDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Device ID filter' })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiPropertyOptional({ description: 'Start time filter (timestamp)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  startTime?: number;

  @ApiPropertyOptional({ description: 'End time filter (timestamp)' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  endTime?: number;
}