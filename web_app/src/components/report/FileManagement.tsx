import { useState } from 'react';
import { Filter } from 'lucide-react';
import { FileNode, ValuationReport, ReportFile } from '../../types';
import FileSidebar from './file-manager/FileSidebar';
import FileList from './file-manager/FileList';
import FilePreviewModal from './file-manager/FilePreviewModal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';
import reportsApi from '../../apis/report.api';

interface FileManagementProps {
    fileTree: FileNode[];
    reports: ValuationReport[];
    onDownload?: (file: ReportFile) => void;
    onDelete?: (file: ReportFile) => Promise<void>;
}

export default function FileManagement({
    fileTree,
    reports,
    onDownload,
    onDelete,
}: FileManagementProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [deleteItem, setDeleteItem] = useState<ReportFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Actions ---

    const handlePreview = async (file: ReportFile) => {
        if (file.url && file.url.includes('/api/')) {
            try {
                const blob = await reportsApi.downloadFile(file.id);
                const blobUrl = URL.createObjectURL(blob);
                setPreviewFile({ ...file, url: blobUrl });
            } catch (error) {
                console.error('Error fetching preview:', error);
                setPreviewFile(file); // Fallback to showing metadata
            }
        } else {
            setPreviewFile(file);
        }
    };

    const handleClosePreview = () => {
        if (previewFile?.url && previewFile.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewFile.url);
        }
        setPreviewFile(null);
    };

    const toggleNode = (nodeId: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(nodeId)) {
            newExpanded.delete(nodeId);
        } else {
            newExpanded.add(nodeId);
        }
        setExpandedNodes(newExpanded);
    };

    const confirmDelete = async () => {
        if (!deleteItem || !onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(deleteItem);
            setDeleteItem(null);
        } catch (error) {
            console.error('Delete failed:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const getSelectedFiles = () => {
        if (!selectedNode) return [];

        if (selectedNode.type === 'file' && selectedNode.reportId) {
            const report = reports.find((r) => r.id === selectedNode.reportId);
            return report ? [report.files.find((f) => f.id === selectedNode.id)].filter(Boolean) : [];
        }

        if (selectedNode.type === 'folder' && selectedNode.children) {
            const files = selectedNode.children
                .filter((child) => child.type === 'file' && child.reportId)
                .map((child) => {
                    const report = reports.find((r) => r.id === child.reportId);
                    return report?.files.find((f) => f.id === child.id);
                })
                .filter(Boolean);
            return files;
        }

        return [];
    };

    const handleDownload = (file: ReportFile) => {
        if (onDownload) {
            onDownload(file);
            return;
        }

        if (file.url && file.url !== '#') {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert(`Downloading ${file.name} is not available in demo mode (simulated)`);
        }
    };

    const selectedFiles = getSelectedFiles();

    // TODO: Re-implement drag & drop and upload logic in the future or move to a separate component

    return (
        <div className="h-screen flex flex-col">
            <div className="p-8 border-b border-gray-200 bg-white">
                <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
                <p className="text-gray-600 mt-2">Browse and manage valuation reports</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <FileSidebar
                    fileTree={fileTree}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    expandedNodes={expandedNodes}
                    onToggleNode={toggleNode}
                    selectedNode={selectedNode}
                    onSelectNode={setSelectedNode}
                />

                {/* Main Content */}
                <div className="flex-1 bg-gray-50 overflow-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {selectedNode ? selectedNode.name : 'Select a folder or file'}
                                </h2>
                                {selectedNode && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        {selectedNode.type === 'folder' ? 'Folder' : 'File'} • {selectedFiles.length} items
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setViewMode(m => m === 'grid' ? 'list' : 'grid')}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors"
                            >
                                <Filter size={16} />
                                <span className="text-sm font-medium">
                                    {viewMode === 'grid' ? 'List View' : 'Grid View'}
                                </span>
                            </button>
                        </div>

                        <FileList
                            files={selectedFiles as ReportFile[]}
                            viewMode={viewMode}
                            onPreview={handlePreview}
                            onDownload={handleDownload}
                            onDelete={onDelete ? (file) => setDeleteItem(file) : undefined}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <FilePreviewModal
                file={previewFile}
                isOpen={!!previewFile}
                onClose={handleClosePreview}
                onDownload={handleDownload}
            />

            {deleteItem && (
                <DeleteConfirmModal
                    isOpen={!!deleteItem}
                    onClose={() => setDeleteItem(null)}
                    onConfirm={confirmDelete}
                    title="Delete File"
                    message="Are you sure you want to delete this file?"
                    itemName={deleteItem.name}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
}
