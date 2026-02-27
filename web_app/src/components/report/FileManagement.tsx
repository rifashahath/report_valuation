import { useState, useCallback } from 'react';
import { Filter, CheckCircle2, AlertCircle } from 'lucide-react';
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
    /** Optional: called when a file is moved to a new folder (backend sync) */
    onMoveFile?: (fileId: string, targetNode: FileNode) => Promise<void>;
}

interface Toast {
    id: number;
    type: 'success' | 'error';
    message: string;
}

export default function FileManagement({
    fileTree: propFileTree,
    reports,
    onDownload,
    onDelete,
    onMoveFile,
}: FileManagementProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [deleteItem, setDeleteItem] = useState<ReportFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [draggedFile, setDraggedFile] = useState<ReportFile | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Local file tree state so we can mutate it on drag & drop without a full refetch
    const [localFileTree, setLocalFileTree] = useState<FileNode[]>(propFileTree);

    // Keep local tree in sync when prop changes (e.g. after data refetch)
    const [prevPropFileTree, setPrevPropFileTree] = useState<FileNode[]>(propFileTree);
    if (propFileTree !== prevPropFileTree) {
        setPrevPropFileTree(propFileTree);
        setLocalFileTree(propFileTree);
    }

    // --- Toast helpers ---

    const showToast = (type: 'success' | 'error', message: string) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, type, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
    };

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

    /** Recursively move a file node from one folder to another inside the tree */
    const moveFileInTree = useCallback(
        (tree: FileNode[], fileId: string, targetFolderId: string): { tree: FileNode[]; movedNode: FileNode | null } => {
            let movedNode: FileNode | null = null;

            const removeFile = (nodes: FileNode[]): FileNode[] => {
                return nodes.reduce<FileNode[]>((acc, node) => {
                    if (node.type === 'file' && node.id === fileId) {
                        movedNode = node;
                        // skip — removing from source
                        return acc;
                    }
                    if (node.children) {
                        return [...acc, { ...node, children: removeFile(node.children) }];
                    }
                    return [...acc, node];
                }, []);
            };

            const addFile = (nodes: FileNode[], fileNode: FileNode): FileNode[] => {
                return nodes.map((node) => {
                    if (node.id === targetFolderId && node.type === 'folder') {
                        return {
                            ...node,
                            children: [...(node.children || []), fileNode]
                        };
                    }
                    if (node.children) {
                        return { ...node, children: addFile(node.children, fileNode) };
                    }
                    return node;
                });
            };

            const treeWithoutFile = removeFile(tree);
            if (!movedNode) return { tree, movedNode: null };

            const finalTree = addFile(treeWithoutFile, movedNode);
            return { tree: finalTree, movedNode };
        },
        []
    );

    const handleDropFile = useCallback(
        async (fileId: string, targetFolderNode: FileNode) => {
            // Don't allow dropping onto the same folder
            const currentFolderHasFile = selectedNode?.children?.some((c) => c.id === fileId);
            if (selectedNode?.id === targetFolderNode.id && currentFolderHasFile) return;

            // Optimistic UI update
            const { tree: updatedTree, movedNode } = moveFileInTree(localFileTree, fileId, targetFolderNode.id);
            if (!movedNode) {
                showToast('error', 'Could not move file — file not found in tree.');
                return;
            }

            setLocalFileTree(updatedTree);
            showToast('success', `"${movedNode.name}" moved to "${targetFolderNode.name}"`);

            // Sync to backend if handler provided
            if (onMoveFile) {
                try {
                    await onMoveFile(fileId, targetFolderNode);
                } catch (err) {
                    // Rollback on failure
                    setLocalFileTree(localFileTree);
                    showToast('error', `Failed to move "${movedNode.name}". Changes reverted.`);
                }
            }
        },
        [localFileTree, moveFileInTree, onMoveFile, selectedNode]
    );

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

    return (
        <div className="h-screen flex flex-col">
            <div className="p-8 border-b border-gray-200 bg-white">
                <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
                <p className="text-gray-600 mt-2">Browse and manage valuation reports</p>
                {draggedFile && (
                    <p className="text-xs text-blue-500 mt-1 animate-pulse">
                        📂 Dragging <strong>"{draggedFile.name}"</strong> — drop onto a folder in the sidebar to move it
                    </p>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <FileSidebar
                    fileTree={localFileTree}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    expandedNodes={expandedNodes}
                    onToggleNode={toggleNode}
                    selectedNode={selectedNode}
                    onSelectNode={setSelectedNode}
                    onDropFile={handleDropFile}
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
                            onDragStart={setDraggedFile}
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

            {/* Toast Notifications */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto
                            text-sm font-medium transition-all duration-300 animate-slide-up
                            ${toast.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                            }
                        `}
                    >
                        {toast.type === 'success'
                            ? <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                            : <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                        }
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
