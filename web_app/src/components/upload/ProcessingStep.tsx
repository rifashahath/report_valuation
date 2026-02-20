import { Clock } from 'lucide-react';
import { UploadedFile } from './types';

interface JobProgress {
    status: string;
    currentPage: number | null;
    totalPages: number | null;
    error?: string;
}

interface ProcessingStepProps {
    files: UploadedFile[];
    selectedFiles: string[];
    jobProgress?: Record<string, JobProgress>;
}

export default function ProcessingStep(_props: ProcessingStepProps) {
    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Clock size={48} className="text-blue-600 animate-pulse" />
                </div>

                <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Still processing…</h2>

                <p className="text-gray-600 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
                    This document is taking longer than usual. You can safely leave this page — we’ll keep processing in the background.
                </p>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm">
                    <span>💡 Hint: Check Browse Reports in a few minutes.</span>
                </div>
            </div>
        </div>
    );
}
