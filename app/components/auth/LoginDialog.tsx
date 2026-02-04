import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot
} from '@/components/ui/input-otp';
import { Loader2 } from 'lucide-react';

interface LoginDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function LoginDialog({
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange
}: LoginDialogProps) {
    const { checkUserByEmail, signInWithEmail, verifyOtp } = useAuth();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const onOpenChange = isControlled
        ? controlledOnOpenChange
        : setInternalOpen;

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Check if user is allowed
            const check = await checkUserByEmail(email);
            if (!check.exists) {
                setError(check.message || 'Email not found in database.');
                setLoading(false);
                return;
            }

            // 2. Send OTP
            await signInWithEmail(email);
            setStep('otp');
        } catch (err: unknown) {
            console.error(err);
            setError(
                (err as Error).message || 'Failed to send code. Try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const navigate = useNavigate();

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await verifyOtp(email, otp);
            onOpenChange?.(false);
            // Reset state and redirect to dashboard
            setStep('email');
            setEmail('');
            setOtp('');
            navigate('/dashboard');
        } catch (err: unknown) {
            console.error(err);
            setError((err as Error).message || 'Invalid code. Try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-white font-sans">
                <DialogHeader>
                    <DialogTitle className="text-primary font-bold">
                        {step === 'email' ? 'welcome_back' : 'verify_code'}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        {step === 'email'
                            ? 'Enter your email to access your builder profile.'
                            : `We sent a code to ${email}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {step === 'email' ? (
                        <form
                            onSubmit={handleEmailSubmit}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="username"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 font-mono"
                                    required
                                    autoFocus
                                />
                            </div>
                            {error && (
                                <p className="text-sm text-red-500 font-mono">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                                disabled={loading}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                send_code
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleOtpSubmit} className="space-y-4">
                            <div className="flex justify-center py-4">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={setOtp}
                                >
                                    <InputOTPGroup className="gap-2">
                                        <InputOTPSlot
                                            index={0}
                                            className="border-zinc-700 text-white"
                                        />
                                        <InputOTPSlot
                                            index={1}
                                            className="border-zinc-700 text-white"
                                        />
                                        <InputOTPSlot
                                            index={2}
                                            className="border-zinc-700 text-white"
                                        />
                                        <InputOTPSlot
                                            index={3}
                                            className="border-zinc-700 text-white"
                                        />
                                        <InputOTPSlot
                                            index={4}
                                            className="border-zinc-700 text-white"
                                        />
                                        <InputOTPSlot
                                            index={5}
                                            className="border-zinc-700 text-white"
                                        />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            {error && (
                                <p className="text-sm text-red-500 font-mono text-center">
                                    {error}
                                </p>
                            )}
                            <Button
                                type="submit"
                                className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                                disabled={loading || otp.length !== 6}
                            >
                                {loading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                verify
                            </Button>
                            <div className="text-center">
                                <Button
                                    type="button"
                                    variant="link"
                                    className="text-sm text-zinc-500 hover:text-white underline"
                                    onClick={() => setStep('email')}
                                >
                                    wrong_email?
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
