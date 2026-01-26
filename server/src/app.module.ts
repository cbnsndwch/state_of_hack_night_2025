import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LumaModule } from './luma/luma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), LumaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
