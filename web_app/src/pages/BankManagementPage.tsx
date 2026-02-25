import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { banksApi, Bank } from '../apis/bank.api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Building2, Search } from 'lucide-react';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

export default function BankManagementPage() {
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
    const [bankName, setBankName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: banks, isLoading } = useQuery({
        queryKey: ['banks'],
        queryFn: banksApi.getBanks,
    });

    const createBankMutation = useMutation({
        mutationFn: banksApi.createBank,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank added successfully');
            closeModals();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add bank');
        },
    });

    const updateBankMutation = useMutation({
        mutationFn: ({ id, name }: { id: string; name: string }) => banksApi.updateBank(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank updated successfully');
            closeModals();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update bank');
        },
    });

    const deleteBankMutation = useMutation({
        mutationFn: banksApi.deleteBank,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['banks'] });
            toast.success('Bank deleted successfully');
            closeModals();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete bank');
        },
    });

    const closeModals = () => {
        setIsAddModalOpen(false);
        setIsEditModalOpen(false);
        setIsDeleteModalOpen(false);
        setBankName('');
        setSelectedBank(null);
    };

    const handleAdd = () => {
        if (!bankName.trim()) return;
        createBankMutation.mutate(bankName);
    };

    const handleUpdate = () => {
        if (!selectedBank || !bankName.trim()) return;
        updateBankMutation.mutate({ id: selectedBank.id, name: bankName });
    };

    const handleDelete = () => {
        if (!selectedBank) return;
        deleteBankMutation.mutate(selectedBank.id);
    };

    const filteredBanks = banks?.filter(bank =>
        bank.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50 p-8">
            <div className="container mx-auto max-w-6xl">
                {/* Header */}
                <div className="flex justify-between items-end mb-10 fade-in">
                    <div>
                        <h1 className="text-4xl font-black text-secondary-900 mb-2 tracking-tight">Bank Management</h1>
                        <p className="text-lg text-secondary-500 font-medium">Manage the list of banks available for reports</p>
                    </div>
                    <Button
                        onClick={() => setIsAddModalOpen(true)}
                        className="shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all h-12 px-6 text-base font-bold"
                    >
                        <Plus size={20} className="mr-2" />
                        Add Bank
                    </Button>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-secondary-200 overflow-hidden fade-in">
                    {/* Search Bar */}
                    <div className="p-6 border-b border-secondary-200 bg-gradient-to-r from-white to-gray-50">
                        <div className="relative max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search banks..."
                                className="w-full pl-12 pr-4 py-3 border border-secondary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-secondary-50/50 text-secondary-700 font-bold text-sm border-b border-secondary-200">
                                    <th className="px-8 py-4 uppercase tracking-widest font-black">Bank Name</th>
                                    <th className="px-8 py-4 w-40 text-right uppercase tracking-widest font-black">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100">
                                {filteredBanks.length === 0 ? (
                                    <tr>
                                        <td colSpan={2} className="px-8 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-secondary-100 rounded-xl flex items-center justify-center mb-4">
                                                    <Building2 className="h-8 w-8 text-secondary-400" />
                                                </div>
                                                <p className="text-secondary-600 font-medium">No banks found</p>
                                                <p className="text-sm text-secondary-500 mt-1">Add a bank to get started</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBanks.map((bank, index) => (
                                        <tr
                                            key={bank.id}
                                            className="hover:bg-brand-50/20 transition-all duration-300 group cursor-default border-b border-secondary-100 last:border-0"
                                            style={{ animationDelay: `${index * 30}ms` }}
                                        >
                                            <td className="px-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform duration-300">
                                                        <Building2 size={24} />
                                                    </div>
                                                    <span className="text-lg font-bold text-secondary-900 group-hover:text-brand-700 transition-colors">{bank.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBank(bank);
                                                            setBankName(bank.name);
                                                            setIsEditModalOpen(true);
                                                        }}
                                                        className="p-2.5 text-secondary-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all duration-300 hover:shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={20} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedBank(bank);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="p-2.5 text-secondary-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 hover:shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add Modal */}
                <Modal
                    isOpen={isAddModalOpen}
                    onClose={closeModals}
                    title="Add New Bank"
                    size="sm"
                    footer={
                        <>
                            <Button variant="outline" onClick={closeModals}>Cancel</Button>
                            <Button onClick={handleAdd} isLoading={createBankMutation.isPending}>Add Bank</Button>
                        </>
                    }
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. HDFC Bank"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={closeModals}
                    title="Edit Bank"
                    size="sm"
                    footer={
                        <>
                            <Button variant="outline" onClick={closeModals}>Cancel</Button>
                            <Button onClick={handleUpdate} isLoading={updateBankMutation.isPending}>Save Changes</Button>
                        </>
                    }
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g. HDFC Bank"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </Modal>

                {/* Delete Modal */}
                <Modal
                    isOpen={isDeleteModalOpen}
                    onClose={closeModals}
                    title="Delete Bank"
                    size="sm"
                    footer={
                        <>
                            <Button variant="outline" onClick={closeModals}>Cancel</Button>
                            <Button variant="danger" onClick={handleDelete} isLoading={deleteBankMutation.isPending}>Delete</Button>
                        </>
                    }
                >
                    <p className="text-gray-600">
                        Are you sure you want to delete <span className="font-semibold">{selectedBank?.name}</span>?
                        This action cannot be undone.
                    </p>
                </Modal>
            </div>
        </div>
    );
}

