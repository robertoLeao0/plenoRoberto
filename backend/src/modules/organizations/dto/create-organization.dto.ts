import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty({ message: 'O nome da organização é obrigatório' })
  name: string;

  @IsString()
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(OrganizationType)
  @IsOptional()
  type?: OrganizationType;

  // ID do Gestor (Opcional, pois pode ser adicionado depois)
  @IsOptional()
  @IsUUID()
  managerId?: string;
}