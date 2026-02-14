import { useNavigate, useLoaderData, Link } from 'react-router';
import { data, type LoaderFunctionArgs } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { getSurveyById } from '@/lib/db/surveys.server';
import {
    getCompletedSurveyResponsesWithProfiles,
    getSurveyQuestionStats
} from '@/lib/db/survey-responses.server';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import type { Survey, SurveyQuestion } from '@/types/adapters';

type SerializedSurvey = Omit<Survey, '_id' | 'createdAt' | 'updatedAt'> & {
    _id: string;
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
    error?: string;
};

/**
 * Admin view for detailed survey insights
 * Shows statistics for each question
 */
export async function loader({ params, request }: LoaderFunctionArgs) {
    const { surveyId } = params;

    if (!surveyId) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                error: 'Survey not found'
            } as unknown as LoaderData,
            { status: 404 }
        );
    }

    // Parse Clerk user ID from request
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('userId');

    if (!clerkUserId) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                error: 'Not authenticated'
            } as unknown as LoaderData,
            { status: 401 }
        );
    }

    // Check if user is an app admin
    const profile = await getProfileByClerkUserId(clerkUserId);
    if (!profile || !profile.isAppAdmin) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                error: 'Access denied - admin only'
            } as unknown as LoaderData,
            { status: 403 }
        );
    }

    // Fetch survey
    const surveyData = await getSurveyById(surveyId);
    if (!surveyData) {
        return data(
            {
                survey: null,
                responseCount: 0,
                questionStats: [],
                error: 'Survey not found'
            } as unknown as LoaderData,
            { status: 404 }
        );
    }

    // Get completed responses
    const responses = await getCompletedSurveyResponsesWithProfiles(surveyId);

    // Get statistics for each question
    const questionStatsPromises = surveyData.questions.map(async question => {
        const stats = await getSurveyQuestionStats(surveyId, question.id);
        return {
            questionId: question.id,
            ...stats
        };
    });

    const questionStats = await Promise.all(questionStatsPromises);

    // Serialize survey
    const survey: SerializedSurvey = {
        ...surveyData,
        _id: surveyData._id.toString(),
        createdAt: surveyData.createdAt.toISOString(),
        updatedAt: surveyData.updatedAt.toISOString()
    };

    return data({
        survey,
        responseCount: responses.length,
        questionStats
    } as LoaderData);
}

export default function AdminSurveyDetail() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { survey, responseCount, questionStats, error } =
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
                        <Link to="/admin/surveys">
                            <NeoButton>Back to Surveys</NeoButton>
                        </Link>
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
                            <Link to="/admin/surveys">
                                <NeoButton variant="secondary">
                                    ← Back
                                </NeoButton>
                            </Link>
                        </div>
                        <h1 className="mb-2 font-mono text-3xl font-bold text-primary">
                            {survey.title}
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
                                Total Responses:{' '}
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

                    {/* Question Insights */}
                    <div className="space-y-6">
                        {survey.questions.map((question: SurveyQuestion) => {
                            const stats = questionStats.find(
                                s => s.questionId === question.id
                            );

                            return (
                                <NeoCard key={question.id} className="p-6">
                                    {/* Question Header */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h3 className="flex-1 font-mono text-lg font-bold">
                                                {question.text}
                                            </h3>
                                            {question.required && (
                                                <span className="ml-2 rounded-sm bg-primary/20 px-2 py-1 font-mono text-xs text-primary">
                                                    REQUIRED
                                                </span>
                                            )}
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
                    <div className="mt-8">
                        <Link to="/admin/surveys">
                            <NeoButton variant="secondary">
                                ← Back to All Surveys
                            </NeoButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
