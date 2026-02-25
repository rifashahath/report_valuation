import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, UserPlus, BarChart3, Shield, Zap } from 'lucide-react';

export default function SignupPage() {
    const navigate = useNavigate();
    const { register, loginLoading } = useAuth();

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
            await register({
                first_name: firstName,
                last_name: lastName,
                email,
                password
            });
            toast.success('Account created successfully');
            navigate('/');
        } catch (err: any) {
            toast.error(err.message || 'Failed to create account');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
                {/* Left Side - Branding */}
                <div className="hidden lg:block text-white space-y-8 fade-in">
                    <div className="space-y-4">
                        <h1 className="text-5xl font-black leading-tight tracking-tight">
                            Join the Future of Valuation
                        </h1>
                        <p className="text-xl text-brand-100 font-light max-w-lg">
                            Create your account and start generating precision reports in minutes.
                        </p>
                    </div>

                    <div className="space-y-5 pt-4">
                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10">
                                <BarChart3 className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Smart Automation</h3>
                                <p className="text-brand-200 text-sm">Streamlined data processing workflows</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10">
                                <Shield className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Data Security</h3>
                                <p className="text-brand-200 text-sm">Bank-level encryption and privacy</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 group">
                            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/20 transition-all border border-white/10">
                                <Zap className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Global Access</h3>
                                <p className="text-brand-200 text-sm">Work from anywhere on any device</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Signup Form */}
                <div className="w-full max-w-xl lg:max-w-md mx-auto">
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/20 scale-in scale-95 lg:scale-100">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-6">
                            <h1 className="text-3xl font-black bg-gradient-to-r from-brand-600 to-brand-800 bg-clip-text text-transparent">
                                Valuation System
                            </h1>
                            <p className="text-secondary-600 mt-1 font-medium">Create your professional account</p>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black text-secondary-900 mb-1">Create Account</h2>
                            <p className="text-secondary-500 text-sm font-medium">Get started with your 14-day free trial</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-secondary-700 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        placeholder="John"
                                        className="w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-secondary-900 placeholder-secondary-300 font-medium text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-secondary-700 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        placeholder="Doe"
                                        className="w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-secondary-900 placeholder-secondary-300 font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-secondary-700 ml-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="john.doe@example.com"
                                    className="w-full px-4 py-2.5 border border-secondary-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-secondary-900 placeholder-secondary-300 font-medium text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-secondary-700 ml-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Create a strong password"
                                        className="w-full px-4 py-2.5 pr-12 border border-secondary-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-secondary-900 placeholder-secondary-300 font-medium text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-secondary-700 ml-1">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm your password"
                                        className="w-full px-4 py-2.5 pr-12 border border-secondary-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all text-secondary-900 placeholder-secondary-300 font-medium text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loginLoading}
                                className="w-full bg-gradient-to-br from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-brand-100 transform hover:-translate-y-0.5 mt-6"
                            >
                                {loginLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
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

                        <div className="mt-8 pt-6 border-t border-secondary-100">
                            <p className="text-sm text-secondary-600 text-center font-medium">
                                Already have an account?{' '}
                                <Link to="/login" className="text-brand-600 hover:text-brand-700 font-black hover:underline transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
}
