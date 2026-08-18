import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from '../api/authApiSlice';
import { setCredentials } from '../slices/authSlice';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import {
  Lock,
  Mail,
  Flame,
  ShieldCheck,
  ArrowRight,
  User,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [forgotPassword, { isLoading: isSendingReset }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await login({ email, password }).unwrap();
      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
        })
      );
      navigate('/');
    } catch (err: any) {
      setErrorMsg(
        err?.data?.detail ||
          err?.data?.message ||
          'Invalid email or password. Please verify connection.'
      );
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
        role: 'Admin', // Admin & Treasury access for web users
      }).unwrap();

      // Automatically log the new user in
      const response = await login({ email, password }).unwrap();
      dispatch(
        setCredentials({
          user: response.user,
          token: response.accessToken,
        })
      );
      navigate('/');
    } catch (err: any) {
      setErrorMsg(
        err?.data?.detail ||
          err?.data?.message ||
          'Registration failed. Please verify your details.'
      );
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await forgotPassword({ email }).unwrap();
      setSuccessMsg(
        res.message || 'If registered, a password reset token has been generated. You can now reset your password.'
      );
      setMode('reset');
    } catch (err: any) {
      setErrorMsg(
        err?.data?.detail ||
          err?.data?.message ||
          'Failed to process password reset request.'
      );
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await resetPassword({
        email,
        resetToken,
        newPassword,
      }).unwrap();
      setSuccessMsg(res.message || 'Password reset successfully! You can now sign in.');
      setMode('login');
      setPassword(newPassword);
    } catch (err: any) {
      setErrorMsg(
        err?.data?.detail ||
          err?.data?.message ||
          'Failed to reset password. Please check your reset token.'
      );
    }
  };

  const setDemoCredentials = (role: 'Admin' | 'Collector') => {
    if (role === 'Admin') {
      setEmail('admin@sgdps.com');
      setPassword('Admin@123');
    } else {
      setEmail('collector@sgdps.com');
      setPassword('Collector@123');
    }
    setMode('login');
    setErrorMsg('');
    setSuccessMsg('');
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF6EE] dark:bg-[#120B08] bg-mandala-pattern transition-colors duration-300 overflow-hidden">
      {/* Ambient Saffron & Gold Glows */}
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

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md w-full">
        <div className="rounded-3xl border border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 p-7 sm:p-8 shadow-festive dark:shadow-festive-dark space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-cream-100 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm border border-cream-border dark:border-charcoal-600'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm border border-cream-border dark:border-charcoal-600'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              New Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('forgot');
                setErrorMsg('');
              }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'forgot' || mode === 'reset'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm border border-cream-border dark:border-charcoal-600'
                  : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              Reset Pass
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-maroon-50 dark:bg-maroon-950/40 border border-maroon-600/30 text-maroon-700 dark:text-rose-400 text-xs rounded-xl font-medium animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-leaf-50 dark:bg-leaf-950/40 border border-leaf-600/30 text-leaf-700 dark:text-leaf-300 text-xs rounded-xl font-medium animate-in fade-in flex items-center gap-2">
              <CheckCircle2 size={16} className="text-leaf-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Sign In Form */}
          {mode === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                label="Email Address"
                type="email"
                required
                autoFocus
                icon={<Mail size={16} />}
                placeholder="admin@sgdps.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <Input
                  label="Password"
                  type="password"
                  required
                  icon={<Lock size={16} />}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                    }}
                    className="text-[11px] font-bold text-saffron-600 dark:text-gold-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-bold"
                isLoading={isLoggingIn}
                rightIcon={<ArrowRight size={16} />}
              >
                Sign In to Cloud
              </Button>
            </form>
          )}

          {/* 2. Admin Self-Registration Form */}
          {mode === 'register' && (
            <form className="space-y-3.5" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name *"
                  required
                  autoFocus
                  icon={<User size={15} />}
                  placeholder="Rajesh"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name *"
                  required
                  placeholder="Mukherjee"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <Input
                label="Email Address *"
                type="email"
                required
                icon={<Mail size={15} />}
                placeholder="admin@sgdps.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Create Password *"
                type="password"
                required
                icon={<Lock size={15} />}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="p-2.5 rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 text-[11px] text-charcoal-600 dark:text-cream-300">
                ⭐ Grants full <strong>Admin & Treasurer</strong> permissions to manage collections, expenses, and residents.
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-bold mt-1"
                isLoading={isRegistering}
                rightIcon={<ArrowRight size={16} />}
              >
                Create Admin Account
              </Button>
            </form>
          )}

          {/* 3. Forgot Password Form */}
          {mode === 'forgot' && (
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <p className="text-xs text-charcoal-600 dark:text-cream-300">
                Enter your registered email address to receive your password reset token.
              </p>

              <Input
                label="Registered Email Address"
                type="email"
                required
                autoFocus
                icon={<Mail size={16} />}
                placeholder="admin@sgdps.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-bold"
                isLoading={isSendingReset}
                rightIcon={<ArrowRight size={16} />}
              >
                Send Reset Token
              </Button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-xs font-bold text-saffron-600 dark:text-gold-400 hover:underline"
                >
                  Already have a reset token? Click here
                </button>
              </div>
            </form>
          )}

          {/* 4. Reset Password Form */}
          {mode === 'reset' && (
            <form className="space-y-3.5" onSubmit={handleResetPassword}>
              <Input
                label="Registered Email Address *"
                type="email"
                required
                icon={<Mail size={15} />}
                placeholder="admin@sgdps.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Reset Token *"
                required
                autoFocus
                icon={<KeyRound size={15} />}
                placeholder="Enter reset token"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
              />

              <Input
                label="New Password *"
                type="password"
                required
                icon={<Lock size={15} />}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-bold"
                isLoading={isResetting}
                rightIcon={<CheckCircle2 size={16} />}
              >
                Confirm New Password
              </Button>
            </form>
          )}

          {/* Quick Demo Credentials (Unified 2-Role Structure) */}
          <div className="pt-4 border-t border-cream-100 dark:border-charcoal-700">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-charcoal-400 uppercase tracking-wider mb-2.5">
              <ShieldCheck size={13} className="text-gold-600" />
              Quick Demo Logins
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDemoCredentials('Admin')}
                className="py-2.5 px-3 bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 hover:border-gold-500 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <div className="text-xs font-bold text-saffron-700 dark:text-gold-400">
                  Admin & Treasurer
                </div>
                <div className="text-[10px] text-charcoal-400">Web Portal Manager</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('Collector')}
                className="py-2.5 px-3 bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700 hover:border-leaf-600 rounded-xl text-left transition-all hover:scale-[1.02]"
              >
                <div className="text-xs font-bold text-leaf-700 dark:text-leaf-400">
                  Field Collector
                </div>
                <div className="text-[10px] text-charcoal-400">Mobile Field App</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
