export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    github_uid: string | null;
                    luma_attendee_id: string | null;
                    bio: string | null;
                    streak_count: number;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    github_uid?: string | null;
                    luma_attendee_id?: string | null;
                    bio?: string | null;
                    streak_count?: number;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    github_uid?: string | null;
                    luma_attendee_id?: string | null;
                    bio?: string | null;
                    streak_count?: number;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'profiles_id_fkey';
                        columns: ['id'];
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    }
                ];
            };
            projects: {
                Row: {
                    created_at: string;
                    description: string | null;
                    github_url: string | null;
                    id: string;
                    image_urls: string[] | null;
                    member_id: string;
                    public_url: string | null;
                    tags: string[] | null;
                    title: string;
                };
                Insert: {
                    created_at?: string;
                    description?: string | null;
                    github_url?: string | null;
                    id?: string;
                    image_urls?: string[] | null;
                    member_id: string;
                    public_url?: string | null;
                    tags?: string[] | null;
                    title: string;
                };
                Update: {
                    created_at?: string;
                    description?: string | null;
                    github_url?: string | null;
                    id?: string;
                    image_urls?: string[] | null;
                    member_id?: string;
                    public_url?: string | null;
                    tags?: string[] | null;
                    title?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'projects_member_id_fkey';
                        columns: ['member_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    }
                ];
            };
            badges: {
                Row: {
                    id: string;
                    name: string;
                    icon_ascii: string;
                    criteria: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    icon_ascii: string;
                    criteria: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    icon_ascii?: string;
                    criteria?: string;
                    created_at?: string;
                };
                Relationships: [];
            };
            member_badges: {
                Row: {
                    member_id: string;
                    badge_id: string;
                    awarded_at: string;
                };
                Insert: {
                    member_id: string;
                    badge_id: string;
                    awarded_at?: string;
                };
                Update: {
                    member_id?: string;
                    badge_id?: string;
                    awarded_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'member_badges_badge_id_fkey';
                        columns: ['badge_id'];
                        referencedRelation: 'badges';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'member_badges_member_id_fkey';
                        columns: ['member_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    }
                ];
            };
            attendance: {
                Row: {
                    id: string;
                    member_id: string;
                    luma_event_id: string;
                    status: 'registered' | 'checked-in';
                    checked_in_at: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    member_id: string;
                    luma_event_id: string;
                    status: 'registered' | 'checked-in';
                    checked_in_at?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    member_id?: string;
                    luma_event_id?: string;
                    status?: 'registered' | 'checked-in';
                    checked_in_at?: string | null;
                    created_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'attendance_member_id_fkey';
                        columns: ['member_id'];
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    }
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}
