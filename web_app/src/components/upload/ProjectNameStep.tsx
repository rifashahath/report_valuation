import { FolderOpen, ArrowRight, Building2 } from 'lucide-react';
import { ProjectReport } from './types';

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
    recentProjects
}: ProjectNameStepProps) {
    const handleProjectNameSubmit = () => {
        if (projectName.trim() && bankName.trim()) {
            onNext();
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FolderOpen size={32} className="text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Report</h2>
                <p className="text-gray-600">Enter details for your document analysis report</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name *</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 size={20} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            placeholder="e.g., HDFC Bank, SBI"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                            autoFocus
                        />
                    </div>
                </div>

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
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
                >
                    Continue to Upload
                    <ArrowRight size={20} />
                </button>
            </div>

            {recentProjects.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-4">Recent Reports</h3>
                    <div className="space-y-2">
                        {recentProjects.slice(0, 3).map((project) => (
                            <div
                                key={project.id}
                                className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                                    <p className="text-xs text-gray-600">
                                        {formatDate(project.createdAt)} • {project.fileCount} files
                                    </p>
                                </div>
                                <ArrowRight size={16} className="text-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
