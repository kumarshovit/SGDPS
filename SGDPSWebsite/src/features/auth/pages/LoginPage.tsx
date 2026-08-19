import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../hooks/useAppDispatch';
import { useAppSelector } from '../../../hooks/useAppSelector';
import {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
} from '../api/authApiSlice';
import { setCredentials } from '../slices/authSlice';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ThemeToggle } from '../../../components/ui/ThemeToggle';
import {
  Lock,
  Mail,
  Flame,
  ArrowRight,
  User,
  CheckCircle2,
  ArrowLeft,
  Send,
  AlertCircle,
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');

  const { isAuthenticated, token, user } = useAppSelector((state) => state.auth);
  const storedToken = localStorage.getItem('sgdps_token');
  const storedUser = localStorage.getItem('sgdps_user');
  const navigate = useNavigate();

  useEffect(() => {
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const hasAdminRole = user?.roles?.includes('Admin') || parsedUser?.roles?.includes('Admin');
    if ((isAuthenticated || storedToken || token) && hasAdminRole) {
      navigate('/');
    }
  }, [isAuthenticated, storedToken, token, user, storedUser, navigate]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [login, { isLoading: isLoggingIn }] = useLoginMutation();
  const [register, { isLoading: isRegistering }] = useRegisterMutation();
  const [forgotPassword, { isLoading: isSendingReset }] = useForgotPasswordMutation();

  const dispatch = useAppDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await login({ email, password }).unwrap();

      // Enforce Admin Only Access on Web Portal
      const isAdmin = response.user.roles && response.user.roles.includes('Admin');
      if (!isAdmin) {
        setErrorMsg(
          'Access Denied: Field Collector accounts can only access the SGDPS Mobile App. Only Admin accounts can log into this Web Portal.'
        );
        return;
      }

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

      // Automatically log the new admin user in
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
        res.message || 'A password reset link has been dispatched to your email address. Please check your inbox and click the link to reset your password.'
      );
    } catch (err: any) {
      setErrorMsg(
        err?.data?.detail ||
          err?.data?.message ||
          'Failed to process password reset request.'
      );
    }
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

      {/* Auth Card */}
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/80 dark:bg-charcoal-800/80 backdrop-blur-xl border border-cream-border dark:border-charcoal-700 py-8 px-6 sm:px-8 rounded-3xl shadow-xl space-y-6">
          {/* Segmented Mode Switcher (2 Tabs Only: Sign In & New Admin) */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-cream-100 dark:bg-charcoal-900 rounded-2xl border border-cream-border dark:border-charcoal-700">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login' || mode === 'forgot'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-charcoal-800 text-saffron-700 dark:text-gold-400 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-900 dark:hover:text-cream-50'
              }`}
            >
              New Admin
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-maroon-500/10 border border-maroon-500/30 text-maroon-700 dark:text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-leaf-500/10 border border-leaf-500/30 text-leaf-700 dark:text-leaf-300 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="text-leaf-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. Sign In Form */}
          {mode === 'login' && (
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                label="Email Address *"
                type="email"
                required
                icon={<Mail size={15} />}
                placeholder="admin@sgdps.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <div>
                <Input
                  label="Password *"
                  type="password"
                  required
                  icon={<Lock size={15} />}
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
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-saffron-600 dark:text-gold-400 hover:underline"
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

          {/* 2. New Admin Registration Form */}
          {mode === 'register' && (
            <form className="space-y-3.5" onSubmit={handleRegister}>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="First Name *"
                  required
                  icon={<User size={15} />}
                  placeholder="Amit"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name *"
                  required
                  placeholder="Chatterjee"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <Input
                label="Official Email *"
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
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-gold-800 dark:text-gold-300">
                ⭐ Registering here assigns full <strong>Admin & Treasury Management</strong> access to this web portal.
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-bold"
                isLoading={isRegistering}
                rightIcon={<ArrowRight size={16} />}
              >
                Register & Access Portal
              </Button>
            </form>
          )}

          {/* 3. Forgot Password Form */}
          {mode === 'forgot' && (
            <form className="space-y-4" onSubmit={handleForgotPassword}>
              <div>
                <h3 className="text-sm font-bold text-charcoal-900 dark:text-cream-50">
                  Password Recovery
                </h3>
                <p className="text-xs text-charcoal-500 dark:text-charcoal-400 mt-0.5">
                  Enter your registered admin email address. We will send a secure password reset link directly to your inbox.
                </p>
              </div>

              <Input
                label="Registered Email *"
                type="email"
                required
                icon={<Mail size={15} />}
                placeholder="admin@sgdps.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-sm font-bold"
                isLoading={isSendingReset}
                rightIcon={<Send size={16} />}
              >
                Send Password Reset Link
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-charcoal-500 hover:text-saffron-600 dark:text-charcoal-400 dark:hover:text-gold-400 font-bold transition-colors"
                >
                  <ArrowLeft size={13} /> Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
