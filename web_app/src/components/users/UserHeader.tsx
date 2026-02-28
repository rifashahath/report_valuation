import React from 'react';
import { Users, Shield, UserPlus } from 'lucide-react';

interface UserHeaderProps {
    totalUsers: number;
    rolesCount: number;
    adminsCount: number;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
    totalUsers,
    rolesCount,
    adminsCount,
}) => {
    return (
        <div>
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">People</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your team members and their permissions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-white dark:bg-night-900 rounded-2xl border border-brand-100 dark:border-night-800 p-6 shadow-lg hover:shadow-xl hover:shadow-brand-200/40 dark:shadow-none dark:hover:shadow-brand-900/10 transition-all duration-500 relative overflow-hidden flex items-center justify-between isolate">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Users</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalUsers}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Users size={24} />
                    </div>
                </div>

                <div className="group bg-white dark:bg-night-900 rounded-2xl border border-brand-100 dark:border-night-800 p-6 shadow-lg hover:shadow-xl hover:shadow-brand-200/40 dark:shadow-none dark:hover:shadow-brand-900/10 transition-all duration-500 relative overflow-hidden flex items-center justify-between isolate">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Active Roles</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{rolesCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <Shield size={24} />
                    </div>
                </div>

                <div className="group bg-white dark:bg-night-900 rounded-2xl border border-brand-100 dark:border-night-800 p-6 shadow-lg hover:shadow-xl hover:shadow-brand-200/40 dark:shadow-none dark:hover:shadow-brand-900/10 transition-all duration-500 relative overflow-hidden flex items-center justify-between isolate">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Administrators</p>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{adminsCount}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <UserPlus size={24} />
                    </div>
                </div>
            </div>
        </div>
    );
};
