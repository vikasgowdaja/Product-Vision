import {
  Controller, Get, Post, Body, Param, Patch, Delete,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InfographicsService } from './infographics.service';
import { CreateInfographicDto } from './dto/create-infographic.dto';

@ApiTags('Infographics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('infographics')
export class InfographicsController {
  constructor(private readonly infographicsService: InfographicsService) {}

  /** Start the 6-agent pipeline for a new infographic */
  @Post()
  @ApiOperation({ summary: 'Generate a new infographic (triggers agent pipeline)' })
  create(@Request() req, @Body() dto: CreateInfographicDto) {
    return this.infographicsService.create(req.user.id, dto);
  }

  /** List all infographics for the authenticated user */
  @Get()
  @ApiOperation({ summary: 'List my infographics' })
  findAll(@Request() req) {
    return this.infographicsService.findAllByUser(req.user.id);
  }

  /** Get a single infographic with agent trace */
  @Get(':id')
  @ApiOperation({ summary: 'Get infographic details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.infographicsService.findOne(req.user.id, id);
  }

  /** Schedule (or re-schedule) publishing */
  @Patch(':id/schedule')
  @ApiOperation({ summary: 'Schedule LinkedIn publishing' })
  schedule(
    @Request() req,
    @Param('id') id: string,
    @Body('scheduledAt') scheduledAt: string,
  ) {
    return this.infographicsService.schedule(req.user.id, id, new Date(scheduledAt));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req, @Param('id') id: string) {
    return this.infographicsService.remove(req.user.id, id);
  }
}
