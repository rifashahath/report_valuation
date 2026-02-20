import { useRef, useState } from 'react';
import { Plus, Trash2, FileText, ChevronUp, ChevronDown, X, BarChart3, ArrowRight, Download } from 'lucide-react';
import { UploadedFile } from './types';

interface FileSelectionStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    setSelectedFiles: (ids: string[]) => void;
    onFilesChange: (files: UploadedFile[]) => void; // needed for Add More
    onBack: () => void;
    onNext: () => void;
    onUpload: (files: File[]) => void;
    onDownload: (file: UploadedFile) => void;
}

export default function FileSelectionStep({
    files,
    selectedFiles,
    setSelectedFiles,
    onFilesChange,
    onBack,
    onNext,
    onUpload,
    onDownload
}: FileSelectionStepProps) {
    const [expandedFile, setExpandedFile] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };



    const toggleFileSelection = (id: string) => {
        setSelectedFiles(
            selectedFiles.includes(id)
                ? selectedFiles.filter((fileId) => fileId !== id)
                : [...selectedFiles, id]
        );
    };

    const selectAllFiles = () => {
        setSelectedFiles(selectedFiles.length === files.length ? [] : files.map((file) => file.id));
    };

    const removeFile = (id: string) => {
        const newFiles = files.filter(f => f.id !== id);
        onFilesChange(newFiles);
        // Also remove from selection if present
        if (selectedFiles.includes(id)) {
            setSelectedFiles(selectedFiles.filter(fid => fid !== id));
        }
    };

    const clearAllFiles = () => {
        setSelectedFiles([]);
    };

    const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
                .filter(file => file.type === 'application/pdf');

            // Trigger upload
            onUpload(newFiles);

            // We should auto-select these files when they appear in the list.
            // Since we don't have their IDs yet (generated in parent), we rely on parent to update 'selectedFiles'.

            e.target.value = '';
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary-900">Select Files to Process</h2>
                        <p className="text-secondary-500 mt-1">Choose which documents to analyze</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="text-secondary-500 hover:text-secondary-700 px-4 py-2 rounded-xl font-medium transition-colors hover:bg-secondary-50"
                        >
                            Back
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white border border-secondary-200 hover:border-brand-300 hover:text-brand-600 text-secondary-700 px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-all shadow-sm hover:shadow"
                        >
                            <Plus size={18} />
                            Add More
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            onChange={handleAddMore}
                            className="hidden"
                            multiple
                        />
                    </div>
                </div>

                <div className="mb-6 p-4 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedFiles.length === files.length && files.length > 0}
                                onChange={selectAllFiles}
                                className="rounded border-secondary-300 text-brand-600 focus:ring-brand-500 w-5 h-5"
                            />
                            <span className="font-medium text-secondary-900">Select All Files</span>
                        </label>
                        <span className="text-sm text-secondary-600">
                            ({selectedFiles.length} of {files.length} selected)
                        </span>
                    </div>
                    <button
                        onClick={clearAllFiles}
                        className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                        <Trash2 size={16} />
                        Clear Selection
                    </button>
                </div>

                <div className="space-y-3 mb-6 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                    {files.map((file) => (
                        <div
                            key={file.id}
                            className={`p-4 border rounded-xl transition-all cursor-pointer group ${selectedFiles.includes(file.id)
                                ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                                : 'border-secondary-100 hover:border-brand-200 hover:bg-secondary-50'
                                }`}
                            onClick={() => toggleFileSelection(file.id)}
                        >
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedFiles.includes(file.id)}
                                    onChange={() => { }}
                                    className="rounded border-secondary-300 text-brand-600 focus:ring-brand-500 w-5 h-5"
                                />
                                <FileText size={24} className="text-brand-600" />
                                <div className="flex-1">
                                    <p className="font-medium text-secondary-900">{file.file.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-secondary-600">
                                        <span>{file.fileSize} • {formatDate(file.uploadDate)}</span>
                                        {file.status === 'pending' && (
                                            <span className="text-blue-600 font-medium text-xs">Pending Upload</span>
                                        )}
                                        {file.status === 'uploading' && (
                                            <span className="text-brand-600 font-medium text-xs">Uploading...</span>
                                        )}
                                        {file.status === 'error' && (
                                            <span className="text-red-600 font-medium text-xs">Error</span>
                                        )}
                                    </div>
                                    {/* Progress bar for this file */}
                                    {file.status === 'uploading' && (
                                        <div className="w-full h-1 bg-secondary-100 rounded-full mt-1 overflow-hidden">
                                            <div
                                                className="h-full bg-brand-600 transition-all duration-300"
                                                style={{ width: `${file.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center">
                                    {(file.status === 'completed' || file.serverFileId) && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownload(file);
                                            }}
                                            className="text-secondary-400 hover:text-brand-600 p-2"
                                            title="Download"
                                        >
                                            <Download size={20} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedFile(expandedFile === file.id ? null : file.id);
                                        }}
                                        className="text-secondary-400 hover:text-secondary-600 p-2"
                                    >
                                        {expandedFile === file.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(file.id);
                                        }}
                                        className="text-secondary-400 hover:text-red-500 p-2"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {expandedFile === file.id && (
                                <div className="mt-4 pt-4 border-t border-secondary-200">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-secondary-500 font-medium">File Name</p>
                                            <p className="text-secondary-900">{file.file.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-500 font-medium">Size</p>
                                            <p className="text-secondary-900">{file.fileSize}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-500 font-medium">Upload Date</p>
                                            <p className="text-secondary-900">{formatDate(file.uploadDate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-secondary-500 font-medium">Type</p>
                                            <p className="text-secondary-900">PDF Document</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-secondary-100 relative z-10">
                    <div className="text-sm text-secondary-500">
                        <span className="font-bold text-secondary-900">{selectedFiles.length}</span> files
                        selected for processing
                    </div>
                    <button
                        onClick={onNext}
                        disabled={selectedFiles.length === 0}
                        className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 disabled:from-secondary-300 disabled:to-secondary-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <BarChart3 size={24} />
                        Import & Analyze Files
                        <ArrowRight size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
}
