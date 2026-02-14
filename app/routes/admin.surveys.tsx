import { useNavigate, useLoaderData, Link } from 'react-router';
import { data, type LoaderFunctionArgs } from 'react-router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { getProfileByClerkUserId } from '@/lib/db/profiles.server';
import { getSurveysWithResponseCounts } from '@/lib/db/surveys.server';
import { NeoButton } from '@/components/ui/NeoButton';
import { NeoCard } from '@/components/ui/NeoCard';
import type { SurveyWithResponseCount } from '@/types/adapters';

type SerializedSurvey = Omit<
    SurveyWithResponseCount,
    'id' | 'createdAt' | 'updatedAt'
> & {
    id: string;
    createdAt: string;
    updatedAt: string;
};

type LoaderData = {
    surveys: SerializedSurvey[];
    error?: string;
};

/**
 * Admin dashboard for survey insights
 * Shows list of surveys with response counts
 */
export async function loader({ request }: LoaderFunctionArgs) {
    // Parse Clerk user ID from request headers or session
    const url = new URL(request.url);
    const clerkUserId = url.searchParams.get('userId');

    if (!clerkUserId) {
        return data({ surveys: [], error: 'Not authenticated' } as LoaderData, {
            status: 401
        });
    }

    // Check if user is an app admin
    const profile = await getProfileByClerkUserId(clerkUserId);
    if (!profile || !profile.isAppAdmin) {
        return data(
            { surveys: [], error: 'Access denied - admin only' } as LoaderData,
            { status: 403 }
        );
    }

    const surveysData = await getSurveysWithResponseCounts();

    // Serialize dates for JSON
    const surveys = surveysData.map(survey => ({
        ...survey,
        id: survey.id.toString(),
        createdAt: survey.createdAt.toISOString(),
        updatedAt: survey.updatedAt.toISOString()
    }));

    return data({ surveys } as LoaderData);
}

export default function AdminSurveys() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const { surveys, error } = useLoaderData<LoaderData>();

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

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto p-4 md:p-8">
                    <NeoCard className="p-12 text-center">
                        <h1 className="mb-4 font-mono text-2xl font-bold text-red-500">
                            {error}
                        </h1>
                        <Link to="/dashboard">
                            <NeoButton>Back to Dashboard</NeoButton>
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
                        <h1 className="mb-2 font-mono text-3xl font-bold text-primary">
                            Survey Insights
                        </h1>
                        <p className="text-muted-foreground">
                            View aggregate survey data and member responses
                        </p>
                    </div>

                    {/* Surveys Grid */}
                    {surveys.length === 0 ? (
                        <NeoCard className="p-12 text-center">
                            <p className="text-muted-foreground">
                                No surveys found. Create one to get started.
                            </p>
                        </NeoCard>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {surveys.map((survey: SerializedSurvey) => (
                                <NeoCard key={survey.id} className="p-6">
                                    {/* Survey Header */}
                                    <div className="mb-4">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h2 className="font-mono text-xl font-bold">
                                                {survey.title}
                                            </h2>
                                            {survey.isActive && (
                                                <span className="rounded-sm bg-primary px-2 py-1 font-mono text-xs text-primary-foreground">
                                                    ACTIVE
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {survey.description}
                                        </p>
                                    </div>

                                    {/* Stats */}
                                    <div className="mb-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Type:
                                            </span>
                                            <span className="font-mono capitalize">
                                                {survey.type}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Questions:
                                            </span>
                                            <span className="font-mono">
                                                {survey.questions.length}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Responses:
                                            </span>
                                            <span className="font-mono font-bold text-primary">
                                                {survey.responseCount}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <Link
                                        to={`/admin/surveys/${survey.id}?userId=${user.id}`}
                                        prefetch="intent"
                                    >
                                        <NeoButton
                                            className="w-full"
                                            disabled={
                                                survey.responseCount === 0
                                            }
                                        >
                                            View Insights
                                        </NeoButton>
                                    </Link>
                                </NeoCard>
                            ))}
                        </div>
                    )}

                    {/* Back Link */}
                    <div className="mt-8">
                        <Link to="/dashboard">
                            <NeoButton variant="secondary">
                                ← Back to Dashboard
                            </NeoButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
