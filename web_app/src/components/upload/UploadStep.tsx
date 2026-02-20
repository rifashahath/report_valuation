import { useRef, useState } from 'react';
import { Upload as UploadIcon, CheckCircle, ArrowRight, FileText, X, Download } from 'lucide-react';
import { UploadedFile } from './types';

interface UploadStepProps {
    projectName: string;
    files: UploadedFile[];
    onFilesChange: (files: UploadedFile[]) => void;
    onUpload: (files: File[]) => void;
    onNext: () => void;
    onBack: () => void;
    onDownload: (file: UploadedFile) => void;
}

export default function UploadStep({
    projectName,
    files,
    onFilesChange,
    onUpload,
    onNext,
    onBack,
    onDownload
}: UploadStepProps) {
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);



    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
            e.target.value = '';
        }
    };

    const processFiles = (fileList: FileList) => {
        const newFiles = Array.from(fileList)
            .filter((file) => file.type === 'application/pdf');

        if (newFiles.length > 0) {
            onUpload(newFiles);

            // Auto-advance logic if needed, but safer to let user see upload progress first
            if (files.length + newFiles.length > 0) {
                // setTimeout(() => onNext(), 1500); 
            }
        }
    };

    const removeFile = (id: string) => {
        onFilesChange(files.filter((file) => file.id !== id));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8 overflow-hidden relative">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none" />

                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-secondary-900">Upload Documents</h2>
                        <p className="text-secondary-600 mt-1">
                            Project: <span className="font-semibold">{projectName}</span>
                        </p>
                    </div>
                    <button onClick={onBack} className="text-sm text-secondary-600 hover:text-secondary-900">
                        Change Project Name
                    </button>
                </div>

                <div
                    className={`border-3 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${dragActive
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-secondary-300 bg-secondary-50 hover:bg-secondary-100'
                        }`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileInput}
                        className="hidden"
                        multiple
                    />
                    <div className="p-6 bg-gradient-to-br from-brand-600 to-brand-800 rounded-full inline-flex items-center justify-center mb-6">
                        <UploadIcon size={40} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-secondary-900 mb-3">Drop PDF Files Here</h3>
                    <p className="text-secondary-600 mb-6 text-lg">or click to browse from your computer</p>
                    <div className="flex items-center justify-center gap-6 text-sm text-secondary-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Multiple PDFs</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Max 50MB each</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle size={18} className="text-green-500" />
                            <span>Tamil supported</span>
                        </div>
                    </div>
                </div>
            </div>

            {files.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-secondary-900 flex items-center gap-2">
                            <span className="bg-brand-100 text-brand-700 px-2 py-1 rounded text-sm">
                                {files.length}
                            </span>
                            Uploaded Files
                        </h3>
                        <button
                            onClick={onNext}
                            className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            Continue
                            <ArrowRight size={20} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <FileText size={20} className="text-brand-600" />
                                    <div className="flex-1">
                                        <p className="font-medium text-secondary-900">{file.file.name}</p>
                                        <div className="flex items-center gap-3">
                                            <p className="text-sm text-secondary-500 font-medium bg-secondary-50 px-2 py-0.5 rounded border border-secondary-100">{file.fileSize}</p>
                                            {file.status === 'pending' && (
                                                <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                                    Pending Upload
                                                </span>
                                            )}
                                            {file.status === 'uploading' && (
                                                <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                                                    Uploading... {file.progress}%
                                                </span>
                                            )}
                                            {file.status === 'completed' && (
                                                <span className="text-xs text-green-700 font-bold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-100">
                                                    <CheckCircle size={12} className="text-green-600" /> Uploaded
                                                </span>
                                            )}
                                            {file.status === 'error' && (
                                                <span className="text-xs text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-100">Upload Failed</span>
                                            )}
                                        </div>
                                        {file.status === 'uploading' && (
                                            <div className="w-full h-1 bg-secondary-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-brand-600 transition-all duration-300"
                                                    style={{ width: `${file.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
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
                                            removeFile(file.id);
                                        }}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                        title="Remove"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
