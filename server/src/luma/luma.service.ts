import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class LumaService {
  private readonly logger = new Logger(LumaService.name);
  private supabase;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.supabase = createClient(
      this.configService.get<string>('SUPABASE_URL') || '',
      this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY') || '',
    );
  }

  async syncAttendance(eventId: string) {
    this.logger.log(`Starting sync for event: ${eventId}`);

    try {
      const mockGuests = [
        {
          email: 'builder1@example.com',
          name: 'Builder One',
          did_attend: true,
        },
        {
          email: 'builder2@example.com',
          name: 'Builder Two',
          did_attend: false,
        },
      ];

      for (const guest of mockGuests) {
        if (guest.did_attend) {
          await this.updateAttendanceRecord(guest.email, eventId);
        }
      }

      return { status: 'success', synced: mockGuests.length };
    } catch (error) {
      this.logger.error(`Failed to sync event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  private async updateAttendanceRecord(email: string, eventId: string) {
    const { data: user } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (user) {
      await this.supabase.from('attendance').upsert(
        {
          profile_id: user.id,
          event_id: eventId,
          attended_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,event_id' },
      );
    }
  }
}
