# Survey API Documentation

This document describes the survey response storage API endpoint and related functionality.

## Overview

The survey system allows community members to complete surveys (onboarding, annual, event feedback) and stores their responses in MongoDB. The system supports:

- Multiple survey types (onboarding, annual, event)
- Various question types (text, textarea, single-choice, multiple-choice, scale, boolean)
- Response validation
- Updating existing responses
- Server-side storage and retrieval

## API Endpoint

### POST `/api/survey-response`

Creates or updates a survey response for a member.

#### Request Format

**Method:** `POST`

**Content-Type:** `application/x-www-form-urlencoded` (via FormData)

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `surveyId` | string | Yes | MongoDB ObjectId of the survey |
| `supabaseUserId` | string | Yes | Supabase user ID of the member |
| `responses` | string | Yes | JSON stringified Record<string, SurveyAnswer> |
| `isComplete` | string | No | 'true' or 'false' (default: 'true') |

**SurveyAnswer Type:**

```typescript
type SurveyAnswer =
    | { type: 'text'; value: string }
    | { type: 'textarea'; value: string }
    | { type: 'single-choice'; value: string }
    | { type: 'multiple-choice'; value: string[] }
    | { type: 'scale'; value: number }
    | { type: 'boolean'; value: boolean };
```

#### Example Request (using FormData)

```javascript
const formData = new FormData();
formData.append('surveyId', '507f1f77bcf86cd799439011');
formData.append('supabaseUserId', 'user-123-abc');
formData.append('responses', JSON.stringify({
    'q1': { type: 'text', value: 'Software Engineer' },
    'q2': { type: 'single-choice', value: 'Python' },
    'q3': { type: 'multiple-choice', value: ['React', 'Node.js'] },
    'q4': { type: 'scale', value: 8 },
    'q5': { type: 'boolean', value: true }
}));
formData.append('isComplete', 'true');

const response = await fetch('/api/survey-response', {
    method: 'POST',
    body: formData
});
```

#### Success Response (201 - New Response)

```json
{
    "success": true,
    "message": "Survey response submitted successfully",
    "response": {
        "id": "507f1f77bcf86cd799439012",
        "surveyId": "507f1f77bcf86cd799439011",
        "memberId": "507f1f77bcf86cd799439010",
        "isComplete": true,
        "submittedAt": "2026-01-30T12:00:00.000Z"
    }
}
```

#### Success Response (200 - Updated Response)

```json
{
    "success": true,
    "message": "Survey response updated successfully",
    "response": {
        "id": "507f1f77bcf86cd799439012",
        "surveyId": "507f1f77bcf86cd799439011",
        "memberId": "507f1f77bcf86cd799439010",
        "isComplete": true,
        "submittedAt": "2026-01-30T12:30:00.000Z"
    }
}
```

#### Error Responses

**400 Bad Request - Missing Required Field:**
```json
{
    "error": "Survey ID is required"
}
```

**400 Bad Request - Invalid JSON:**
```json
{
    "error": "Invalid responses format"
}
```

**400 Bad Request - Missing Required Responses:**
```json
{
    "error": "Missing required responses",
    "missingQuestions": ["q1", "q3"]
}
```

**400 Bad Request - Survey Inactive:**
```json
{
    "error": "Survey is no longer accepting responses"
}
```

**401 Unauthorized:**
```json
{
    "error": "User authentication required"
}
```

**404 Not Found - Survey:**
```json
{
    "error": "Survey not found"
}
```

**404 Not Found - Profile:**
```json
{
    "error": "User profile not found"
}
```

**405 Method Not Allowed:**
```json
{
    "error": "Method not allowed"
}
```

**500 Internal Server Error:**
```json
{
    "error": "Failed to save survey response",
    "details": "Error message details"
}
```

## Survey Page Route

### GET `/dashboard/survey/:surveySlug`

Displays a survey form for the authenticated user to complete.

**Route Parameters:**
- `surveySlug`: URL-friendly slug of the survey (e.g., 'onboarding-2026')

**Query Parameters (Optional):**
- `supabaseUserId`: User ID for loading existing responses

**Features:**
- Loads survey by slug
- Checks if survey is active
- Loads existing responses if user has already completed the survey
- Allows updating previous responses
- Validates required fields before submission
- Redirects to dashboard on successful submission

## Components

### SurveyForm Component

React component that renders a survey form with validation.

**Props:**

```typescript
interface SurveyFormProps {
    survey: Survey;
    supabaseUserId: string;
    existingResponse?: SurveyResponse | null;
    onSubmit?: () => void;
}
```

**Features:**
- Renders different UI based on question type
- Client-side validation for required fields
- Auto-saves state during completion
- Posts to `/api/survey-response` on submission
- Displays existing responses for editing

**Usage:**

```tsx
import { SurveyForm } from '@/components/SurveyForm';

<SurveyForm
    survey={surveyData}
    supabaseUserId={user.id}
    existingResponse={existingResponse}
    onSubmit={handleSuccess}
/>
```

## Database Functions

### survey-responses.server.ts

Server-side functions for managing survey responses:

- `getSurveyResponses(surveyId)` - Get all responses for a survey
- `getSurveyResponseById(id)` - Get response by ID
- `getMemberSurveyResponse(surveyId, memberId)` - Get specific member response
- `getMemberSurveyResponses(memberId)` - Get all responses by a member
- `upsertSurveyResponse(data)` - Create or update response (used by API)
- `updateSurveyResponse(id, data)` - Update response
- `deleteSurveyResponse(id)` - Delete response
- `getCompletedSurveyResponsesWithProfiles(surveyId)` - Get responses with profile joins
- `getSurveyQuestionStats(surveyId, questionId)` - Get aggregate statistics
- `hasMemberCompletedSurvey(surveyId, memberId)` - Check completion status

### surveys.server.ts

Server-side functions for managing surveys:

- `getSurveys()` - Get all surveys
- `getActiveSurveysByType(type)` - Get active surveys by type
- `getSurveyById(id)` - Get survey by ID
- `getSurveyBySlug(slug)` - Get survey by slug (used by route)
- `getActiveOnboardingSurvey()` - Get active onboarding survey
- `createSurvey(data)` - Create new survey
- `updateSurvey(id, data)` - Update survey
- `deleteSurvey(id)` - Delete survey

## Validation

The API performs the following validations:

1. **Required fields**: Ensures surveyId, supabaseUserId, and responses are provided
2. **Survey existence**: Verifies the survey exists in the database
3. **Survey status**: Checks that the survey is active
4. **User profile**: Verifies the user has a valid profile
5. **JSON format**: Validates that responses can be parsed as JSON
6. **Required questions**: When `isComplete=true`, ensures all required questions are answered

## Security Considerations

- The API only allows authenticated users to submit responses
- User must have a valid profile in the system
- Survey must be active to accept responses
- Responses are validated against the survey schema
- Previous responses can only be updated by the same user who created them

## Integration with Onboarding

To integrate the survey into the onboarding flow:

1. Seed the onboarding survey: `pnpm tsx scripts/seed-survey.ts`
2. Add a link to the survey in the OnboardingChecklist component
3. Direct new users to `/dashboard/survey/onboarding-2026`
4. Track completion status in the Profile document

## Future Enhancements

- Admin dashboard for viewing aggregate responses
- Export survey data to CSV/JSON
- Survey analytics and visualizations
- Anonymous survey option
- Draft save functionality (auto-save to server)
- Email notifications for survey completion
