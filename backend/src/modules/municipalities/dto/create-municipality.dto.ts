import { IsBoolean, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMunicipalityDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  state: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean = true;
}
