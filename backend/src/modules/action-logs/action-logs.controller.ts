import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ActionLogsService } from './action-logs.service';
import { CompleteActionDto } from './dto/complete-action.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('projects/:projectId')
@UseGuards(JwtAuthGuard)
export class ActionLogsController {
  constructor(private readonly service: ActionLogsService) {}

  @Post('days/:dayNumber/complete')
  complete(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('dayNumber') dayNumber: string,
    @Body() dto: CompleteActionDto,
  ) {
    return this.service.completeDay(user.id, projectId, Number(dayNumber), dto);
  }

  @Get('my-progress')
  myProgress(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.service.myProgress(user.id, projectId);
  }
}
