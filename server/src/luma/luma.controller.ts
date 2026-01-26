import { Controller, Post, Body, Param } from '@nestjs/common';
import { LumaService } from './luma.service';

@Controller('luma')
export class LumaController {
  constructor(private readonly lumaService: LumaService) {}

  @Post('sync/:eventId')
  async sync(@Param('eventId') eventId: string) {
    return this.lumaService.syncAttendance(eventId);
  }
}
