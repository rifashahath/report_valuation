import { Loader2 } from 'lucide-react';
import { UploadedFile } from './types';

interface ProcessingStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
}

export default function ProcessingStep({ files, selectedFiles }: ProcessingStepProps) {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-secondary-100 p-8 text-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 via-brand-600 to-indigo-600 animate-pulse" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -translate-y-16 translate-x-16 pointer-events-none opacity-50" />

                <div className="relative z-10 pt-4">
                    <div className="w-16 h-16 bg-brand-50/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-brand-100/50 shadow-sm">
                        <Loader2 size={32} className="text-brand-600 animate-spin" />
                    </div>
                    <h2 className="text-2xl font-bold text-secondary-900 mb-2 tracking-tight">Processing Documents</h2>
                    <p className="text-secondary-500 text-sm mb-10 max-w-md mx-auto font-medium">
                        Our AI is analyzing <span className="font-bold text-brand-600 underline decoration-brand-200 decoration-2 underline-offset-4">{selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'}</span>. This might take a moment.
                    </p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide py-2">
                    {files
                        .filter((f) => selectedFiles.includes(f.id))
                        .map((file, index) => (
                            <div
                                key={file.id}
                                className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 flex items-center gap-4 transition-all group"
                                style={{
                                    animation: `fadeInUp 0.5s ease-out forwards ${index * 0.1}s`,
                                    opacity: 0
                                }}
                            >
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Loader2 size={16} className="text-brand-500 animate-spin" />
                                </div>

                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-semibold text-secondary-900 truncate tracking-tight">{file.name || file.file?.name}</h4>
                                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 uppercase tracking-wider">
                                            {file.progress < 100 ? 'Analyzing' : 'Finalizing'}
                                        </span>
                                    </div>

                                    <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                                        <div
                                            className="bg-brand-600 h-full rounded-full transition-all duration-700 ease-in-out"
                                            style={{ width: `${file.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            <p className="text-center text-xs font-bold text-secondary-400 uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0 animate-pulse" />
                Processing is active — You can safely leave this page
            </p>

            <style>{`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
}
