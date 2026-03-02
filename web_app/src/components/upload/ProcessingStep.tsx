import { useState } from 'react';
import { Loader2, CheckCircle2, Copy, Home } from 'lucide-react';
import { UploadedFile } from './types';

interface ProcessingStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    progress?: { completed: number; total: number; percentage: number };
    onCopyLink?: () => Promise<boolean | void>;
    onGoHome?: () => void;
}

export default function ProcessingStep({
    files,
    selectedFiles,
    progress,
    onCopyLink,
    onGoHome,
}: ProcessingStepProps) {
    const pct = progress ? Math.round(progress.percentage) : 0;
    const done = progress?.completed ?? 0;
    const total = progress?.total ?? selectedFiles.length;

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!onCopyLink) return;
        const ok = await onCopyLink();
        if (ok !== false) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-800 p-8 text-center relative overflow-hidden">
                {/* Animated top bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 animate-pulse" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 dark:bg-brand-900/20 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none opacity-50" />

                <div className="relative z-10 pt-4">
                    <div className="w-16 h-16 bg-brand-50/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-100/50 shadow-sm">
                        <Loader2 size={32} className="text-brand-600 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Processing Documents</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto font-medium">
                        Our AI is analyzing{' '}
                        <span className="font-bold text-brand-600 underline decoration-brand-200 decoration-2 underline-offset-4">
                            {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}
                        </span>
                        . This might take a moment.
                    </p>

                    {/* Overall progress bar */}
                    <div className="mb-6 space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                            <span>{done} of {total} files</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-brand-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Action buttons — inside the card, above the file list */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <button
                            id="processing-copy-link-btn"
                            onClick={handleCopy}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-semibold hover:scale-[1.03] transition-all duration-200 text-sm ${copied
                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md scale-105'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle2 size={15} />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy size={15} />
                                    Copy Link
                                </>
                            )}
                        </button>

                        <button
                            id="processing-go-home-btn"
                            onClick={onGoHome}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-[1.03] transition-all duration-200 text-sm"
                        >
                            <Home size={15} />
                            Go to Home
                        </button>
                    </div>
                </div>

                {/* Per-file list */}
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-hide py-2">
                    {files
                        .filter((f) => selectedFiles.includes(f.id))
                        .map((file, index) => (
                            <div
                                key={file.id}
                                className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 flex items-center gap-4 transition-all group"
                                style={{
                                    animation: `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`,
                                    opacity: 0
                                }}
                            >
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                    {file.progress >= 100
                                        ? <CheckCircle2 size={16} className="text-emerald-500" />
                                        : <Loader2 size={16} className="text-brand-500 animate-spin" />
                                    }
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate tracking-tight">
                                            {file.name || file.file?.name}
                                        </h4>
                                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 uppercase tracking-wider flex-shrink-0 ml-2">
                                            {file.progress >= 100 ? 'Done' : 'Analyzing'}
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-brand-600 h-full rounded-full transition-all duration-700 ease-in-out"
                                            style={{ width: `${file.progress ?? 40}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0 animate-pulse" />
                Processing is active — The wizard will auto-advance when done
            </p>
        </div>
    );
}
