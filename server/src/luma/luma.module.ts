import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LumaService } from './luma.service';
import { LumaController } from './luma.controller';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [LumaService],
  controllers: [LumaController],
})
export class LumaModule {}
