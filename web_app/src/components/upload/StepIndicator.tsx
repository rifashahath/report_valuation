import { FolderOpen, Upload as UploadIcon, FileStack, BarChart3, CheckCircle } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
    const steps = [
        { num: 1, label: 'Project', icon: FolderOpen },
        { num: 2, label: 'Upload', icon: UploadIcon },
        { num: 3, label: 'Select', icon: FileStack },
        { num: 4, label: 'Process', icon: BarChart3 },
        { num: 5, label: 'Results', icon: CheckCircle }
    ];

    return (
        <div className="w-full max-w-3xl mx-auto px-4">
            <div className="relative flex items-center justify-between">
                {/* Connecting Line - Background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />

                {/* Connecting Line - Progress */}
                <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 dark:bg-blue-500 transition-all duration-500 -z-10"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step) => {
                    const isActive = currentStep >= step.num;
                    const isCompleted = currentStep > step.num;
                    const isCurrent = currentStep === step.num;

                    return (
                        <div key={step.num} className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2">
                            <div
                                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                    ${isCompleted
                                        ? 'bg-blue-600 border-blue-600 text-white'
                                        : isCurrent
                                            ? 'bg-white dark:bg-slate-800 border-blue-600 text-blue-600 scale-110 shadow-lg shadow-blue-500/20'
                                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-400'
                                    }
                                `}
                            >
                                {isCompleted ? <CheckCircle size={18} /> : <step.icon size={18} />}
                            </div>
                            <span
                                className={`
                                    text-xs font-medium transition-colors duration-300 absolute -bottom-6 w-20 text-center
                                    ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}
                                `}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Spacer for labels */}
            <div className="h-6" />
        </div>
    );
}
