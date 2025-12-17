import { 
  IsNotEmpty, 
  IsString, 
  IsDateString, 
  IsOptional, 
  IsArray, 
  IsBoolean 
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  projectId: string;

  // Valida um array de IDs para múltiplas organizações
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  organizationIds: string[];

  @IsNotEmpty()
  @IsDateString()
  startAt: string; // Data de início (Liberação)

  @IsNotEmpty()
  @IsDateString()
  endAt: string;   // Data de fim (Bloqueio)

  @IsOptional()
  @IsBoolean()
  requireMedia?: boolean;
}