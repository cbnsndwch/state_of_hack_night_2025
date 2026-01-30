import { useNavigate, useLoaderData } from 'react-router';
import { data, type LoaderFunctionArgs } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { Navbar } from '@/components/layout/Navbar';
import { NeoCard } from '@/components/ui/NeoCard';
import { SurveyForm } from '@/components/SurveyForm';
import { getSurveyBySlug } from '@/lib/db/surveys.server';
import { getProfileBySupabaseUserId } from '@/lib/db/profiles.server';
import { getMemberSurveyResponse } from '@/lib/db/survey-responses.server';
import type { Survey, SurveyResponse } from '@/types/mongodb';
import { useEffect } from 'react';

type SerializedSurvey = Omit<Survey, '_id' | 'createdAt' | 'updatedAt'> & {
    _id: string;
    createdAt: string;
    updatedAt: string;
};

type SerializedSurveyResponse = Omit<
    SurveyResponse,
    '_id' | 'surveyId' | 'memberId' | 'submittedAt' | 'createdAt' | 'updatedAt'
> & {
    _id: string;
    surveyId: string;
    memberId: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
};

type LoaderData = {
    survey: SerializedSurvey;
    existingResponse?: SerializedSurveyResponse | null;
    error?: string;
};

export async function loader({ params, request }: LoaderFunctionArgs) {
    const surveySlug = params.surveySlug;

    if (!surveySlug) {
        return data({ error: 'Survey not found' } as LoaderData, {
            status: 404
        });
    }

    // Get survey by slug
    const survey = await getSurveyBySlug(surveySlug);

    if (!survey) {
        return data({ error: 'Survey not found' } as LoaderData, {
            status: 404
        });
    }

    if (!survey.isActive) {
        return data(
            {
                error: 'This survey is no longer accepting responses'
            } as LoaderData,
            { status: 400 }
        );
    }

    // Get user from request (if available)
    // For now, we'll get the supabaseUserId from the query string
    // In a real implementation, this would come from session/cookie
    const url = new URL(request.url);
    const supabaseUserId = url.searchParams.get('supabaseUserId');

    let existingResponse: SurveyResponse | null = null;

    if (supabaseUserId) {
        // Get user profile
        const profile = await getProfileBySupabaseUserId(supabaseUserId);

        if (profile) {
            // Check if user has already responded
            existingResponse = await getMemberSurveyResponse(
                survey._id.toString(),
                profile._id.toString()
            );
        }
    }

    return data({
        survey: {
            ...survey,
            _id: survey._id.toString(),
            createdAt: survey.createdAt.toISOString(),
            updatedAt: survey.updatedAt.toISOString()
        },
        existingResponse: existingResponse
            ? {
                  ...existingResponse,
                  _id: existingResponse._id.toString(),
                  surveyId: existingResponse.surveyId.toString(),
                  memberId: existingResponse.memberId.toString(),
                  submittedAt: existingResponse.submittedAt.toISOString(),
                  createdAt: existingResponse.createdAt.toISOString(),
                  updatedAt: existingResponse.updatedAt.toISOString()
              }
            : null
    });
}

export default function SurveyPage() {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const loaderData = useLoaderData<LoaderData>();

    useEffect(() => {
        if (!loading && !user) {
            navigate('/login');
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

    if (loaderData.error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-black pt-24 px-4">
                    <div className="max-w-4xl mx-auto">
                        <NeoCard className="p-8">
                            <h1 className="text-2xl font-mono text-red-500 mb-4">
                                Error
                            </h1>
                            <p className="text-zinc-400">{loaderData.error}</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="mt-6 text-primary hover:underline"
                            >
                                ← Back to Dashboard
                            </button>
                        </NeoCard>
                    </div>
                </div>
            </>
        );
    }

    const handleSubmitSuccess = () => {
        // Navigate to results page on successful submission
        navigate(
            `/dashboard/survey/${loaderData.survey.slug}/results?supabaseUserId=${user.id}`
        );
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-black pt-24 px-4 pb-12">
                <div className="max-w-4xl mx-auto">
                    <NeoCard className="p-8">
                        {loaderData.existingResponse?.isComplete && (
                            <div className="mb-6 p-4 bg-primary/10 border-2 border-primary">
                                <p className="text-primary font-mono">
                                    You've already completed this survey. You
                                    can update your responses below.
                                </p>
                            </div>
                        )}

                        <SurveyForm
                            survey={loaderData.survey}
                            supabaseUserId={user.id}
                            existingResponse={loaderData.existingResponse}
                            onSubmit={handleSubmitSuccess}
                        />

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mt-6 text-zinc-400 hover:text-primary transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                    </NeoCard>
                </div>
            </div>
        </>
    );
}
