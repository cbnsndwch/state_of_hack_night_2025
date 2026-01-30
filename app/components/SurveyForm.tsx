import { useState } from 'react';
import { Form } from 'react-router';
import type {
    Survey,
    SurveyQuestion,
    SurveyAnswer,
    SurveyResponse
} from '@/types/mongodb';
import { Label } from '@/components/ui/label';
import { NeoInput } from '@/components/ui/NeoInput';
import { NeoTextarea } from '@/components/ui/NeoTextarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { NeoButton } from '@/components/ui/NeoButton';
import { cn } from '@/utils/cn';

// Types that work with both ObjectId and string versions, and Date and string dates
type FlexibleSurvey = Omit<Survey, '_id' | 'createdAt' | 'updatedAt'> & {
    _id: { toString(): string } | string;
    createdAt: Date | string;
    updatedAt: Date | string;
};

type FlexibleSurveyResponse = Omit<
    SurveyResponse,
    '_id' | 'surveyId' | 'memberId' | 'submittedAt' | 'createdAt' | 'updatedAt'
> & {
    _id?: { toString(): string } | string;
    surveyId?: { toString(): string } | string;
    memberId?: { toString(): string } | string;
    submittedAt?: Date | string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
};

interface SurveyFormProps {
    survey: FlexibleSurvey;
    supabaseUserId: string;
    existingResponse?: FlexibleSurveyResponse | null;
    onSubmit?: () => void;
}

interface ValidationErrors {
    [questionId: string]: string;
}

export function SurveyForm({
    survey,
    supabaseUserId,
    existingResponse,
    onSubmit
}: SurveyFormProps) {
    // Initialize responses from existing response or empty
    const [responses, setResponses] = useState<Record<string, SurveyAnswer>>(
        existingResponse?.responses || {}
    );
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate a single question
    const validateQuestion = (question: SurveyQuestion): string | null => {
        if (!question.required) return null;

        const response = responses[question.id];
        if (!response) {
            return 'This field is required';
        }

        switch (question.type) {
            case 'text':
            case 'textarea':
                if (
                    !response.value ||
                    (typeof response.value === 'string' &&
                        response.value.trim() === '')
                ) {
                    return 'This field is required';
                }
                break;
            case 'single-choice':
                if (!response.value) {
                    return 'Please select an option';
                }
                break;
            case 'multiple-choice':
                if (
                    !Array.isArray(response.value) ||
                    response.value.length === 0
                ) {
                    return 'Please select at least one option';
                }
                break;
            case 'scale':
                if (typeof response.value !== 'number') {
                    return 'Please select a value';
                }
                break;
            case 'boolean':
                // Boolean can be true or false, so no validation needed
                break;
        }

        return null;
    };

    // Validate all questions
    const validateAll = (): boolean => {
        const newErrors: ValidationErrors = {};
        let isValid = true;

        survey.questions.forEach(question => {
            const error = validateQuestion(question);
            if (error) {
                newErrors[question.id] = error;
                isValid = false;
            }
        });

        setErrors(newErrors);
        return isValid;
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Validate all fields
        if (!validateAll()) {
            // Scroll to first error
            const firstErrorId = Object.keys(errors)[0];
            if (firstErrorId) {
                document
                    .getElementById(`question-${firstErrorId}`)
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsSubmitting(true);
        // Form will be submitted via React Router Form
        onSubmit?.();
    };

    // Update response for a question
    const updateResponse = (questionId: string, answer: SurveyAnswer) => {
        setResponses(prev => ({
            ...prev,
            [questionId]: answer
        }));

        // Clear error for this field
        if (errors[questionId]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[questionId];
                return newErrors;
            });
        }
    };

    // Render different question types
    const renderQuestion = (question: SurveyQuestion) => {
        const response = responses[question.id];
        const error = errors[question.id];

        switch (question.type) {
            case 'text':
                return (
                    <NeoInput
                        id={`input-${question.id}`}
                        value={
                            (response?.type === 'text' && response.value) || ''
                        }
                        onChange={e =>
                            updateResponse(question.id, {
                                type: 'text',
                                value: e.target.value
                            })
                        }
                        className={cn(error && 'border-red-500')}
                    />
                );

            case 'textarea':
                return (
                    <NeoTextarea
                        id={`textarea-${question.id}`}
                        value={
                            (response?.type === 'textarea' && response.value) ||
                            ''
                        }
                        onChange={e =>
                            updateResponse(question.id, {
                                type: 'textarea',
                                value: e.target.value
                            })
                        }
                        rows={4}
                        className={cn(error && 'border-red-500')}
                    />
                );

            case 'single-choice':
                return (
                    <RadioGroup
                        value={
                            (response?.type === 'single-choice' &&
                                response.value) ||
                            ''
                        }
                        onValueChange={value =>
                            updateResponse(question.id, {
                                type: 'single-choice',
                                value
                            })
                        }
                    >
                        {question.options?.map(option => (
                            <div
                                key={option}
                                className="flex items-center space-x-2"
                            >
                                <RadioGroupItem
                                    value={option}
                                    id={`${question.id}-${option}`}
                                />
                                <Label
                                    htmlFor={`${question.id}-${option}`}
                                    className="font-normal cursor-pointer"
                                >
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                );

            case 'multiple-choice':
                const selectedValues =
                    (response?.type === 'multiple-choice' && response.value) ||
                    [];
                return (
                    <div className="space-y-2">
                        {question.options?.map(option => {
                            const isChecked = selectedValues.includes(option);
                            return (
                                <div
                                    key={option}
                                    className="flex items-center space-x-2"
                                >
                                    <Checkbox
                                        id={`${question.id}-${option}`}
                                        checked={isChecked}
                                        onCheckedChange={checked => {
                                            const newValues = checked
                                                ? [...selectedValues, option]
                                                : selectedValues.filter(
                                                      v => v !== option
                                                  );
                                            updateResponse(question.id, {
                                                type: 'multiple-choice',
                                                value: newValues
                                            });
                                        }}
                                    />
                                    <Label
                                        htmlFor={`${question.id}-${option}`}
                                        className="font-normal cursor-pointer"
                                    >
                                        {option}
                                    </Label>
                                </div>
                            );
                        })}
                    </div>
                );

            case 'scale':
                const scaleValue =
                    (response?.type === 'scale' && response.value) ||
                    question.scale?.min ||
                    0;
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm text-zinc-400">
                            <span>
                                {question.scale?.minLabel ||
                                    question.scale?.min}
                            </span>
                            <span className="text-primary font-mono">
                                {scaleValue}
                            </span>
                            <span>
                                {question.scale?.maxLabel ||
                                    question.scale?.max}
                            </span>
                        </div>
                        <Slider
                            min={question.scale?.min || 0}
                            max={question.scale?.max || 10}
                            step={1}
                            value={[scaleValue]}
                            onValueChange={values =>
                                updateResponse(question.id, {
                                    type: 'scale',
                                    value: values[0]
                                })
                            }
                        />
                    </div>
                );

            case 'boolean':
                const boolValue =
                    response?.type === 'boolean' && response.value;
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            id={`switch-${question.id}`}
                            checked={boolValue || false}
                            onCheckedChange={checked =>
                                updateResponse(question.id, {
                                    type: 'boolean',
                                    value: checked
                                })
                            }
                        />
                        <Label
                            htmlFor={`switch-${question.id}`}
                            className="font-normal cursor-pointer"
                        >
                            {boolValue ? 'Yes' : 'No'}
                        </Label>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Form
            method="post"
            action="/api/survey-response"
            onSubmit={handleSubmit}
            className="space-y-8"
        >
            {/* Survey header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-mono text-primary">
                    {survey.title}
                </h2>
                {survey.description && (
                    <p className="text-zinc-400">{survey.description}</p>
                )}
            </div>

            {/* Hidden fields to send data to API */}
            <input
                type="hidden"
                name="responses"
                value={JSON.stringify(responses)}
            />
            <input
                type="hidden"
                name="surveyId"
                value={
                    typeof survey._id === 'string'
                        ? survey._id
                        : survey._id.toString()
                }
            />
            <input type="hidden" name="supabaseUserId" value={supabaseUserId} />
            <input type="hidden" name="isComplete" value="true" />

            {/* Questions */}
            <div className="space-y-6">
                {survey.questions.map((question, index) => (
                    <div
                        key={question.id}
                        id={`question-${question.id}`}
                        className={cn(
                            'p-6 bg-zinc-900/50 border-2',
                            errors[question.id]
                                ? 'border-red-500'
                                : 'border-zinc-800'
                        )}
                    >
                        <div className="space-y-3">
                            <Label className="text-base">
                                <span className="text-zinc-500 font-mono mr-2">
                                    {(index + 1).toString().padStart(2, '0')}.
                                </span>
                                {question.text}
                                {question.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                )}
                            </Label>

                            {question.helpText && (
                                <p className="text-sm text-zinc-500">
                                    {question.helpText}
                                </p>
                            )}

                            {renderQuestion(question)}

                            {errors[question.id] && (
                                <p className="text-sm text-red-500">
                                    {errors[question.id]}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit button */}
            <div className="flex justify-end gap-4">
                <NeoButton
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[200px]"
                >
                    {isSubmitting
                        ? 'Submitting...'
                        : existingResponse
                          ? 'Update Responses'
                          : 'Submit Survey'}
                </NeoButton>
            </div>

            {/* Required field note */}
            <p className="text-sm text-zinc-500 text-center">
                <span className="text-red-500">*</span> Required fields
            </p>
        </Form>
    );
}
