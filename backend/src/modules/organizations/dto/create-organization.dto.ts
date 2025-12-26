import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
// IMPORTANTE: Certifique-se de que OrganizationType existe no seu schema.prisma
// Se não existir, remova essa importação e o @IsEnum abaixo.
import { OrganizationType } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString({ message: 'O nome deve ser um texto.' })
  @IsNotEmpty({ message: 'O nome da organização é obrigatório.' })
  name: string;

  @IsString({ message: 'O CNPJ deve ser um texto.' })
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  description?: string;
  
  @IsString()
  @IsOptional()
  location?: string;

  // Valida se o tipo enviado é um dos valores permitidos no Enum do Prisma
  @IsEnum(OrganizationType, { message: 'Tipo de organização inválido.' })
  @IsOptional()
  type?: OrganizationType;

  // ID do Gestor (Opcional na criação)
  @IsUUID('4', { message: 'O ID do gestor deve ser um UUID válido.' })
  @IsOptional()
  managerId?: string;
}