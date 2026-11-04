import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const NICHES = [
  'AI Agents',
  'System Design',
  'Software Architecture',
  'Salesforce',
  'Cloud (AWS/Azure)',
  'Full Stack Dev',
  'DevOps',
  'Career Growth',
  'Tech Leadership',
] as const;

export type Niche = (typeof NICHES)[number];

export class CreateInfographicDto {
  @ApiProperty({ enum: NICHES })
  @IsEnum(NICHES)
  niche: Niche;

  @ApiPropertyOptional({ description: 'Leave blank to auto-detect from trends' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;
}
