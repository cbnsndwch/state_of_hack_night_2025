# Profile Completion Flow

## Overview

The profile completion flow allows Hello Miami community members to enhance their profiles with additional information beyond the basic authentication data from GitHub OAuth.

## Features

### Profile Fields

Members can now add the following information to their profiles:

**Basic Information**
- **Bio** - A description of who they are, what they're building, or what they're interested in learning
- **Role/Occupation** - Their current professional role (e.g., "Software Engineer", "Founder", "Designer")

**Skills & Technologies**
- **Skills** - A comma-separated list of technologies and areas of expertise (e.g., "Python, React, Hardware, CAD design")

**Social Links**
- **GitHub Username** - For showcasing their open-source work
- **Twitter/X Handle** - For social connections
- **Website/Portfolio** - Personal website or portfolio URL

**Luma Integration**
- **Luma Attendee ID** - Links their profile to Luma for automated check-ins and attendance tracking (format: `att-xxxxxxxxxxxxx`)

**Community Preferences**
- **Seeking Funding** - Indicates if they're looking for funding for their projects (visible to investors/VCs)
- **Open to Mentoring** - Shows willingness to help and mentor other community members

## User Flow

1. **Access Profile Edit**
   - From the dashboard, click "Edit Profile" in the onboarding checklist
   - Or navigate directly to `/dashboard/profile`

2. **Fill Out Profile**
   - All fields are optional
   - Email (from Luma) is read-only and cannot be changed
   - Skills should be entered as comma-separated values

3. **Save Changes**
   - Click "save_profile" to update
   - Success message appears and redirects to dashboard after 1.5 seconds
   - Or click "cancel" to return to dashboard without saving

## Onboarding Integration

The profile completion is part of the onboarding checklist. The "Complete your profile" task is marked as completed when:
- Bio is filled in AND
- Luma Attendee ID is linked

This encourages members to complete both essential pieces of information for full community integration.

## Technical Implementation

### Database Schema

New fields added to the `Profile` collection in MongoDB:

```typescript
{
  skills: string[];           // Default: []
  githubUsername: string | null;
  twitterHandle: string | null;
  websiteUrl: string | null;
  role: string | null;
  seekingFunding: boolean;    // Default: false
  openToMentoring: boolean;   // Default: false
}
```

### API Endpoints

- **GET** `/api/profile?supabaseUserId={id}` - Fetches current profile data
- **POST** `/api/profile-update` - Updates profile with new data

### Migration

Run the migration script to update existing profiles:

```bash
tsx scripts/migrate-profiles.ts
```

This adds the new fields with default values to all existing profiles.

## Future Enhancements

As outlined in the PRD (Phase 3.3), future enhancements may include:

- Badge display for skills and achievements
- "Can help with" tags for mentorship matching
- Founder-investor matchmaking based on seekingFunding flag
- Public profile pages with SEO optimization
- Profile completeness score/progress indicator
