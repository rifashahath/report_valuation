import { useState, useEffect } from 'react';
import { Save, Send, Sparkles, MessageSquare, ChevronLeft } from 'lucide-react';
import { ValuationReport } from '../../types';
import { formatDate } from '../../utils/formatDate';

interface ReportEditorProps {
    report: ValuationReport | null;
    onBack: () => void;
    onSave: (reportId: string, content: ValuationReport['content']) => void;
    onSendForReview: (reportId: string) => void;
}

export default function ReportEditor({ report, onBack, onSave, onSendForReview }: ReportEditorProps) {
    const [content, setContent] = useState(report?.content || {
        summary: '',
        propertyDetails: '',
        valuationMethod: '',
        finalValuation: '',
    });
    const [activeSection, setActiveSection] = useState<keyof typeof content>('summary');

    // Sync content when report data is loaded asynchronously
    useEffect(() => {
        if (report?.content) {
            setContent(report.content);
        }
    }, [report?.id, report?.content?.summary]);
    const [showComments, setShowComments] = useState(false);

    if (!report) {
        return (
            <div className="p-8">
                <div className="bg-white border border-secondary-200 rounded-lg p-12 text-center">
                    <p className="text-secondary-600">Select a report to edit</p>
                </div>
            </div>
        );
    }

    const sections = [
        { key: 'summary' as const, label: 'Summary', icon: <Sparkles size={16} /> },
        { key: 'propertyDetails' as const, label: 'Property Details', icon: <Sparkles size={16} /> },
        { key: 'valuationMethod' as const, label: 'Valuation Method', icon: <Sparkles size={16} /> },
        { key: 'finalValuation' as const, label: 'Final Valuation', icon: <Sparkles size={16} /> },
    ];

    const handleSectionUpdate = (section: keyof typeof content, value: string) => {
        setContent((prev) => ({ ...prev, [section]: value }));
    };

    const handleSave = () => {
        onSave(report.id, content);
    };

    const handleSendForReview = () => {
        onSendForReview(report.id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-amber-100 text-amber-800';
            case 'review':
                return 'bg-orange-100 text-orange-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-secondary-100 text-secondary-800';
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <div className="bg-white border-b border-secondary-200 px-8 py-4">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
                    >
                        <ChevronLeft size={20} />
                        <span className="font-medium">Back</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowComments(!showComments)}
                            className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                        >
                            <MessageSquare size={18} />
                            <span className="font-medium">Comments ({report.comments.length})</span>
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
                        >
                            <Save size={18} />
                            <span className="font-medium">Save Draft</span>
                        </button>
                        <button
                            onClick={handleSendForReview}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                        >
                            <Send size={18} />
                            <span className="font-medium">Send for Review</span>
                        </button>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-secondary-900">{report.customerName}</h1>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(report.status)}`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-secondary-600">
                        <span>{report.bankName}</span>
                        <span>•</span>
                        <span>{report.propertyType}</span>
                        <span>•</span>
                        <span>{report.location}</span>
                        <span>•</span>
                        <span>Updated {formatDate(report.updatedAt, 'short')}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 bg-white border-r border-secondary-200 p-4 overflow-auto">
                    <h3 className="text-sm font-semibold text-secondary-700 mb-3">Report Sections</h3>
                    <div className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.key}
                                onClick={() => setActiveSection(section.key)}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activeSection === section.key
                                    ? 'bg-brand-50 text-brand-700 font-medium'
                                    : 'text-secondary-700 hover:bg-secondary-50'
                                    }`}
                            >
                                {section.icon}
                                <span className="text-sm">{section.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-secondary-50">
                    <div className="max-w-4xl mx-auto p-8">
                        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                            <Sparkles size={20} className="text-brand-600 mt-0.5" />
                            <div>
                                <p className="font-medium text-brand-900">AI-Generated Content</p>
                                <p className="text-sm text-brand-700 mt-1">
                                    This section was created by AI. Review and edit as needed for accuracy.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white border border-secondary-200 rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-secondary-900 mb-4">
                                {sections.find((s) => s.key === activeSection)?.label}
                            </h2>
                            <textarea
                                value={content[activeSection]}
                                onChange={(e) => handleSectionUpdate(activeSection, e.target.value)}
                                className="w-full h-96 p-4 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none font-mono text-sm"
                                placeholder={`Enter ${sections.find((s) => s.key === activeSection)?.label.toLowerCase()}...`}
                            />
                        </div>
                    </div>
                </div>

                {showComments && (
                    <div className="w-80 bg-white border-l border-secondary-200 overflow-auto">
                        <div className="p-4 border-b border-secondary-200">
                            <h3 className="font-semibold text-secondary-900">Comments</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {report.comments.length === 0 ? (
                                <p className="text-sm text-secondary-600 text-center py-8">No comments yet</p>
                            ) : (
                                report.comments.map((comment) => (
                                    <div key={comment.id} className="bg-secondary-50 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm text-secondary-900">{comment.user}</span>
                                            {comment.resolved && (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Resolved</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-secondary-700">{comment.text}</p>
                                        <p className="text-xs text-secondary-500 mt-2">
                                            {formatDate(comment.timestamp, 'datetime')}
                                        </p>
                                    </div>
                                ))
                            )}
                            <div className="pt-4 border-t border-secondary-200">
                                <textarea
                                    placeholder="Add a comment..."
                                    className="w-full p-3 border border-secondary-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none resize-none"
                                    rows={3}
                                />
                                <button className="w-full mt-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
