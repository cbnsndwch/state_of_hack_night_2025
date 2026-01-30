# Admin Survey Insights

## Overview

The admin survey insights feature provides a dashboard for app administrators to view aggregate survey data and analyze member responses. This helps organizers understand community preferences, trends, and engagement patterns.

## Access Control

- Only users with `isAppAdmin: true` in their profile can access the admin survey insights
- Admin emails are configured via the `APP_ADMIN_EMAILS` environment variable
- Non-admin users attempting to access `/admin/surveys` will see an "Access denied" message

## Features

### Survey List Page (`/admin/surveys`)

The main dashboard displays all surveys with:
- Survey title and description
- Survey type (onboarding, annual, event)
- Active/inactive status
- Total number of questions
- Total number of responses
- Link to detailed insights (disabled if no responses)

### Survey Detail Page (`/admin/surveys/:surveyId`)

For each survey, view detailed statistics:

#### Question-by-Question Breakdown
- Question text and type
- Required vs. optional indicator
- Total responses received
- Help text (if provided)

#### Answer Distribution
For each question, see:
- All unique answers with counts
- Percentage of total responses
- Visual bar charts showing relative popularity
- Answers sorted by frequency (most common first)

#### Supported Question Types

1. **Single Choice** - Shows distribution of selected options
2. **Multiple Choice** - Shows frequency of each option (users can select multiple)
3. **Text/Textarea** - Shows all unique text responses with counts
4. **Boolean** - Shows true/false distribution
5. **Scale** - Shows distribution across the numeric scale

## Usage

### For Admins

1. **Access the Dashboard**
   - Log in to the member portal
   - Navigate to `/dashboard`
   - Click "survey insights" in the Admin Panel card (visible only to admins)

2. **View All Surveys**
   - See all surveys created in the system
   - Identify which surveys have responses
   - Click "View Insights" to see detailed statistics

3. **Analyze Survey Results**
   - Review question-by-question statistics
   - Identify popular responses and trends
   - Use insights to inform community decisions

### Integration with Dashboard

The admin panel card appears automatically on the dashboard for users with admin privileges:

```typescript
{profile?.isAppAdmin && (
    <NeoCard variant="yellow">
        <h3>admin_panel</h3>
        <p>View survey insights and manage community data.</p>
        <a href={`/admin/surveys?userId=${user.id}`}>
            survey insights
        </a>
    </NeoCard>
)}
```

## Technical Details

### Routes

- `GET /admin/surveys` - List all surveys with response counts
- `GET /admin/surveys/:surveyId` - Detailed insights for a specific survey

### Server Functions Used

From `app/lib/db/surveys.server.ts`:
- `getSurveysWithResponseCounts()` - Fetches all surveys with aggregated response counts

From `app/lib/db/survey-responses.server.ts`:
- `getCompletedSurveyResponsesWithProfiles()` - Gets all completed responses for a survey
- `getSurveyQuestionStats()` - Aggregates answer counts for a specific question

### Data Serialization

MongoDB ObjectIds and Dates are serialized to strings for JSON transmission:

```typescript
{
    _id: survey._id.toString(),
    createdAt: survey.createdAt.toISOString(),
    updatedAt: survey.updatedAt.toISOString()
}
```

### Authentication Flow

1. User ID passed via query parameter: `?userId=${user.id}`
2. Server loader fetches profile by Supabase user ID
3. Checks `profile.isAppAdmin` flag
4. Returns 403 error if not an admin
5. Client-side also checks auth state for UI rendering

## Privacy & Security

- Individual survey responses are **not** displayed to protect member privacy
- Only aggregate statistics are shown (counts, percentages)
- Text responses show unique answers with frequency counts
- Personal identifiable information (PII) is not exposed in the admin interface

## Future Enhancements

Potential improvements for the admin insights feature:

1. **Export Functionality**
   - Export survey results to CSV/JSON
   - Generate PDF reports

2. **Time-Series Analysis**
   - Track response trends over time
   - Compare surveys across different periods

3. **Advanced Filtering**
   - Filter responses by date range
   - Segment by member attributes (e.g., experience level)

4. **Survey Management**
   - Create/edit surveys via admin UI (currently requires seed scripts)
   - Toggle survey active/inactive status
   - Preview surveys before publishing

5. **Response Management**
   - View individual responses (with proper access controls)
   - Flag/moderate inappropriate responses

## Related Documentation

- [Survey Schema](./survey-schema.md) - Complete survey system specification
- [PRD](./PRD.md) - Product requirements for member survey system (section 1.2)
- [AGENTS.md](../AGENTS.md) - Project architecture and conventions

## Support

For questions or issues with the admin survey insights:
1. Check the console for error messages
2. Verify admin email is configured in `APP_ADMIN_EMAILS` environment variable
3. Ensure profile has `isAppAdmin: true` in MongoDB
4. Review server logs for authentication/authorization errors
