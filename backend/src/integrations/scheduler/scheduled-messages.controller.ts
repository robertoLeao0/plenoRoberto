import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ScheduledMessagesService } from './scheduled-messages.service';
// Ajuste os caminhos dos Guards conforme sua estrutura
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';

@Controller('scheduled-messages') // Rota base: /scheduled-messages
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduledMessagesController {
  constructor(private readonly service: ScheduledMessagesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async list(@Query('projectId') projectId?: string) {
    return this.service.list(projectId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  async get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() body: any) {
    // O body deve vir do front com title, body, scheduledAt, etc.
    return this.service.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}