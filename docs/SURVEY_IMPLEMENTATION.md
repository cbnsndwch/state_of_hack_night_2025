# Survey System Implementation Guide

This guide covers the complete implementation of the Member Survey System for Hello Miami.

---

## Overview

The survey system allows the community to collect structured feedback from members through:
- **Onboarding surveys** - Required for new members
- **Annual surveys** - Periodic feedback collection
- **Event surveys** - Post-event feedback

---

## Database Schema

### Collections

Two MongoDB collections are used:

1. **`surveys`** - Survey definitions and questions
2. **`survey_responses`** - Member responses to surveys

See `app/types/mongodb.ts` for full TypeScript type definitions.

### Indexes

Create these indexes for optimal performance:

```javascript
// surveys collection
db.surveys.createIndex({ slug: 1 }, { unique: true });
db.surveys.createIndex({ type: 1, isActive: 1 });

// survey_responses collection
db.survey_responses.createIndex(
    { surveyId: 1, memberId: 1 },
    { unique: true }
);
db.survey_responses.createIndex({ memberId: 1 });
db.survey_responses.createIndex({ isComplete: 1, submittedAt: 1 });
```

---

## Initial Setup

### 1. Seed the Onboarding Survey

Run the seed script to create the initial onboarding survey:

```bash
pnpm seed:survey
```

This creates the "onboarding-2026" survey with all questions defined in `docs/survey-schema.md`.

### 2. Verify Survey Creation

You can verify the survey was created by querying MongoDB:

```javascript
db.surveys.findOne({ slug: 'onboarding-2026' });
```

---

## Data Access Layer

All database operations are server-side only (`.server.ts` files).

### Survey Operations

Located in `app/lib/db/surveys.server.ts`:

```typescript
import {
    getSurveys,
    getSurveyById,
    getSurveyBySlug,
    getActiveOnboardingSurvey,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    getSurveysWithResponseCounts
} from '@/lib/db';

// Example: Get the active onboarding survey
const survey = await getActiveOnboardingSurvey();
```

### Survey Response Operations

Located in `app/lib/db/survey-responses.server.ts`:

```typescript
import {
    getSurveyResponses,
    getMemberSurveyResponse,
    upsertSurveyResponse,
    getSurveyQuestionStats,
    hasMemberCompletedSurvey
} from '@/lib/db';

// Example: Check if member completed onboarding survey
const completed = await hasMemberCompletedSurvey(surveyId, memberId);

// Example: Save member's response
await upsertSurveyResponse({
    surveyId: new ObjectId(surveyId),
    memberId: new ObjectId(memberId),
    responses: {
        experience_level: { type: 'single-choice', value: 'Professional software engineer' },
        primary_interests: {
            type: 'multiple-choice',
            value: ['Meeting other builders', 'Working on personal projects']
        }
    },
    isComplete: false
});
```

---

## Implementation Tasks

The following tasks need to be completed:

### Task 1: ✅ Design survey schema and questions
**Status:** Complete

### Task 2: Create survey component with form validation
**Location:** `app/components/survey-form.tsx`

**Requirements:**
- Render survey questions dynamically based on survey schema
- Support all question types:
  - `text` - Single-line text input
  - `textarea` - Multi-line text input
  - `single-choice` - Radio buttons
  - `multiple-choice` - Checkboxes
  - `scale` - Slider (1-10, etc.)
  - `boolean` - Yes/No toggle
- Form validation using `react-hook-form` + `zod`
- Show progress indicator (e.g., "3 of 11 questions answered")
- Auto-save draft responses
- "Submit" vs "Save Draft" options
- Responsive design (mobile-first)

**UI Components to use:**
- `@/components/ui/input`
- `@/components/ui/textarea`
- `@/components/ui/radio-group`
- `@/components/ui/checkbox`
- `@/components/ui/slider`
- `@/components/ui/switch`
- `@/components/ui/button`

### Task 3: Survey response storage API endpoint
**Location:** `app/routes/api/survey-response.ts`

**Requirements:**
- `POST /api/survey-response` - Save/update survey response
- Accept JSON payload:
  ```json
  {
    "surveyId": "...",
    "responses": { "question_id": { "type": "...", "value": ... } },
    "isComplete": true
  }
  ```
- Authenticate user (require login)
- Validate survey exists and is active
- Validate responses against survey schema
- Upsert response (update if exists, create if new)
- Sync relevant fields to profile:
  - `seeking_funding` → `Profile.seekingFunding`
  - `open_to_mentoring` → `Profile.openToMentoring`
  - `tech_stack` → `Profile.skills`
- Return success/error response

### Task 4: Admin dashboard for survey insights
**Location:** `app/routes/dashboard.admin.surveys.tsx`

**Requirements:**
- List all surveys with response counts
- View individual survey details
- View aggregate statistics per question
- Export responses as CSV/JSON
- Admin-only access (check `Profile.isAppAdmin`)
- Visualizations:
  - Bar charts for single/multiple choice questions
  - Word clouds for text/textarea responses
  - Distribution charts for scale questions

**UI Components to use:**
- `@/components/ui/table`
- `@/components/ui/card`
- `recharts` for visualizations
- `@/components/ui/tabs` for switching between surveys

### Task 5: Display aggregate survey data
**Location:** `app/routes/insights.tsx` (public page)

**Requirements:**
- Public page showing aggregate insights
- Display anonymized, summarized data:
  - Experience level distribution
  - Top interests
  - Most popular tech stacks
  - Requested workshop topics
- Do NOT show individual responses
- Update automatically as new responses come in
- Visually consistent with site design (neo-brutalism)
- Include context: "Based on 150 responses"

---

## Integration with Onboarding Flow

### Current Onboarding Flow

1. User signs in with GitHub OAuth
2. Profile is created or retrieved
3. User sees dashboard with onboarding checklist
4. Checklist prompts user to:
   - Complete profile
   - Link Luma Attendee ID
   - **[NEW]** Complete onboarding survey

### Survey Integration Points

**Dashboard route** (`app/routes/dashboard.tsx` loader):
```typescript
// Check if user needs to complete onboarding survey
const onboardingSurvey = await getActiveOnboardingSurvey();
const hasCompletedSurvey = onboardingSurvey
    ? await hasMemberCompletedSurvey(
          onboardingSurvey._id.toString(),
          profile._id.toString()
      )
    : true;

// Pass to component
return json({
    profile,
    needsSurvey: !hasCompletedSurvey,
    surveyId: onboardingSurvey?._id.toString()
});
```

**Dashboard component:**
```tsx
{needsSurvey && (
    <Card>
        <CardHeader>
            <CardTitle>Complete Your Profile Survey</CardTitle>
            <CardDescription>
                Help us understand your interests and goals (2-3 minutes)
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button asChild>
                <Link to="/survey/onboarding">Take Survey</Link>
            </Button>
        </CardContent>
    </Card>
)}
```

---

## Survey Routes

Suggested route structure:

```
/survey/:slug          → Survey form page (authenticated)
/survey/:slug/success  → Thank you page after submission
/api/survey-response   → API endpoint for saving responses
/insights              → Public aggregate insights page
/dashboard/surveys     → Admin survey management (admin-only)
```

---

## Validation with Zod

Example schema for validating survey responses:

```typescript
import { z } from 'zod';

const surveyAnswerSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('text'), value: z.string().min(1) }),
    z.object({ type: z.literal('textarea'), value: z.string().min(1) }),
    z.object({ type: z.literal('single-choice'), value: z.string().min(1) }),
    z.object({
        type: z.literal('multiple-choice'),
        value: z.array(z.string()).min(1)
    }),
    z.object({ type: z.literal('scale'), value: z.number().int().min(1).max(10) }),
    z.object({ type: z.literal('boolean'), value: z.boolean() })
]);

const surveyResponseSchema = z.object({
    surveyId: z.string(),
    responses: z.record(z.string(), surveyAnswerSchema),
    isComplete: z.boolean()
});
```

---

## Analytics Queries

### Most Popular Tech Stacks

```typescript
const stats = await getSurveyQuestionStats(surveyId, 'tech_stack');
// Returns: { totalResponses: 150, answerCounts: { "Python": 102, "JavaScript/TypeScript": 123, ... } }

// Sort by popularity
const sorted = Object.entries(stats.answerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
```

### Experience Level Distribution

```typescript
const stats = await getSurveyQuestionStats(surveyId, 'experience_level');
// Calculate percentages
const total = stats.totalResponses;
const distribution = Object.entries(stats.answerCounts).map(([level, count]) => ({
    level,
    count,
    percentage: Math.round((count / total) * 100)
}));
```

---

## Privacy & Security

### Data Access Control

1. **Survey Responses**
   - Members can only view/edit their own responses
   - Admins can view all responses
   - Public pages show only aggregated data

2. **Personally Identifiable Information**
   - Do not display member emails on public insights page
   - Text/textarea responses are admin-only
   - Only display choice/scale question aggregates publicly

3. **API Authentication**
   - All survey response endpoints require authentication
   - Validate `supabaseUserId` matches authenticated user
   - Admin-only endpoints check `Profile.isAppAdmin`

---

## Testing Checklist

- [ ] Survey seed script runs successfully
- [ ] Survey form renders all question types correctly
- [ ] Form validation works (required fields, input types)
- [ ] Auto-save drafts functionality
- [ ] Submit survey completes successfully
- [ ] Profile fields sync correctly (`seekingFunding`, `openToMentoring`, `skills`)
- [ ] Admin can view all responses
- [ ] Aggregate insights page displays correctly
- [ ] Mobile responsive design
- [ ] Non-admin users cannot access admin routes
- [ ] Users can only edit their own survey responses

---

## Future Enhancements

1. **Conditional Logic**
   - Show/hide questions based on previous answers
   - Example: If "seeking funding" = true, ask "What stage is your startup?"

2. **Survey Versioning**
   - Track changes to survey questions over time
   - Allow comparing responses across versions

3. **Periodic Surveys**
   - Quarterly or annual surveys
   - Track sentiment changes over time

4. **Badges & Incentives**
   - Award "Survey Contributor" badge
   - Highlight insights from survey in newsletters

5. **Reminders**
   - Email/SMS reminders for incomplete surveys
   - Gentle prompts in dashboard

6. **A/B Testing**
   - Test different question wordings
   - Optimize for response rate

---

## Reference Documentation

- **Survey Schema:** `docs/survey-schema.md`
- **PRD:** `docs/PRD.md` (Section 1.2)
- **TypeScript Types:** `app/types/mongodb.ts`
- **Database Layer:** `app/lib/db/surveys.server.ts`, `app/lib/db/survey-responses.server.ts`
- **Seed Script:** `scripts/seed-survey.ts`

---

*This implementation aligns with Hello Miami's "no-ego" culture by focusing on community feedback, transparency, and member-driven improvements.*
