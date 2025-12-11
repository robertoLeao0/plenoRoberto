import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsInt, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNotEmpty()
  @IsString()
  organizationId: string; // <--- O CORRETO É ORGANIZATION ID

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  totalDays?: number = 21;
}