import { 
  IsBoolean, 
  IsDateString, 
  IsNotEmpty, 
  IsOptional, 
  IsInt, 
  IsString, 
  IsArray
} from 'class-validator';

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

  // === MUDANÇA AQUI ===
  @IsNotEmpty()
  @IsArray()                  
  @IsString({ each: true })
  organizationIds: string[];
  // ====================

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsInt()
  totalDays?: number = 21;
}