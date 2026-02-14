/**
 * Seed script to create the initial onboarding survey.
 * Run this once to populate the surveys collection with the onboarding survey.
 */

import type { SurveyInsert, SurveyQuestion } from '@/types/adapters';
import { createSurvey, getSurveyBySlug } from './surveys.server';

const onboardingSurveyQuestions: SurveyQuestion[] = [
    {
        id: 'experience_level',
        text: 'What best describes your experience level?',
        type: 'single-choice',
        required: true,
        options: [
            'Just getting started with coding',
            'Building side projects',
            'Professional software engineer',
            'Senior/Staff engineer or technical lead',
            'Founder or technical co-founder',
            'Other technical role'
        ]
    },
    {
        id: 'primary_interests',
        text: 'What brings you to Hello Miami? (Select all that apply)',
        type: 'multiple-choice',
        required: true,
        options: [
            'Meeting other builders',
            'Working on personal projects',
            'Learning new technologies',
            'Getting feedback on my work',
            'Finding collaborators or co-founders',
            'Mentoring others',
            'Being mentored',
            'Access to exclusive events',
            'Networking with investors'
        ]
    },
    {
        id: 'tech_stack',
        text: 'What technologies are you interested in or experienced with? (Select all that apply)',
        type: 'multiple-choice',
        required: false,
        options: [
            'JavaScript/TypeScript',
            'Python',
            'React/Next.js',
            'Node.js/Deno/Bun',
            'Mobile (iOS/Android/React Native)',
            'DevOps/Cloud (AWS, GCP, Azure)',
            'AI/ML',
            'Blockchain/Web3',
            'Hardware/IoT',
            'Game Development',
            'Data Science',
            'Design/UI/UX',
            'Other'
        ]
    },
    {
        id: 'attendance_frequency',
        text: 'How often do you plan to attend hack nights?',
        type: 'single-choice',
        required: true,
        options: [
            'Every week (both Tuesday and Thursday)',
            'Once a week',
            'A few times a month',
            'Once a month',
            'Occasionally when I can'
        ]
    },
    {
        id: 'event_preferences',
        text: 'What types of events would you like to see more of? (Select all that apply)',
        type: 'multiple-choice',
        required: true,
        options: [
            'Regular hack nights (current format)',
            'Hackathons (24-48 hour builds)',
            'Technical workshops',
            'Demo nights',
            'Guest speaker talks',
            'Study groups or reading clubs',
            'Collaborative projects',
            'Social hangouts'
        ]
    },
    {
        id: 'workshop_topics',
        text: 'What workshop topics interest you? (Select top 3)',
        type: 'multiple-choice',
        required: false,
        options: [
            'Building with AI (LLMs, agents, etc.)',
            'Full-stack web development',
            'Mobile app development',
            'DevOps and deployment',
            'System design and architecture',
            'Hardware and electronics',
            'Game development',
            'Blockchain and smart contracts',
            'Data science and analytics',
            'Product design and UX',
            'Startup fundamentals',
            'Open source contribution'
        ],
        helpText: 'Select up to 3 topics'
    },
    {
        id: 'seeking_funding',
        text: 'Are you currently working on a startup or seeking funding?',
        type: 'boolean',
        required: false
    },
    {
        id: 'open_to_mentoring',
        text: 'Would you be interested in mentoring other members?',
        type: 'boolean',
        required: false
    },
    {
        id: 'hear_about_us',
        text: 'How did you hear about Hello Miami?',
        type: 'single-choice',
        required: false,
        options: [
            'Friend or colleague',
            'Social media (Twitter, LinkedIn, etc.)',
            'Luma event discovery',
            'Tech event in Miami',
            'Slack/Discord community',
            'Other'
        ]
    },
    {
        id: 'goals',
        text: 'What do you hope to accomplish by being part of Hello Miami?',
        type: 'textarea',
        required: false,
        helpText:
            'Share your goals, projects you want to build, or skills you want to learn'
    },
    {
        id: 'additional_feedback',
        text: "Anything else you'd like us to know?",
        type: 'textarea',
        required: false,
        helpText: 'Suggestions, questions, or ideas for the community'
    }
];

/**
 * Seed the onboarding survey
 */
export async function seedOnboardingSurvey(): Promise<void> {
    const slug = 'onboarding-2026';

    // Check if survey already exists
    const existing = await getSurveyBySlug(slug);
    if (existing) {
        console.log(
            `Onboarding survey '${slug}' already exists. Skipping seed.`
        );
        return;
    }

    const surveyData: SurveyInsert = {
        slug,
        title: 'Welcome to Hello Miami!',
        description:
            'Help us understand your interests and how we can make your experience better.',
        type: 'onboarding',
        isActive: true,
        questions: onboardingSurveyQuestions
    };

    await createSurvey(surveyData);
    console.log(`Onboarding survey '${slug}' created successfully.`);
}
