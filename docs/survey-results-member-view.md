# Survey Results - Member View

## Overview

Members can now view aggregate survey results after completing a survey. This feature provides transparency and allows members to see how their responses compare to the broader community.

## Features

### 1. Access Control

- **Requirement**: Members must complete a survey before viewing its aggregate results
- **Privacy**: Individual responses are never shown - only aggregate statistics
- **Authentication**: Members must be logged in to view results

### 2. Results Display

After completing a survey, members can:

- View community-wide statistics for each question
- See response counts and percentages for each answer option
- Compare their answers to community trends (implicitly, by viewing aggregates)

### 3. User Flow

1. **Complete Survey** → Member fills out survey at `/dashboard/survey/:surveySlug`
2. **Automatic Redirect** → After submission, member is redirected to `/dashboard/survey/:surveySlug/results`
3. **View Results** → Member sees aggregate data for all questions
4. **Dashboard Link** → Completed surveys appear on dashboard with "view_results" button

## Routes

### Survey Results Page

**Route**: `/dashboard/survey/:surveySlug/results`

**Query Parameters**:
- `supabaseUserId` (required) - User authentication identifier

**Access Control**:
- User must be authenticated
- User must have completed the survey
- Returns 403 error if survey not completed

### Dashboard Integration

**Route**: `/dashboard`

**New Section**: `survey_insights`
- Lists all completed surveys
- Shows survey title, description, and completion date
- Provides direct link to view results for each survey

## API Endpoints

### Profile API (Enhanced)

**Endpoint**: `GET /api/profile?supabaseUserId={id}`

**New Response Fields**:
```typescript
{
  profile: { ... },
  projectCount: number,
  completedSurveys: [
    {
      id: string,
      surveyId: string,
      surveySlug: string,
      surveyTitle: string,
      surveyDescription: string,
      submittedAt: string
    }
  ]
}
```

## Database Functions

### New Function: `getMemberCompletedSurveysWithDetails`

**Location**: `app/lib/db/survey-responses.server.ts`

**Purpose**: Fetch a member's completed surveys with survey metadata using MongoDB aggregation

**Returns**:
```typescript
Array<{
  _id: ObjectId;
  surveyId: ObjectId;
  surveySlug: string;
  surveyTitle: string;
  surveyDescription: string;
  submittedAt: Date;
}>
```

**Usage**:
```typescript
const surveys = await getMemberCompletedSurveysWithDetails(memberId);
```

## UI Components

### Survey Results Page

**File**: `app/routes/dashboard.survey.$surveySlug.results.tsx`

**Features**:
- Header with survey metadata and response count
- Info banner explaining privacy (aggregate data only)
- Question-by-question breakdown with bar charts
- Filters out free-form text questions (text/textarea types)
- Sorted by popularity (most common answers first)
- Links to dashboard and survey update

### Dashboard Survey Section

**File**: `app/routes/dashboard.tsx` (enhanced)

**Features**:
- Grid layout displaying completed surveys
- Survey cards with title, description, completion date
- Action button to view results for each survey
- Only shows if member has completed surveys

## Question Types Supported

The results page displays aggregate data for:

- ✅ **single-choice** - Shows distribution of selected options
- ✅ **multiple-choice** - Shows count for each selected option
- ✅ **boolean** - Shows true/false distribution
- ✅ **scale** - Shows distribution across scale values
- ❌ **text** - Hidden (free-form responses not aggregated)
- ❌ **textarea** - Hidden (free-form responses not aggregated)

## Privacy Considerations

### What Members See
- Total number of community responses
- Percentage breakdown for each answer option
- Response counts for each option

### What Members Don't See
- Individual member responses
- Member names or identifiers
- Free-form text answers from other members
- Their own previous responses (can view by retaking survey)

## Future Enhancements

Potential improvements for future iterations:

1. **Personal Comparison**: Show member's answer alongside community aggregate
2. **Trend Analysis**: Display how responses change over time
3. **Filtering**: Allow viewing results by demographics (experience level, location, etc.)
4. **Export**: Let members download aggregate data as CSV/JSON
5. **Comments**: Add discussion threads for each question
6. **Notifications**: Alert members when new aggregate insights are available

## Example Usage

### Member completes onboarding survey:

1. Navigate to `/dashboard/survey/onboarding-2026`
2. Fill out all required fields
3. Submit survey
4. Automatically redirected to `/dashboard/survey/onboarding-2026/results`
5. View community insights (e.g., "62% of members are Software Engineers")
6. Return to dashboard
7. See "onboarding-2026" listed under `survey_insights` section
8. Click "view_results" anytime to revisit aggregate data

## Testing Checklist

- [ ] Member can view results after completing survey
- [ ] Member cannot view results without completing survey
- [ ] Aggregate statistics are accurate
- [ ] Text/textarea questions are hidden
- [ ] Response percentages sum to 100% (accounting for multiple-choice)
- [ ] Dashboard shows completed surveys
- [ ] "view_results" button links to correct survey
- [ ] Access control prevents unauthenticated access
- [ ] Build completes without errors
- [ ] No LSP/TypeScript errors

## Technical Implementation

### Data Flow

```
1. Member completes survey
   ↓
2. Survey response stored in MongoDB (survey_responses collection)
   ↓
3. Loader checks if member completed survey
   ↓
4. If yes: Fetch aggregate stats using getSurveyQuestionStats()
   ↓
5. Render results page with bar charts
   ↓
6. Member can revisit results via dashboard link
```

### Aggregation Pipeline

The `getMemberCompletedSurveysWithDetails` function uses MongoDB's aggregation framework:

```typescript
db.collection('survey_responses')
  .aggregate([
    { $match: { memberId, isComplete: true } },
    { $lookup: { from: 'surveys', ... } },
    { $unwind: '$survey' },
    { $project: { surveySlug, surveyTitle, ... } },
    { $sort: { submittedAt: -1 } }
  ])
```

This efficiently joins survey responses with survey metadata in a single query.

## Conclusion

The aggregate survey results feature enhances transparency and engagement by allowing members to see community-wide trends while maintaining individual privacy. This aligns with Hello Miami's values of collaboration and openness.
