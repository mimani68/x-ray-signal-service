import { IsIn, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SortParams {
    @IsOptional()
    @IsIn(['title', 'companyName', 'location', 'postedDate', 'salaryRange.min', 'salaryRange.max'], {
        message: 'Invalid sort field. Must be one of: title, companyName, location, postedDate, salaryRange.min, salaryRange.max'
    })
    @Transform(({ value }) => value?.trim())
    sortBy?: string;

    @IsOptional()
    @IsIn(['ASC', 'DESC'], {
        message: 'Invalid sort direction. Must be either ASC or DESC'
    })
    @Transform(({ value }) => value?.toUpperCase())
    sortDirection?: 'ASC' | 'DESC';
}