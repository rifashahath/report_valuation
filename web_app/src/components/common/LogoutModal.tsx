
import { Modal } from './Modal';
import { Button } from './Button';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}

export function LogoutModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}: LogoutModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirm Logout"
            size="sm"
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
                        Logout
                    </Button>
                </>
            }
        >
            <p className="text-gray-600">Are you sure you want to log out?</p>
        </Modal>
    );
}
