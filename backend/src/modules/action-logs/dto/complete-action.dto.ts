import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class CompleteActionDto {
  @IsOptional()
  @MaxLength(500)
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;
}
