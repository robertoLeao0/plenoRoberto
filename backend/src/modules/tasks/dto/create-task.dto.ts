import {
  IsNotEmpty,
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  IsBoolean
} from 'class-validator';

export class CreateTaskDto {
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty({ message: 'O ID do projeto é obrigatório' })
  @IsString()
  projectId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Valida cada item do array como string
  organizationIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // Permite o campo 'checklist' enviado pelo front
  checklist?: string[];

  @IsNotEmpty({ message: 'A data de início é obrigatória' })
  @IsDateString()
  startAt: string;

  @IsNotEmpty({ message: 'A data de fim é obrigatória' })
  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsBoolean()
  requireMedia?: boolean;
}