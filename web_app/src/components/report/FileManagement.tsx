import { useState, useRef } from 'react';
import {
    Folder,
    FolderOpen,
    ChevronRight,
    FileText,
    Download,
    Eye,
    Search,
    Filter,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    Grid,
    List as ListIcon,
    File as FileIcon,
    Trash2
} from 'lucide-react';
import { FileNode, ValuationReport, ReportFile } from '../../types';
import { formatDate } from '../../utils/formatDate';
import { Modal } from '../common/Modal';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

interface FileManagementProps {
    fileTree: FileNode[];
    reports: ValuationReport[];
    onNavigate: (page: string, reportId?: string) => void;
    onDownload?: (file: ReportFile) => void;
    onUpload?: (reportId: string, files: File[]) => Promise<void>;
    onDelete?: (item: FileNode | ReportFile) => Promise<void>;
}

interface UploadFile {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

export default function FileManagement({ fileTree, reports, onDownload, onUpload, onDelete }: FileManagementProps) {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [previewFile, setPreviewFile] = useState<ReportFile | null>(null);
    const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Upload-related state
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete state
    const [deleteItem, setDeleteItem] = useState<FileNode | ReportFile | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch PDF with authentication when preview file changes
    const handlePreview = async (file: ReportFile) => {
        console.log('🔍 Preview clicked for file:', file);
        setPreviewFile(file);

        // Clean up previous blob URL
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
        }

        try {
            // Fetch the PDF with authentication
            const token = localStorage.getItem('auth_token');
            const apiUrl = `${import.meta.env.VITE_API_BASE_URL}${file.url}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                // console.error('❌ Error response:', errorText);
                // throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);

                // Fallback for non-existent files or other errors
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                setPreviewBlobUrl(blobUrl);
                return;
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            setPreviewBlobUrl(blobUrl);
        } catch (error) {
            console.error('💥 Error loading PDF:', error);
            // const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // alert(`Failed to load PDF preview: ${errorMessage}`);
        }
    };

    // Clean up blob URL when preview closes
    const handleClosePreview = () => {
        if (previewBlobUrl) {
            URL.revokeObjectURL(previewBlobUrl);
            setPreviewBlobUrl(null);
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

    const selectNode = (node: FileNode) => {
        setSelectedNode(node);
    };

    const getFileTypeLabel = (type: string) => {
        switch (type) {
            case 'original':
                return 'Original';
            case 'extracted':
                return 'Extracted';
            case 'draft':
                return 'Draft';
            case 'final':
                return 'Final';
            default:
                return 'File';
        }
    };

    const getFileTypeColor = (type: string) => {
        switch (type) {
            case 'original':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'extracted':
                return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'draft':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'final':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default:
                return 'bg-gray-50 text-gray-700 border-gray-100';
        }
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

    // Check if a node is deletable (Reports or Files only)
    const isDeletable = (node: FileNode) => {
        if (node.type === 'file') return true;
        if (node.type === 'folder' && node.reportId) return true;
        return false;
    };

    const renderTreeNode = (node: FileNode, level: number = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const isSelected = selectedNode?.id === node.id;
        const canDelete = isDeletable(node);

        return (
            <div key={node.id} className="mb-0.5">
                <div
                    className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-200 group ${isSelected
                        ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    style={{ paddingLeft: `${level * 16 + 12}px` }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            toggleNode(node.id);
                        }
                        selectNode(node);
                    }}
                >
                    {node.type === 'folder' && (
                        <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${isSelected ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                            <ChevronRight size={14} strokeWidth={2.5} />
                        </span>
                    )}

                    {node.type === 'folder' ? (
                        <div className={`${isSelected ? 'text-blue-500' : 'text-amber-400 group-hover:text-amber-500'} transition-colors`}>
                            {isExpanded ? <FolderOpen size={18} fill="currentColor" fillOpacity={0.2} /> : <Folder size={18} fill="currentColor" fillOpacity={0.2} />}
                        </div>
                    ) : (
                        <FileText size={18} className={isSelected ? 'text-blue-500' : 'text-gray-400'} />
                    )}

                    <span className={`text-sm truncate font-medium ${isSelected ? 'text-blue-700' : ''} flex-1`}>
                        {node.name}
                    </span>

                    {onDelete && isSelected && canDelete && (
                        <button
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                setDeleteItem(node);
                            }}
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
                {node.type === 'folder' && isExpanded && node.children && (
                    <div className="mt-0.5">
                        {node.children.map((child) => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
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

    const selectedFiles = getSelectedFiles();

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

    // Upload handlers
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            addFilesToUpload(files);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            addFilesToUpload(files);
        }
    };

    const addFilesToUpload = (files: File[]) => {
        const newUploadFiles: UploadFile[] = files.map(file => ({
            file,
            progress: 0,
            status: 'pending' as const,
        }));
        setUploadFiles(prev => [...prev, ...newUploadFiles]);
        setShowUploadModal(true);
    };

    const removeUploadFile = (index: number) => {
        setUploadFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (!selectedNode?.reportId || !onUpload) {
            alert('Please select a report folder to upload files to');
            return;
        }

        const filesToUpload = uploadFiles.filter(f => f.status === 'pending').map(f => f.file);
        if (filesToUpload.length === 0) return;

        try {
            setUploadFiles(prev =>
                prev.map(f =>
                    f.status === 'pending' ? { ...f, status: 'uploading' as const, progress: 50 } : f
                )
            );

            await onUpload(selectedNode.reportId, filesToUpload);

            setUploadFiles(prev =>
                prev.map(f =>
                    f.status === 'uploading' ? { ...f, status: 'success' as const, progress: 100 } : f
                )
            );

            setTimeout(() => {
                setShowUploadModal(false);
                setUploadFiles([]);
            }, 1500);
        } catch (error) {
            setUploadFiles(prev =>
                prev.map(f =>
                    f.status === 'uploading'
                        ? { ...f, status: 'error' as const, error: 'Upload failed' }
                        : f
                )
            );
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-200 z-10">
                <div className="flex justify-between items-center max-w-7xl mx-auto w-full">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            File Management
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 font-medium">Browse and manage your valuation reports</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex max-w-7xl mx-auto w-full overflow-hidden p-6 gap-6">
                {/* Sidebar */}
                <div className="w-80 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative group">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search folders..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                        {fileTree.map((node) => renderTreeNode(node))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                {selectedNode ? (
                                    <>
                                        {selectedNode.type === 'folder' ? <Folder className="text-amber-400" size={20} fill="currentColor" fillOpacity={0.2} /> : <FileText className="text-blue-500" size={20} />}
                                        {selectedNode.name}
                                    </>
                                ) : (
                                    'Overview'
                                )}
                            </h2>
                            {selectedNode && (
                                <p className="text-xs text-gray-500 mt-0.5 ml-7">
                                    {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg mr-2">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <Grid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    <ListIcon size={18} />
                                </button>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                                <Filter size={16} />
                                <span>Filter</span>
                            </button>
                            <button
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <Upload size={16} />
                                <span>Upload</span>
                            </button>
                        </div>
                    </div>

                    {/* Files Area */}
                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30">
                        {selectedFiles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FolderOpen size={32} className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No files found</h3>
                                <p className="text-gray-500 max-w-sm">Select a folder from the sidebar to view its contents, or try searching for a different term.</p>
                            </div>
                        ) : (
                            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                                {selectedFiles.map((file) => {
                                    if (!file) return null;
                                    return (
                                        <div
                                            key={file.id}
                                            className={`group relative bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 ${viewMode === 'grid' ? 'p-5 flex flex-col' : 'p-4 flex items-center gap-4'
                                                }`}
                                        >

                                            {viewMode === 'grid' ? (
                                                <>
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                                            <FileText className="text-blue-600" size={24} />
                                                        </div>
                                                        <span className={`text-[10px] items-center text-center font-bold px-2 py-1 rounded-full border ${getFileTypeColor(file.type)} uppercase tracking-wider`}>
                                                            {getFileTypeLabel(file.type)}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-gray-900 truncate mb-1" title={file.name}>{file.name}</h4>
                                                        <div className="flex items-center text-xs text-gray-500 gap-2">
                                                            <span>{file.size}</span>
                                                            {viewMode === 'grid' && <span>•</span>}
                                                            <span>{formatDate(file.uploadedAt, 'short')}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handlePreview(file);
                                                            }}
                                                            className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <Eye size={16} /> Preview
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDownload(file);
                                                            }}
                                                            className="p-2 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                        {onDelete && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setDeleteItem(file);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                // List View
                                                <>
                                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FileText className="text-blue-600" size={20} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                                                        <div className="col-span-5">
                                                            <h4 className="font-medium text-gray-900 truncate" title={file.name}>{file.name}</h4>
                                                        </div>
                                                        <div className="col-span-3">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFileTypeColor(file.type)} uppercase tracking-wider`}>
                                                                {getFileTypeLabel(file.type)}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-4 text-xs text-gray-500">
                                                            {formatDate(file.uploadedAt, 'short')}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" onClick={() => handlePreview(file)}>
                                                            <Eye size={18} />
                                                        </button>
                                                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" onClick={() => handleDownload(file)}>
                                                            <Download size={18} />
                                                        </button>
                                                        {onDelete && (
                                                            <button
                                                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                                                onClick={() => setDeleteItem(file)}
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Modal
                isOpen={!!previewFile}
                onClose={handleClosePreview}
                title={previewFile?.name || 'File Preview'}
                size="full"
            >
                <div className="h-[80vh] flex flex-col">
                    {previewFile && (
                        <div className="flex-1 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden">
                            {previewBlobUrl ? (
                                <iframe
                                    src={`${previewBlobUrl}#view=FitH`}
                                    className="w-full h-full"
                                    title={previewFile.name}
                                />
                            ) : (
                                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 m-4 max-w-md w-full">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">{previewFile.name}</h3>
                                    <p className="text-gray-500 mb-6 text-sm">
                                        {/* This file was uploaded on {formatDate(previewFile.uploadedAt || new Date())}. */}
                                        Preview not available
                                    </p>
                                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg inline-flex items-center gap-2 text-sm font-medium">
                                        <AlertCircle size={16} />
                                        Preview not available
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Upload Modal */}
            <Modal
                isOpen={showUploadModal}
                onClose={() => {
                    setShowUploadModal(false);
                    setUploadFiles([]);
                }}
                title="Upload Files"
                size="xl"
            >
                <div className="space-y-6">
                    {/* Drag and Drop Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${isDragging
                            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                            }`}
                    >
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload size={32} className="text-blue-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Upload your files
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Drag and drop your files here, or click to browse from your computer.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10 active:scale-95"
                        >
                            Browse Files
                        </button>
                    </div>

                    {/* Selected Files List */}
                    {uploadFiles.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-medium text-gray-900">Selected Files ({uploadFiles.length})</h3>
                                <button className="text-sm text-red-600 hover:text-red-700 font-medium" onClick={() => setUploadFiles([])}>
                                    Clear all
                                </button>
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar p-1">
                                {uploadFiles.map((uploadFile, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                                <FileIcon size={20} className="text-gray-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {uploadFile.file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 pl-3">
                                            {uploadFile.status === 'pending' && (
                                                <button
                                                    onClick={() => removeUploadFile(index)}
                                                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            )}
                                            {uploadFile.status === 'uploading' && (
                                                <div className="w-24">
                                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${uploadFile.progress}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {uploadFile.status === 'success' && (
                                                <CheckCircle size={20} className="text-emerald-500" />
                                            )}
                                            {uploadFile.status === 'error' && (
                                                <AlertCircle size={20} className="text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Upload Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => {
                                setShowUploadModal(false);
                                setUploadFiles([]);
                            }}
                            className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={uploadFiles.length === 0 || uploadFiles.every(f => f.status !== 'pending')}
                            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95"
                        >
                            Upload Files
                        </button>
                    </div>
                </div>
            </Modal>

            <DeleteConfirmModal
                isOpen={!!deleteItem}
                onClose={() => setDeleteItem(null)}
                onConfirm={confirmDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? It will be permanently removed."
                itemName={deleteItem?.name || 'Item'}
                isDeleting={isDeleting}
            />
        </div>
    );
}
