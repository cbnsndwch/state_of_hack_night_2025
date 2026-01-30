# Member Survey System - Schema & Questions Design

**Version:** 1.0  
**Last Updated:** January 30, 2026  
**Status:** Approved for Implementation

---

## Overview

The member survey system collects feedback from community members about:
- Community direction and feature priorities
- Member interests and needs
- Event preferences and availability
- Skills and collaboration opportunities

---

## Survey Types

### 1. Onboarding Survey (Required)
Presented to new members during their first login/profile setup.

### 2. Annual Community Survey (Optional)
Sent once per year to gather broader feedback.

### 3. Event Feedback Survey (Optional)
Post-event surveys for specific hackathons or workshops.

---

## Database Schema

### Collection: `surveys`

```typescript
interface Survey {
    _id: ObjectId;
    /** Survey identifier (e.g., "onboarding-2026", "annual-2026") */
    slug: string;
    title: string;
    description: string;
    /** Survey type */
    type: 'onboarding' | 'annual' | 'event';
    /** Whether survey is currently active */
    isActive: boolean;
    /** Survey questions configuration */
    questions: SurveyQuestion[];
    createdAt: Date;
    updatedAt: Date;
}

interface SurveyQuestion {
    /** Unique question ID within the survey */
    id: string;
    /** Question text */
    text: string;
    /** Question type */
    type: 'text' | 'textarea' | 'single-choice' | 'multiple-choice' | 'scale' | 'boolean';
    /** Whether question is required */
    required: boolean;
    /** Options for choice/scale questions */
    options?: string[];
    /** Min/max for scale questions (e.g., 1-10) */
    scale?: { min: number; max: number; minLabel?: string; maxLabel?: string };
    /** Help text or description */
    helpText?: string;
}
```

### Collection: `survey_responses`

```typescript
interface SurveyResponse {
    _id: ObjectId;
    /** Reference to Survey._id */
    surveyId: ObjectId;
    /** Reference to Profile._id */
    memberId: ObjectId;
    /** Responses keyed by question ID */
    responses: Record<string, SurveyAnswer>;
    /** Whether response is complete */
    isComplete: boolean;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

type SurveyAnswer = 
    | { type: 'text'; value: string }
    | { type: 'textarea'; value: string }
    | { type: 'single-choice'; value: string }
    | { type: 'multiple-choice'; value: string[] }
    | { type: 'scale'; value: number }
    | { type: 'boolean'; value: boolean };

interface SurveyResponseInsert {
    surveyId: ObjectId;
    memberId: ObjectId;
    responses: Record<string, SurveyAnswer>;
    isComplete?: boolean;
    submittedAt?: Date;
}

interface SurveyResponseUpdate {
    responses?: Record<string, SurveyAnswer>;
    isComplete?: boolean;
    submittedAt?: Date;
}
```

---

## Onboarding Survey Questions

### Survey Configuration

```json
{
    "slug": "onboarding-2026",
    "title": "Welcome to Hello Miami!",
    "description": "Help us understand your interests and how we can make your experience better.",
    "type": "onboarding",
    "isActive": true,
    "questions": [
        {
            "id": "experience_level",
            "text": "What best describes your experience level?",
            "type": "single-choice",
            "required": true,
            "options": [
                "Just getting started with coding",
                "Building side projects",
                "Professional software engineer",
                "Senior/Staff engineer or technical lead",
                "Founder or technical co-founder",
                "Other technical role"
            ]
        },
        {
            "id": "primary_interests",
            "text": "What brings you to Hello Miami? (Select all that apply)",
            "type": "multiple-choice",
            "required": true,
            "options": [
                "Meeting other builders",
                "Working on personal projects",
                "Learning new technologies",
                "Getting feedback on my work",
                "Finding collaborators or co-founders",
                "Mentoring others",
                "Being mentored",
                "Access to exclusive events",
                "Networking with investors"
            ]
        },
        {
            "id": "tech_stack",
            "text": "What technologies are you interested in or experienced with? (Select all that apply)",
            "type": "multiple-choice",
            "required": false,
            "options": [
                "JavaScript/TypeScript",
                "Python",
                "React/Next.js",
                "Node.js/Deno/Bun",
                "Mobile (iOS/Android/React Native)",
                "DevOps/Cloud (AWS, GCP, Azure)",
                "AI/ML",
                "Blockchain/Web3",
                "Hardware/IoT",
                "Game Development",
                "Data Science",
                "Design/UI/UX",
                "Other"
            ]
        },
        {
            "id": "attendance_frequency",
            "text": "How often do you plan to attend hack nights?",
            "type": "single-choice",
            "required": true,
            "options": [
                "Every week (both Tuesday and Thursday)",
                "Once a week",
                "A few times a month",
                "Once a month",
                "Occasionally when I can"
            ]
        },
        {
            "id": "event_preferences",
            "text": "What types of events would you like to see more of? (Select all that apply)",
            "type": "multiple-choice",
            "required": true,
            "options": [
                "Regular hack nights (current format)",
                "Hackathons (24-48 hour builds)",
                "Technical workshops",
                "Demo nights",
                "Guest speaker talks",
                "Study groups or reading clubs",
                "Collaborative projects",
                "Social hangouts"
            ]
        },
        {
            "id": "workshop_topics",
            "text": "What workshop topics interest you? (Select top 3)",
            "type": "multiple-choice",
            "required": false,
            "options": [
                "Building with AI (LLMs, agents, etc.)",
                "Full-stack web development",
                "Mobile app development",
                "DevOps and deployment",
                "System design and architecture",
                "Hardware and electronics",
                "Game development",
                "Blockchain and smart contracts",
                "Data science and analytics",
                "Product design and UX",
                "Startup fundamentals",
                "Open source contribution"
            ],
            "helpText": "Select up to 3 topics"
        },
        {
            "id": "seeking_funding",
            "text": "Are you currently working on a startup or seeking funding?",
            "type": "boolean",
            "required": false
        },
        {
            "id": "open_to_mentoring",
            "text": "Would you be interested in mentoring other members?",
            "type": "boolean",
            "required": false
        },
        {
            "id": "hear_about_us",
            "text": "How did you hear about Hello Miami?",
            "type": "single-choice",
            "required": false,
            "options": [
                "Friend or colleague",
                "Social media (Twitter, LinkedIn, etc.)",
                "Luma event discovery",
                "Tech event in Miami",
                "Slack/Discord community",
                "Other"
            ]
        },
        {
            "id": "goals",
            "text": "What do you hope to accomplish by being part of Hello Miami?",
            "type": "textarea",
            "required": false,
            "helpText": "Share your goals, projects you want to build, or skills you want to learn"
        },
        {
            "id": "additional_feedback",
            "text": "Anything else you'd like us to know?",
            "type": "textarea",
            "required": false,
            "helpText": "Suggestions, questions, or ideas for the community"
        }
    ]
}
```

---

## Annual Community Survey Questions

For future implementation, targeting existing members:

### Key Areas to Cover:
1. **Satisfaction & Net Promoter Score**
   - Overall community satisfaction (1-10 scale)
   - Likelihood to recommend (NPS)
   - What's working well vs. needs improvement

2. **Engagement Patterns**
   - Attendance frequency over past year
   - Favorite aspects of hack nights
   - Barriers to attending more often

3. **Feature Priorities**
   - Rank desired features (from PRD roadmap)
   - New feature suggestions

4. **Community Culture**
   - Inclusivity and "no-ego" culture feedback
   - Safety and comfort level
   - Suggestions for improvement

5. **Future Direction**
   - Topics for 2027 workshops
   - Interest in hackathons or competitions
   - Partnership or sponsor suggestions

---

## Event Feedback Survey Template

Post-event surveys for specific hackathons or workshops:

### Questions:
1. How would you rate this event overall? (1-10 scale)
2. What did you like most?
3. What could be improved?
4. Did you achieve your goals for attending?
5. Would you attend similar events in the future?

---

## Analytics & Insights

### Key Metrics to Track:

1. **Response Rate**
   - % of members who complete onboarding survey
   - Time to complete survey

2. **Experience Level Distribution**
   - Breakdown by experience level
   - Trends over time

3. **Interest Areas**
   - Most popular tech stacks
   - Most requested workshop topics
   - Event type preferences

4. **Engagement Indicators**
   - Planned attendance frequency
   - Open to mentoring %
   - Seeking funding %

5. **Acquisition Channels**
   - How members discover Hello Miami
   - Most effective channels

---

## Privacy & Data Usage

1. **Consent**: Members consent to survey data being used for community insights
2. **Anonymization**: Aggregate data displayed publicly, individual responses kept private
3. **Admin Access**: Only app admins can view individual responses
4. **Retention**: Survey responses retained indefinitely for analytics
5. **Export**: Members can request their survey data

---

## Implementation Notes

### Database Indexes

```typescript
// surveys collection
{ slug: 1 } // unique
{ type: 1, isActive: 1 }

// survey_responses collection
{ surveyId: 1, memberId: 1 } // unique compound
{ memberId: 1 }
{ isComplete: 1, submittedAt: 1 }
```

### Integration with Profile

- After completing onboarding survey, update `Profile.onboardingDismissed = true`
- Sync `seeking_funding` and `open_to_mentoring` responses to Profile fields
- Sync `tech_stack` selections to Profile.skills

### Survey UI Flow

1. **New Member**: After profile creation, show onboarding survey modal
2. **Skip Option**: Allow "Complete Later" with reminder on next visit
3. **Progress**: Show completion percentage as user fills out
4. **Save Draft**: Auto-save responses as user progresses
5. **Thank You**: Show confirmation and next steps after submission

---

## Future Enhancements

1. **Conditional Questions**: Show follow-up questions based on previous answers
2. **Survey Versioning**: Track changes to survey questions over time
3. **Reminders**: Email/SMS reminders for incomplete surveys
4. **Incentives**: Badge for completing surveys
5. **Periodic Surveys**: Quarterly check-ins for active members
6. **A/B Testing**: Test different question formats for better response rates

---

## Appendix: Sample Aggregate Insights Dashboard

### Display for Public/Members:

```
Community Insights (Based on 150 responses)

Experience Level:
█████████████░░░░░░ 65% Professional engineers
████████░░░░░░░░░░ 40% Building side projects  
█████░░░░░░░░░░░░ 25% Just getting started
███████░░░░░░░░░░ 35% Senior/Staff level
████████░░░░░░░░░░ 42% Founders

Top Interests:
1. Meeting other builders (87%)
2. Working on personal projects (78%)
3. Learning new technologies (72%)
4. Getting feedback (65%)
5. Finding collaborators (52%)

Most Popular Tech:
1. JavaScript/TypeScript (82%)
2. Python (68%)
3. React/Next.js (71%)
4. AI/ML (54%)
5. Mobile Development (38%)

Requested Workshops:
1. Building with AI (72%)
2. Full-stack development (58%)
3. System design (51%)
4. DevOps & deployment (47%)
5. Hardware & electronics (35%)
```

---

*This schema is designed to scale with community growth while respecting the "no-ego" culture and member privacy.*
