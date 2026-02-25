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
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
            </div>

            <button
                onClick={onAddClick}
                className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors w-full md:w-auto justify-center"
            >
                <Plus size={16} />
                Add User
            </button>
        </div>
    );
};
