import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useResetPasswordMutation } from '../api/authApiSlice';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Lock, Flame, CheckCircle2, ArrowLeft, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = searchParams.get('email') || '';
  const tokenParam = searchParams.get('token') || '';

  const [email] = useState(emailParam);
  const [resetToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email) {
      setErrorMsg('Missing email in reset link. Please request a new password reset link.');
      return;
    }

    if (!resetToken) {
      setErrorMsg('Missing reset token. Please request a new password reset link.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      await resetPassword({
        email,
        resetToken,
        newPassword,
      }).unwrap();

      setIsSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err?.data?.detail ||
          err?.data?.message ||
          'Failed to reset password. The link may have expired (valid for 60 mins). Please request a new link.'
      );
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE] dark:bg-[#120B08] bg-mandala-pattern transition-colors duration-300 overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-saffron-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Switcher */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        {/* Brand Icon */}
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-maroon-800 via-saffron-600 to-gold-500 items-center justify-center text-white shadow-gold mb-3">
          <Flame size={28} className="animate-pulse" />
        </div>
        <h1 className="text-3xl font-extrabold text-charcoal-900 dark:text-cream-50 tracking-tight font-display">
          SGDPS Cloud Portal
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1 font-bold">
          Durga Puja Collection & Treasury · Central Database
        </p>
      </div>

      {/* Main Card */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-xl border border-cream-border dark:border-charcoal-700 py-8 px-6 sm:px-8 rounded-3xl shadow-xl space-y-6">
          {isSuccess ? (
            <div className="text-center space-y-5 py-4 animate-in fade-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf-500/15 border-2 border-leaf-500 text-leaf-600 shadow-glow-leaf">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-extrabold text-charcoal-900 dark:text-cream-50 font-display">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-300">
                  Your new password is now active. You can sign in with your updated credentials.
                </p>
              </div>

              <Button
                variant="primary"
                className="w-full"
                size="lg"
                onClick={() => navigate('/login')}
              >
                Proceed to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-extrabold text-charcoal-900 dark:text-cream-50 font-display">
                  Set New Password
                </h2>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-300 mt-1">
                  Create a secure password for account{' '}
                  <strong className="text-saffron-600 dark:text-gold-400">{email || 'your account'}</strong>
                </p>
              </div>

              {/* Feedback Alert */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-maroon-500/10 border border-maroon-500/30 text-maroon-700 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password *"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    icon={<Lock size={16} />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-8 text-charcoal-400 hover:text-charcoal-700 dark:hover:text-cream-200 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <Input
                  label="Confirm New Password *"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  icon={<Lock size={16} />}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  Update Password
                </Button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-charcoal-500 hover:text-saffron-600 dark:text-charcoal-400 dark:hover:text-gold-400 transition-colors"
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
