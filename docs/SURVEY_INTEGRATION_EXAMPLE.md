# Survey Integration Examples

This document provides practical examples for integrating the survey system into the Hello Miami community platform.

## Example 1: Adding Survey Link to Onboarding Checklist

Update the `OnboardingChecklist` component to include a survey completion step:

```tsx
// app/components/onboarding/OnboardingChecklist.tsx

const onboardingItems = [
    {
        id: 'complete-survey',
        label: 'Complete community survey',
        description: 'Help us understand your interests and goals',
        completed: userHasCompletedSurvey, // Check via API
        action: {
            label: 'Take Survey',
            href: '/dashboard/survey/onboarding-2026'
        }
    },
    {
        id: 'profile-complete',
        label: 'Complete your profile',
        description: 'Add a bio and link your Luma Attendee ID',
        completed: !!(profile?.bio && profile?.lumaAttendeeId),
        action: {
            label: 'Edit Profile',
            href: '/dashboard/profile'
        }
    },
    // ... other items
];
```

## Example 2: Checking Survey Completion Status

In your dashboard loader, check if the user has completed the onboarding survey:

```tsx
// app/routes/dashboard.tsx

import { getActiveOnboardingSurvey } from '@/lib/db/surveys.server';
import { hasMemberCompletedSurvey } from '@/lib/db/survey-responses.server';

export async function loader({ request }: LoaderFunctionArgs) {
    // ... get user and profile
    
    const onboardingSurvey = await getActiveOnboardingSurvey();
    let hasCompletedSurvey = false;
    
    if (onboardingSurvey && profile) {
        hasCompletedSurvey = await hasMemberCompletedSurvey(
            onboardingSurvey._id.toString(),
            profile._id.toString()
        );
    }
    
    return data({
        profile,
        hasCompletedSurvey,
        surveySlug: onboardingSurvey?.slug
    });
}
```

## Example 3: Creating a New Survey (Admin Function)

```tsx
// scripts/create-annual-survey.ts

import { createSurvey, deactivateSurveysByType } from '@/lib/db/surveys.server';
import { ObjectId } from 'mongodb';

async function createAnnualSurvey() {
    // Deactivate any existing annual surveys
    await deactivateSurveysByType('annual');
    
    // Create new annual survey
    const survey = await createSurvey({
        slug: 'annual-survey-2026',
        title: '2026 Annual Community Survey',
        description: 'Share your feedback about Hello Miami this year!',
        type: 'annual',
        isActive: true,
        questions: [
            {
                id: 'satisfaction',
                type: 'scale',
                text: 'How satisfied are you with the Hello Miami community?',
                required: true,
                scale: {
                    min: 1,
                    max: 10,
                    minLabel: 'Not satisfied',
                    maxLabel: 'Very satisfied'
                }
            },
            {
                id: 'favorite-aspect',
                type: 'single-choice',
                text: 'What do you value most about Hello Miami?',
                required: true,
                options: [
                    'The people and networking',
                    'Demo nights and feedback',
                    'The venues and atmosphere',
                    'Learning from others',
                    'Having dedicated time to build'
                ]
            },
            {
                id: 'improvements',
                type: 'textarea',
                text: 'What could we improve in 2027?',
                required: false,
                helpText: 'Your honest feedback helps us grow!'
            }
        ]
    });
    
    console.log('Created survey:', survey._id);
}
```

## Example 4: Viewing Survey Responses (Admin Dashboard)

```tsx
// app/routes/admin.survey-responses.$surveyId.tsx

import { useLoaderData } from 'react-router';
import { data, type LoaderFunctionArgs } from 'react-router';
import {
    getCompletedSurveyResponsesWithProfiles,
    getSurveyQuestionStats
} from '@/lib/db/survey-responses.server';
import { getSurveyById } from '@/lib/db/surveys.server';

export async function loader({ params }: LoaderFunctionArgs) {
    const surveyId = params.surveyId!;
    
    const [survey, responses] = await Promise.all([
        getSurveyById(surveyId),
        getCompletedSurveyResponsesWithProfiles(surveyId)
    ]);
    
    if (!survey) {
        throw new Response('Survey not found', { status: 404 });
    }
    
    // Get stats for each question
    const questionStats = await Promise.all(
        survey.questions.map(q =>
            getSurveyQuestionStats(surveyId, q.id)
        )
    );
    
    return data({
        survey,
        responses,
        questionStats
    });
}

export default function SurveyResponsesPage() {
    const { survey, responses, questionStats } = useLoaderData<typeof loader>();
    
    return (
        <div>
            <h1>{survey.title}</h1>
            <p>Total Responses: {responses.length}</p>
            
            {survey.questions.map((question, index) => {
                const stats = questionStats[index];
                
                return (
                    <div key={question.id}>
                        <h2>{question.text}</h2>
                        
                        {question.type === 'single-choice' && (
                            <ul>
                                {Object.entries(stats.distribution || {}).map(
                                    ([choice, count]) => (
                                        <li key={choice}>
                                            {choice}: {count} ({((count as number / responses.length) * 100).toFixed(1)}%)
                                        </li>
                                    )
                                )}
                            </ul>
                        )}
                        
                        {question.type === 'scale' && (
                            <div>
                                <p>Average: {stats.average?.toFixed(2)}</p>
                                <p>Min: {stats.min} | Max: {stats.max}</p>
                            </div>
                        )}
                        
                        {(question.type === 'text' || question.type === 'textarea') && (
                            <ul>
                                {stats.responses?.slice(0, 10).map((response: any, i: number) => (
                                    <li key={i}>{response}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
```

## Example 5: Testing Survey Submission (Client-Side)

```typescript
// Example test or development code

async function testSurveySubmission() {
    const formData = new FormData();
    
    formData.append('surveyId', '507f1f77bcf86cd799439011');
    formData.append('supabaseUserId', 'abc123-user-id');
    formData.append('responses', JSON.stringify({
        'role': {
            type: 'text',
            value: 'Software Engineer'
        },
        'experience-level': {
            type: 'single-choice',
            value: '3-5 years'
        },
        'tech-interests': {
            type: 'multiple-choice',
            value: ['React', 'Python', 'AI/ML']
        },
        'hack-night-satisfaction': {
            type: 'scale',
            value: 9
        },
        'seeking-funding': {
            type: 'boolean',
            value: false
        }
    }));
    formData.append('isComplete', 'true');
    
    try {
        const response = await fetch('/api/survey-response', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Survey submitted successfully!', result);
        } else {
            console.error('Survey submission failed:', result);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}
```

## Example 6: Seeding the Onboarding Survey

Use the existing seed script to create the onboarding survey:

```bash
# Run the seed script
pnpm tsx scripts/seed-survey.ts
```

This will:
1. Check if an onboarding survey exists
2. Deactivate any existing onboarding surveys
3. Create a new onboarding survey with all questions defined in `seed-onboarding-survey.server.ts`

## Next Steps

After implementing the survey response API:

1. ✅ Survey response storage API endpoint - **COMPLETE**
2. ⏳ Admin dashboard for survey insights - **TODO**
3. ⏳ Display aggregate survey data - **TODO**

The infrastructure is now in place. Next tasks:
- Create admin routes for viewing survey responses
- Add survey completion tracking to user profiles
- Integrate survey link into onboarding flow
- Create visualizations for survey analytics
