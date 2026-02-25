import React from 'react';
import { Users, Edit2, Trash2, Plus } from 'lucide-react';
import { User } from '../../types/User';

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    searchTerm: string;
    onEdit: (user: User) => void;
    onDelete: (userId: string) => void;
    onAddClick: () => void;
}

export const UserTable: React.FC<UserTableProps> = ({
    users,
    isLoading,
    searchTerm,
    onEdit,
    onDelete,
    onAddClick,
}) => {
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Loading users...</p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <div className="h-12 w-12 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">
                    {searchTerm ? 'No matching users found' : 'No users yet'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                    {searchTerm ? 'Try a different search term' : 'Get started by adding your first user'}
                </p>
                {!searchTerm && (
                    <button
                        onClick={onAddClick}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                    >
                        <Plus size={16} />
                        Add First User
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                User
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Role
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 font-medium text-sm">
                                            {user.first_name?.[0]?.toUpperCase()}
                                            {user.last_name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {user.first_name} {user.last_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role) => (
                                                <span
                                                    key={role}
                                                    className={`px-2.5 py-1 text-xs font-medium rounded-full border ${role === 'admin'
                                                        ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                                                        : 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                                                        }`}
                                                >
                                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400">No roles</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                            title="Edit user"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(user.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Delete user"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
