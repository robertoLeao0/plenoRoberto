import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MessageType, TargetAudience } from '../../../common/enums/message.enum';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(MessageType)
  type: MessageType;

  @IsDateString()
  sendDate: string;

  @IsEnum(TargetAudience)
  targetAudience: TargetAudience;

  @IsOptional()
  projectId?: string;

  @IsOptional()
  municipalityId?: string;
}
