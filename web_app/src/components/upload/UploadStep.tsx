import { useRef, useState } from 'react';
import {
  Upload as UploadIcon,
  CheckCircle,
  ArrowRight,
  FileText,
  X,
  Download
} from 'lucide-react';
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
  onDownload
}: UploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------- Drag Handlers ---------------- */

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

    if (e.dataTransfer.files?.length) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const processFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(
      (file) =>
        file.type === 'application/pdf' ||
        file.type.startsWith('image/')
    );

    if (validFiles.length) {
      onUpload(validFiles);
    }
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter((f) => f.id !== id));
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-7xl mx-auto px-2 py-1">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          Upload Documents
        </h2>
        <p className="text-slate-500 mt-2">
          Adding files to{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {projectName}
          </span>
        </p>
      </div>

      {/* Layout */}
      <div className="grid lg:grid-cols-[1fr_340px] gap-10">

        {/* ---------------- Main Upload Section ---------------- */}
        <div className="space-y-8">

          {/* Drop Zone */}
          <div
            className={`
    relative border-2 border-dashed rounded-2xl p-8
    transition-all duration-200 cursor-pointer
    flex flex-col items-center justify-center
    ${dragActive
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/30'
              }
  `}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />

            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg mb-4">
              <UploadIcon size={20} className="text-white" />
            </div>

            {/* Text Content */}
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Drop your files here
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Supports PDF and image files • Max 50MB per file
              </p>
            </div>

            {/* Browse Button */}
            <button
              type="button"
              className="mt-6 px-8 py-2.5 rounded-xl font-medium text-sm
      bg-gray-900 dark:bg-white
      text-white dark:text-gray-900
      hover:bg-gray-800 dark:hover:bg-gray-100
      transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Browse Files
            </button>
          </div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { label: 'Multiple Files', icon: FileText },
              { label: 'Secure Upload', icon: CheckCircle },
              { label: 'Auto Processing', icon: UploadIcon }
            ].map((item, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-white dark:bg-slate-900
                border border-slate-200 dark:border-slate-800
                hover:border-blue-400 transition
                flex flex-col items-center gap-3 text-center"
              >
                <item.icon size={28} className="text-blue-500" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- Sidebar ---------------- */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 h-fit">

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Uploaded Files
            </h3>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {files.length}
            </span>
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No files uploaded yet
            </p>
          ) : (
            <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="group flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    <FileText size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate text-slate-900 dark:text-white">
                      {file.name || file.file?.name}
                    </p>
                    <span className="text-xs text-slate-500">
                      {file.fileSize}
                    </span>
                  </div>

                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    {(file.status === 'completed' || file.serverFileId) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownload(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600"
                      >
                        <Download size={14} />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {files.length > 0 && (
            <button
              onClick={onNext}
              className="w-full mt-6 py-3 rounded-lg
              bg-gradient-to-r from-blue-600 to-blue-700
              hover:from-blue-700 hover:to-blue-800
              text-white font-semibold
              flex items-center justify-center gap-2
              shadow-md hover:shadow-lg transition"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
