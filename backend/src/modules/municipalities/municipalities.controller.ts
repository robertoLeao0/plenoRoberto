import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { MunicipalitiesService } from './municipalities.service';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('municipalities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MunicipalitiesController {
  constructor(private readonly service: MunicipalitiesService) {}

  @Roles(Role.ADMIN_PLENO)
  @Post()
  create(@Body() dto: CreateMunicipalityDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(Role.ADMIN_PLENO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMunicipalityDto) {
    return this.service.update(id, dto);
  }
}
