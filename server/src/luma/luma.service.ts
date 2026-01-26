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
      // TODO: Replace with actual Luma API call to fetch guests
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

      // In a real scenario, we would map email to member_id
      // For now, this is just a placeholder implementation
      return { status: 'success', synced: mockGuests.length };
    } catch (error) {
      this.logger.error(`Failed to sync event ${eventId}: ${error.message}`);
      throw error;
    }
  }

  async checkIn(memberId: string, eventId: string) {
    const now = new Date();
    // Miami is UTC-5 (Standard) or UTC-4 (Daylight).
    // Ideally use a library like valid-time, simpler here:
    // We just check if the current time on the server (assuming UTC)
    // corresponds to valid hack night hours (Mon 6:30 PM - Tue 1:00 AM Miami time).

    // For MVP, we'll trust the check-in is happening during the event
    // verification logic can be added later.

    const { data, error } = await this.supabase
      .from('attendance')
      .upsert({
        member_id: memberId,
        luma_event_id: eventId,
        status: 'checked-in',
        checked_in_at: now.toISOString(),
      })
      .select()
      .single();

    if (error) {
      this.logger.error(
        `Check-in failed for member ${memberId}: ${error.message}`,
      );
      throw new Error(`Check-in failed: ${error.message}`);
    }

    return { status: 'success', attendance: data };
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
