import { useNavigate, useLoaderData, Link } from 'react-router';
import { data, type LoaderFunctionArgs } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { getSurveyBySlug } from '@/lib/db/surveys.server';
import {
    getMemberSurveyResponse,
    getSurveyQuestionStats
} from '@/lib/db/survey-responses.server';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import type { Survey, SurveyQuestion } from '@/types/adapters';

type SerializedSurvey = Omit<Survey, 'id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

type QuestionStats = {
    questionId: string;
    totalResponses: number;
    answerCounts: Record<string, number>;
};

type LoaderData = {
    survey: SerializedSurvey;
    responseCount: number;
    questionStats: QuestionStats[];
    hasCompleted: boolean;
    error?: string;
};

/**
 * Member view for aggregate survey results
 * Shows community-wide statistics for surveys members have completed
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
    const { surveySlug } = params;

    if (!surveySlug) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                hasCompleted: false,
                error: 'Survey not found'
            } as unknown as LoaderData,
            { status: 404 }
        );
    }

    // Parse Clerk user ID from request
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('clerkUserId');

    if (!clerkUserId) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                hasCompleted: false,
                error: 'Not authenticated'
            } as unknown as LoaderData,
            { status: 401 }
        );
    }

    // Get member profile
    const profile = await getProfileByClerkUserId(clerkUserId);
    if (!profile) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                hasCompleted: false,
                error: 'Profile not found'
            } as unknown as LoaderData,
            { status: 404 }
        );
    }

    // Fetch survey by slug
    const surveyData = await getSurveyBySlug(surveySlug);
    if (!surveyData) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                hasCompleted: false,
                error: 'Survey not found'
            } as unknown as LoaderData,
            { status: 404 }
        );
    }

    // Check if member has completed this survey
    const memberResponse = await getMemberSurveyResponse(
        surveyData.id.toString(),
        profile.id.toString()
    );

    if (!memberResponse || !memberResponse.isComplete) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                hasCompleted: false,
                error: 'You must complete this survey to view community results'
            } as unknown as LoaderData,
            { status: 403 }
        );
    }

    // Get statistics for each question
    const questionStatsPromises = surveyData.questions.map(async question => {
        const stats = await getSurveyQuestionStats(
            surveyData.id.toString(),
            question.id
        );
        return {
            questionId: question.id,
            ...stats
        };
    });

    const questionStats = await Promise.all(questionStatsPromises);

    // Calculate total unique responses
    const totalResponses = questionStats.reduce((max, stat) => {
        return Math.max(max, stat.totalResponses);
    }, 0);

    // Serialize survey
    const survey: SerializedSurvey = {
        ...surveyData,
        id: surveyData.id.toString(),
        createdAt: surveyData.createdAt.toISOString(),
        updatedAt: surveyData.updatedAt.toISOString()
    };

    return data({
        survey,
        responseCount: totalResponses,
        questionStats,
        hasCompleted: true
    } as LoaderData);
}

export default function SurveyResultsPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { survey, responseCount, questionStats, hasCompleted, error } =
        useLoaderData<LoaderData>();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/');
        }
    }, [user, loading, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="font-sans text-primary animate-pulse">
                    loading...
                </div>
            </div>
        );
    }

    if (!user) return null;

    if (error || !survey) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto p-4 md:p-8">
                    <NeoCard className="p-12 text-center">
                        <h1 className="mb-4 font-mono text-2xl font-bold text-red-500">
                            {error || 'Survey not found'}
                        </h1>
                        {!hasCompleted && (
                            <p className="mb-6 text-muted-foreground">
                                Complete the survey first to see how your
                                responses compare to the community.
                            </p>
                        )}
                        <div className="flex gap-4 justify-center">
                            {!hasCompleted && (
                                <Link
                                    to={`/dashboard/survey/${survey?.id}?clerkUserId=${user.id}`}
                                >
                                    <NeoButton>Take Survey</NeoButton>
                                </Link>
                            )}
                            <Link to="/dashboard">
                                <NeoButton variant="secondary">
                                    Back to Dashboard
                                </NeoButton>
                            </Link>
                        </div>
                    </NeoCard>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto p-4 md:p-8">
                <div className="mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="mb-4 flex items-center gap-4">
                            <Link to="/dashboard">
                                <NeoButton variant="secondary">
                                    ← Dashboard
                                </NeoButton>
                            </Link>
                        </div>
                        <h1 className="mb-2 font-mono text-3xl font-bold text-primary">
                            {survey.title} - Community Results
                        </h1>
                        <p className="mb-4 text-muted-foreground">
                            {survey.description}
                        </p>
                        <div className="flex gap-4 text-sm">
                            <span className="text-muted-foreground">
                                Type:{' '}
                                <span className="font-mono capitalize text-foreground">
                                    {survey.type}
                                </span>
                            </span>
                            <span className="text-muted-foreground">
                                Community Responses:{' '}
                                <span className="font-mono font-bold text-primary">
                                    {responseCount}
                                </span>
                            </span>
                            <span className="text-muted-foreground">
                                Questions:{' '}
                                <span className="font-mono text-foreground">
                                    {survey.questions.length}
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* Info Banner */}
                    <div className="mb-8">
                        <NeoCard className="bg-primary/5 p-6">
                            <div className="flex gap-3">
                                <div className="text-2xl">📊</div>
                                <div>
                                    <h3 className="mb-1 font-mono text-lg font-bold text-primary">
                                        Community Insights
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        See how the community responded to this
                                        survey. Individual responses are kept
                                        private — only aggregate statistics are
                                        shown.
                                    </p>
                                </div>
                            </div>
                        </NeoCard>
                    </div>

                    {/* Question Results */}
                    <div className="space-y-6">
                        {survey.questions.map((question: SurveyQuestion) => {
                            const stats = questionStats.find(
                                s => s.questionId === question.id
                            );

                            // Don't show stats for text/textarea questions (free-form responses)
                            if (
                                question.type === 'text' ||
                                question.type === 'textarea'
                            ) {
                                return null;
                            }

                            return (
                                <NeoCard key={question.id} className="p-6">
                                    {/* Question Header */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h3 className="flex-1 font-mono text-lg font-bold">
                                                {question.text}
                                            </h3>
                                        </div>
                                        <div className="flex gap-4 text-sm text-muted-foreground">
                                            <span>
                                                Type:{' '}
                                                <span className="font-mono">
                                                    {question.type}
                                                </span>
                                            </span>
                                            {stats && (
                                                <span>
                                                    Responses:{' '}
                                                    <span className="font-mono font-bold text-primary">
                                                        {stats.totalResponses}
                                                    </span>
                                                </span>
                                            )}
                                        </div>
                                        {question.helpText && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {question.helpText}
                                            </p>
                                        )}
                                    </div>

                                    {/* Answer Statistics */}
                                    {stats &&
                                        Object.keys(stats.answerCounts).length >
                                            0 && (
                                            <div className="space-y-2">
                                                {Object.entries(
                                                    stats.answerCounts
                                                )
                                                    .sort(
                                                        ([, a], [, b]) => b - a
                                                    )
                                                    .map(([answer, count]) => {
                                                        const percentage =
                                                            stats.totalResponses >
                                                            0
                                                                ? (
                                                                      (count /
                                                                          stats.totalResponses) *
                                                                      100
                                                                  ).toFixed(1)
                                                                : '0';

                                                        return (
                                                            <div
                                                                key={answer}
                                                                className="rounded-sm border-2 border-border"
                                                            >
                                                                <div className="flex items-center justify-between p-3">
                                                                    <div className="flex-1">
                                                                        <div className="mb-1 font-mono text-sm">
                                                                            {
                                                                                answer
                                                                            }
                                                                        </div>
                                                                        <div
                                                                            className="h-2 bg-primary transition-all"
                                                                            style={{
                                                                                width: `${percentage}%`
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="ml-4 flex gap-4 font-mono text-sm">
                                                                        <span className="text-muted-foreground">
                                                                            {
                                                                                count
                                                                            }
                                                                        </span>
                                                                        <span className="font-bold text-primary">
                                                                            {
                                                                                percentage
                                                                            }
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}

                                    {/* No responses message */}
                                    {(!stats ||
                                        Object.keys(stats.answerCounts)
                                            .length === 0) && (
                                        <p className="text-sm italic text-muted-foreground">
                                            No responses yet
                                        </p>
                                    )}
                                </NeoCard>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex gap-4">
                        <Link to="/dashboard">
                            <NeoButton variant="secondary">
                                ← Back to Dashboard
                            </NeoButton>
                        </Link>
                        <Link
                            to={`/dashboard/survey/${survey.id}?clerkUserId=${user.id}`}
                        >
                            <NeoButton>Update My Responses</NeoButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
