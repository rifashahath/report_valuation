import React from 'react';
import { Search, Plus } from 'lucide-react';

interface UserActionBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onAddClick: () => void;
}

export const UserActionBar: React.FC<UserActionBarProps> = ({
    searchTerm,
    onSearchChange,
    onAddClick,
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-night-900 border border-brand-200 dark:border-night-800 rounded-xl text-base focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none shadow-sm transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                />
            </div>

            <button
                onClick={onAddClick}
                className="flex items-center gap-2 bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-800 hover:to-brand-950 dark:from-brand-600 dark:to-brand-800 text-white px-6 py-2.5 rounded-xl text-base font-bold shadow-lg shadow-brand-300/40 dark:shadow-brand-900/20 transition-all hover:-translate-y-0.5 w-full md:w-auto justify-center"
            >
                <Plus size={16} />
                Add User
            </button>
        </div>
    );
};
