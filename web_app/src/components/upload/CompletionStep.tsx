import { CheckCircle, Plus, FileText, Clock, BarChart3, ArrowRight } from 'lucide-react';
import { UploadedFile } from './types';

interface CompletionStepProps {
  files: UploadedFile[];
  selectedFiles: string[];
  onSave: () => void;
  onRestart: () => void;
}

export default function CompletionStep({
  files,
  selectedFiles,
  onSave,
  onRestart,
}: CompletionStepProps) {
  const totalPages = files
    .filter((f) => selectedFiles.includes(f.id) && f.pages)
    .reduce((acc, f) => acc + (f.pages || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Success Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Analysis Complete
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
          Successfully processed {selectedFiles.length}{' '}
          {selectedFiles.length === 1 ? 'file' : 'files'}. Your comprehensive
          report is ready.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {selectedFiles.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Files Analyzed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Clock size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {totalPages}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pages</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">100%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Processing Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          onClick={onRestart}
          className="px-5 py-2.5 text-sm font-medium border border-gray-200 dark:border-gray-700
                     text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800
                     rounded-lg transition-all flex items-center gap-2"
        >
          <Plus size={16} />
          New Analysis
        </button>

        <button
          onClick={onSave}
          className="px-6 py-2.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700
                     text-white rounded-lg flex items-center gap-2
                     shadow-sm shadow-brand-200 dark:shadow-none transition-all group"
        >
          View &amp; Edit Report
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Processed Files */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Processed Files</h3>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {files
              .filter((f) => selectedFiles.includes(f.id))
              .map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3
                             bg-gray-50 dark:bg-gray-800/50 rounded-lg
                             hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name || file.file?.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {file.pages} {file.pages === 1 ? 'page' : 'pages'}
                        {file.language && ` • ${file.language}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                    Completed
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}