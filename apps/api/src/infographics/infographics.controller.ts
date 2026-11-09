import {
  Controller, Get, Post, Body, Param, Patch, Put, Delete,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InfographicsService } from './infographics.service';
import { CreateInfographicDto } from './dto/create-infographic.dto';
import type { AutomationWorkflow } from '@infograph-ai/shared';

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

  @Get(':id/workflow')
  @ApiOperation({ summary: 'Get the generated automation workflow' })
  getWorkflow(@Request() req, @Param('id') id: string) {
    return this.infographicsService.getWorkflow(req.user.id, id);
  }

  @Put(':id/workflow')
  @ApiOperation({ summary: 'Save an edited automation workflow' })
  updateWorkflow(@Request() req, @Param('id') id: string, @Body() workflow: AutomationWorkflow) {
    return this.infographicsService.updateWorkflow(req.user.id, id, workflow);
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
