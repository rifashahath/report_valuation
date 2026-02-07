
import { AlertTriangle } from 'lucide-react';
import { User } from '../../types/User';
import { Modal } from '../common/Modal';

interface DeleteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    user: User | null;
    isLoading: boolean;
}

export function DeleteUserModal({
    isOpen,
    onClose,
    onConfirm,
    user,
    isLoading,
}: DeleteUserModalProps) {
    if (!user) return null;

    const footer = (
        <>
            <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
                Cancel
            </button>
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Deleting...
                    </>
                ) : (
                    'Delete User'
                )}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Delete User"
            size="sm"
            footer={footer}
        >
            <div className="flex flex-col items-center text-center p-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Delete {user.first_name} {user.last_name}?
                </h3>
                <p className="text-sm text-gray-500">
                    Are you sure you want to delete this user? This action cannot be undone and will remove all their access to the system.
                </p>
            </div>
        </Modal>
    );
}
