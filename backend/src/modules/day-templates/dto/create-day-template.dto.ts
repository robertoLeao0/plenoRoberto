import { IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Category } from '../../../common/enums/category.enum';

export class CreateDayTemplateDto {
  @IsNumber()
  dayNumber: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(Category)
  category: Category;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsBoolean()
  @IsOptional()
  requiresPhoto?: boolean;
}
