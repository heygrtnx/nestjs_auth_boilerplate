import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtGuard, RolesGuard, Roles } from 'src/utils';
import { Role } from '@prisma/client';

@ApiTags('Server')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'ping server' })
  @Get()
  runapp() {
    return this.appService.runapp();
  }

  @ApiOperation({ summary: 'view all log files' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth('Authorization')
  @Get('logs')
  getLogFiles() {
    return this.appService.getLogFiles();
  }

  @ApiOperation({ summary: 'get logs from a specific file' })
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth('Authorization')
  @Get('logs/:filename')
  getLogFileContent(@Param('filename') filename: string) {
    return this.appService.getLogFileContent(filename);
  }

  @Delete('logs/:filename')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'delete a specific log file' })
  deleteLogFile(@Param('filename') filename: string) {
    return this.appService.deleteLogFile(filename);
  }

  @Delete('logs')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @ApiBearerAuth('Authorization')
  @ApiOperation({ summary: 'delete all logs' })
  deleteAllLogFiles() {
    return this.appService.deleteAllLogFiles();
  }
}
