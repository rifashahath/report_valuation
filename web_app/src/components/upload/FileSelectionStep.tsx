import { useRef, useState } from 'react';
import { Plus, Trash2, FileText, ChevronUp, ChevronDown, X, BarChart3, ArrowRight, Download } from 'lucide-react';
import { UploadedFile } from './types';

interface FileSelectionStepProps {
  files: UploadedFile[];
  selectedFiles: string[];
  setSelectedFiles: (ids: string[]) => void;
  onFilesChange: (files: UploadedFile[]) => void;
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
        .filter(file =>
          file.type === 'application/pdf' ||
          file.type.startsWith('image/')
        );
      onUpload(newFiles);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-1 py-1">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileText size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Select Files
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Choose which documents to analyze
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 
                                    hover:text-blue-600 dark:hover:text-blue-400
                                    border border-gray-200 dark:border-gray-700 rounded-lg
                                    hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Back
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2 text-sm font-medium
                                    bg-white dark:bg-gray-800
                                    text-gray-700 dark:text-gray-200
                                    border border-gray-200 dark:border-gray-700 rounded-lg
                                    hover:bg-gray-50 dark:hover:bg-gray-700
                                    flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Add More
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleAddMore}
                className="hidden"
                multiple
              />
            </div>
          </div>
        </div>

        {/* Selection Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedFiles.length === files.length && files.length > 0}
                  onChange={selectAllFiles}
                  className="rounded border-gray-300 dark:border-gray-600 
                                        text-blue-600 focus:ring-blue-500 
                                        w-4 h-4 transition"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select All
                </span>
              </label>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedFiles.length} of {files.length} selected
              </span>
            </div>
            {selectedFiles.length > 0 && (
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 
                                    flex items-center gap-1.5 transition"
              >
                <Trash2 size={14} />
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Files List */}
        <div className="p-6">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 
                                flex items-center justify-center mb-4">
                <FileText size={24} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                No files uploaded
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add files to get started with analysis
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 text-sm font-medium
                                    bg-blue-600 hover:bg-blue-700
                                    text-white rounded-lg
                                    flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Upload Files
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className={`border rounded-lg transition-all cursor-pointer
                                        ${selectedFiles.includes(file.id)
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                >
                  {/* File Row */}
                  <div
                    className="flex items-center gap-3 p-3"
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => { }}
                      className="rounded border-gray-300 dark:border-gray-600 
                                                text-blue-600 focus:ring-blue-500 
                                                w-4 h-4 transition"
                    />

                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                            ${selectedFiles.includes(file.id)
                        ? 'bg-blue-100 dark:bg-blue-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                      <FileText size={18} className={
                        selectedFiles.includes(file.id)
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      } />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name || file.file?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {file.fileSize}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(file.uploadDate)}
                        </span>
                        {file.status === 'uploading' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                            Uploading...
                          </span>
                        )}
                        {file.status === 'error' && (
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Error
                          </span>
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
                          className="p-1.5 rounded-lg text-gray-400 
                                                        hover:text-blue-600 dark:hover:text-blue-400
                                                        hover:bg-white dark:hover:bg-gray-700 transition"
                        >
                          <Download size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedFile(expandedFile === file.id ? null : file.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 
                                                    hover:text-gray-600 dark:hover:text-gray-300
                                                    hover:bg-white dark:hover:bg-gray-700 transition"
                      >
                        {expandedFile === file.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 
                                                    hover:text-red-600 dark:hover:text-red-400
                                                    hover:bg-white dark:hover:bg-gray-700 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedFile === file.id && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">File Name</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {file.name || file.file?.name}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Size</p>
                          <p className="text-gray-900 dark:text-white font-medium">
                            {file.fileSize}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {files.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 
                        bg-gray-50 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {selectedFiles.length}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  files selected for analysis
                </span>
              </div>
              <button
                onClick={onNext}
                disabled={selectedFiles.length === 0}
                className="px-6 py-2.5 text-sm font-medium
                                    bg-gradient-to-r from-blue-600 to-blue-700
                                    hover:from-blue-700 hover:to-blue-800
                                    disabled:from-gray-300 disabled:to-gray-300
                                    disabled:text-gray-500 disabled:cursor-not-allowed
                                    text-white rounded-lg
                                    flex items-center gap-2
                                    shadow-md hover:shadow-lg
                                    transition-all duration-200"
              >
                <BarChart3 size={16} />
                Analyze Selected
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}