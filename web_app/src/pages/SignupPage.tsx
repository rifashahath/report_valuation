import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, UserPlus, BarChart3, Shield, Zap, Sun, Moon } from 'lucide-react';
import { useAppContext } from '../app/providers';

export default function SignupPage() {
    const navigate = useNavigate();
    const { register, loginLoading } = useAuth();
    const { theme, toggleTheme } = useAppContext();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            await register({ first_name: firstName, last_name: lastName, email, password });
            toast.success('Account created successfully');
            navigate('/');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create account');
        }
    };

    const inputClass = "w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-500/15 focus:border-brand-500 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-medium text-sm bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-700/80";
    const labelClass = "block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest ml-1";

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-700 via-brand-800 to-secondary-900 dark:from-slate-950 dark:via-slate-900 dark:to-secondary-950 p-4 relative overflow-hidden">
            {/* Animated Background Blobs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400 dark:bg-brand-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-blob" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500 dark:bg-indigo-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-2000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-300 dark:bg-brand-800 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 dark:opacity-10 animate-blob animation-delay-4000" />
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 dark:bg-slate-800/80 backdrop-blur-md border border-white/20 dark:border-slate-700 text-white/80 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-slate-700 transition-all shadow-lg"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                <span className="relative w-4 h-4">
                    <Moon size={16} className={`absolute inset-0 transition-all duration-300 ${theme === 'light' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                    <Sun size={16} className={`absolute inset-0 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                </span>
                <span className="text-xs font-semibold hidden sm:block">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Side — Branding */}
                <div className="hidden lg:flex flex-col gap-10 text-white">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-sm font-semibold text-white/80 mb-2">
                            <span className="w-2 h-2 bg-brand-300 rounded-full animate-pulse" />
                            Join 500+ Valuators
                        </div>
                        <h1 className="text-5xl font-black leading-tight tracking-tight">
                            Join the Future<br />of Valuation
                        </h1>
                        <p className="text-xl text-white/70 font-light max-w-lg leading-relaxed">
                            Create your account and start generating precision reports in minutes.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {[
                            { icon: <BarChart3 size={20} />, title: 'Smart Automation', desc: 'Streamlined data processing workflows' },
                            { icon: <Shield size={20} />, title: 'Data Security', desc: 'Bank-level encryption and privacy' },
                            { icon: <Zap size={20} />, title: 'Global Access', desc: 'Work from anywhere on any device' },
                        ].map(feature => (
                            <div key={feature.title} className="flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10 flex-shrink-0 shadow-lg">
                                    {feature.icon}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base">{feature.title}</h3>
                                    <p className="text-white/60 text-sm">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4">
                        {[['500+', 'Valuators'], ['10k+', 'Reports'], ['99.9%', 'Uptime']].map(([val, label]) => (
                            <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                <p className="text-2xl font-black">{val}</p>
                                <p className="text-white/50 text-xs font-semibold mt-1">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side — Signup Form */}
                <div className="w-full max-w-xl lg:max-w-md mx-auto">
                    <div className="bg-white dark:bg-slate-900 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/30 dark:border-slate-700/50 animate-scale-in">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-5">
                            <div className="w-12 h-12 bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-xl shadow-brand-500/20">
                                <span className="text-white font-black text-xl">V</span>
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Valuation System</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">Create your professional account</p>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Create Account</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Get started with your free account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className={labelClass}>First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="John"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className={labelClass}>Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelClass}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="john.doe@example.com"
                                    className={inputClass}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelClass}>Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Create a strong password"
                                        className={inputClass + ' pr-12'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className={labelClass}>Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        className={inputClass + ' pr-12'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-brand-500/25 hover:shadow-brand-500/40 transform hover:-translate-y-0.5 mt-6"
                            >
                                {loginLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={20} />
                                        Create Account
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
                                Already have an account?{' '}
                                <Link to="/login" className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-black hover:underline transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
