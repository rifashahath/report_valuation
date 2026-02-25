import { CheckCircle, Plus, FileText, Download, Copy, Check, Clock, BarChart3 } from 'lucide-react';
import { UploadedFile } from './types';
import { useState } from 'react';

interface CompletionStepProps {
  files: UploadedFile[];
  selectedFiles: string[];
  analysisResult: string | null;
  onSave: () => void;
  onRestart: () => void;
}

export default function CompletionStep({
  files,
  selectedFiles,
  analysisResult,
  onSave,
  onRestart
}: CompletionStepProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Convert markdown to HTML
  const formatMarkdown = (text: string): string => {
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic text-gray-700 dark:text-gray-300">$1</em>');

    // Lists
    html = html.replace(/^\* (.+)$/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300">$1</li>');
    html = html.replace(/^- (.+)$/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300">$1</li>');
    html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-2 text-gray-700 dark:text-gray-300">$1</li>');

    // Wrap list items
    html = html.replace(/(<li class="ml-6 mb-2 text-gray-700.*<\/li>\n?)+/g, (match) => {
      if (match.includes('1.')) {
        return '<ol class="list-decimal list-inside mb-4 space-y-1">' + match + '</ol>';
      }
      return '<ul class="list-disc list-inside mb-4 space-y-1">' + match + '</ul>';
    });

    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>$1</code></pre>');

    // Inline code
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');

    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>');

    // Paragraphs
    html = html.replace(/^(?!<[h|u|o|l|p|d|p])(.+)$/gim, '<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>');

    return html;
  };

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
          Successfully processed {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}.
          Your comprehensive report is ready below.
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Files Analyzed
              </p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Pages
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                100%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Processing Rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
        <button
          onClick={onRestart}
          className="px-5 py-2.5 text-sm font-medium
                        border border-gray-200 dark:border-gray-700
                        text-gray-700 dark:text-gray-300
                        hover:bg-gray-50 dark:hover:bg-gray-800
                        rounded-lg transition-all
                        flex items-center gap-2"
        >
          <Plus size={16} />
          New Analysis
        </button>
        <button
          onClick={onSave}
          className="px-5 py-2.5 text-sm font-medium
                        bg-blue-600 hover:bg-blue-700
                        text-white rounded-lg
                        flex items-center gap-2
                        shadow-sm hover:shadow
                        transition-all"
        >
          <Download size={16} />
          Save Report
        </button>
      </div>

      {/* Analysis Result */}
      {analysisResult && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Report Header */}
          <div className="border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <FileText size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Analysis Report
                </h3>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5
                                    text-sm text-gray-600 dark:text-gray-400
                                    hover:text-gray-900 dark:hover:text-white
                                    hover:bg-gray-100 dark:hover:bg-gray-800
                                    rounded-lg transition"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            <div
              className="prose prose-sm max-w-none
                                dark:prose-invert
                                [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-gray-900 dark:[&_h1]:text-white [&_h1]:mt-8 [&_h1]:mb-4
                                [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h2]:mt-6 [&_h2]:mb-3
                                [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 dark:[&_h3]:text-white [&_h3]:mt-5 [&_h3]:mb-2
                                [&_p]:text-gray-700 dark:[&_p]:text-gray-300 [&_p]:leading-relaxed [&_p]:mb-4
                                [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-1
                                [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-1
                                [&_li]:text-gray-700 dark:[&_li]:text-gray-300
                                [&_code]:bg-gray-100 dark:[&_code]:bg-gray-800 [&_code]:text-gray-800 dark:[&_code]:text-gray-200 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm
                                [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4"
              dangerouslySetInnerHTML={{
                __html: formatMarkdown(analysisResult)
              }}
            />
          </div>
        </div>
      )}

      {/* Processed Files */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-800 px-4 py-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Processed Files
          </h3>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {files
              .filter((f) => selectedFiles.includes(f.id))
              .map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3
                                        bg-gray-50 dark:bg-gray-800/50
                                        rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800
                                        transition-all"
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