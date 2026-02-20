import { useState, useMemo } from 'react';
import { FolderOpen, ArrowRight, Building2 } from 'lucide-react';
import { ProjectReport } from './types';

const INDIAN_BANKS = [
    "State Bank of India (SBI)",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank (PNB)",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "Bank of India",
    "Indian Bank",
    "Central Bank of India",
    "Indian Overseas Bank",
    "UCO Bank",
    "Bank of Maharashtra",
    "Punjab & Sind Bank",
    "IDBI Bank",
    "Federal Bank",
    "IDFC First Bank",
    "South Indian Bank",
    "Karur Vysya Bank",
    "City Union Bank",
    "Tamilnad Mercantile Bank",
    "Karnataka Bank",
    "Dhanlaxmi Bank",
];

interface ProjectNameStepProps {
    projectName: string;
    setProjectName: (name: string) => void;
    bankName: string;
    setBankName: (name: string) => void;
    onNext: () => void;
    recentProjects: ProjectReport[];
}

export default function ProjectNameStep({
    projectName,
    setProjectName,
    bankName,
    setBankName,
    onNext,
    recentProjects,
}: ProjectNameStepProps) {
    const [showBankSuggestions, setShowBankSuggestions] = useState(false);

    const handleProjectNameSubmit = () => {
        if (projectName.trim() && bankName.trim()) {
            onNext();
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const suggestions = useMemo(() => {
        const normalizedInput = bankName.trim().toLowerCase();
        // Hide suggestions if input is empty or suggestions not active
        if (!showBankSuggestions || !normalizedInput) return [];

        return INDIAN_BANKS.filter((name) =>
            name.toLowerCase().includes(normalizedInput)
        ).sort();
    }, [bankName, showBankSuggestions]);

    return (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-32 translate-x-32 pointer-events-none" />

            <div className="text-center mb-10 relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform rotate-3 hover:rotate-6 transition-transform">
                    <FolderOpen size={36} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Report</h2>
                <p className="text-gray-500 text-lg">Enter details for your document analysis report</p>
            </div>

            <div className="space-y-6">
                {/* Bank Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 size={20} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => {
                                setBankName(e.target.value);
                                setShowBankSuggestions(true);
                            }}
                            onFocus={() => setShowBankSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowBankSuggestions(false), 200)}
                            placeholder="e.g., HDFC Bank, SBI"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg transition-all shadow-sm hover:border-gray-400"
                            autoFocus
                        />
                        {/* Suggestions Dropdown */}
                        {showBankSuggestions && suggestions.length > 0 && (
                            <ul className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {suggestions.map((name) => (
                                    <li
                                        key={name}
                                        className="px-4 py-2 cursor-pointer hover:bg-blue-50 text-sm text-gray-800"
                                        onMouseDown={() => {
                                            setBankName(name);
                                            setShowBankSuggestions(false);
                                        }}
                                    >
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Report Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Report Name *</label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleProjectNameSubmit()}
                        placeholder="e.g., Tamil Land Documents - January 2024"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                    />
                </div>

                <button
                    onClick={handleProjectNameSubmit}
                    disabled={!projectName.trim() || !bankName.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    Continue to Upload
                    <ArrowRight size={24} />
                </button>
            </div>

            {recentProjects.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-100 relative z-10">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Reports</h3>
                    <div className="space-y-3">
                        {recentProjects.slice(0, 3).map((project) => (
                            <div
                                key={project.id}
                                className="group p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{project.name}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatDate(project.createdAt)} • {project.fileCount} {project.fileCount === 1 ? 'file' : 'files'}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-white flex items-center justify-center transition-colors">
                                    <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
