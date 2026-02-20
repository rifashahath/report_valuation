import { FileText, Calendar, Building2, MapPin, Loader2, Copy, Check, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReport } from '../../hooks/useReports';
import { reportsApi } from '../../apis/report.api';

interface ReportDetailViewProps {
    reportId: string | null;
}

export default function ReportDetailView({ reportId }: ReportDetailViewProps) {
    const { data: reportData, isLoading } = useReport(reportId || undefined);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch stored analysis when report is selected (don't re-run OpenAI)
    useEffect(() => {
        if (reportId && reportData) {
            const fetchAnalysis = async () => {
                setLoadingAnalysis(true);
                try {
                    const analysisResponse = await reportsApi.getReportAnalysis(reportId);
                    if (analysisResponse && analysisResponse.analysis) {
                        setAnalysisResult(analysisResponse.analysis);
                    } else {
                        setAnalysisResult(null);
                    }
                } catch (error) {
                    console.log('No analysis found for this report');
                    setAnalysisResult(null);
                } finally {
                    setLoadingAnalysis(false);
                }
            };
            fetchAnalysis();
        }
    }, [reportId, reportData]);

    const handleCopy = () => {
        if (analysisResult) {
            navigator.clipboard.writeText(analysisResult);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Convert markdown to HTML
    const formatMarkdown = (text: string): string => {
        let html = text;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-900 mt-6 mb-3">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 mt-8 mb-4">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-8 mb-4">$1</h1>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

        // Lists
        html = html.replace(/^\* (.+)$/gim, '<li class="ml-6 mb-2">$1</li>');
        html = html.replace(/^- (.+)$/gim, '<li class="ml-6 mb-2">$1</li>');
        html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-2">$1</li>');

        // Wrap consecutive list items
        html = html.replace(/(<li class="ml-6 mb-2">.*<\/li>\n?)+/g, (match) => {
            if (match.includes('1.')) {
                return '<ol class="list-decimal list-inside mb-4 space-y-1">' + match + '</ol>';
            }
            return '<ul class="list-disc list-inside mb-4 space-y-1">' + match + '</ul>';
        });

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`(.+?)`/g, '<code class="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>');

        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');

        // Paragraphs
        html = html.replace(/^(?!<[h|u|o|l|p|d])(.+)$/gim, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>');

        // Line breaks
        html = html.replace(/\n\n/g, '<br/><br/>');

        return html;
    };

    if (!reportId) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Report Selected</h3>
                    <p className="text-gray-500">Select a report from the sidebar to view its details</p>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                    <p className="text-gray-600">Loading report details...</p>
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <FileText className="mx-auto text-red-400 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Report Not Found</h3>
                    <p className="text-gray-500">The selected report could not be loaded</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-gray-50">
            <div className="max-w-5xl mx-auto p-8 space-y-6">
                {/* Report Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold mb-2">{reportData.report.report_name}</h1>
                            <div className="flex items-center gap-2 text-indigo-100">
                                <Calendar size={16} />
                                <span className="text-sm">Created on {formatDate(reportData.report.created_at)}</span>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${reportData.report.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : reportData.report.status === 'review'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-gray-500 text-white'
                            }`}>
                            {(reportData.report.status || 'draft').charAt(0).toUpperCase() + (reportData.report.status || 'draft').slice(1)}
                        </span>
                    </div>

                    {/* Report Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        {reportData.report.bank_name && (
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 size={18} />
                                    <span className="text-sm font-medium text-indigo-100">Bank Name</span>
                                </div>
                                <p className="text-lg font-semibold">{reportData.report.bank_name}</p>
                            </div>
                        )}
                        {reportData.report.property_type && (
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={18} />
                                    <span className="text-sm font-medium text-indigo-100">Property Type</span>
                                </div>
                                <p className="text-lg font-semibold">{reportData.report.property_type}</p>
                            </div>
                        )}
                        {reportData.report.location && (
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <MapPin size={18} />
                                    <span className="text-sm font-medium text-indigo-100">Location</span>
                                </div>
                                <p className="text-lg font-semibold">{reportData.report.location}</p>
                            </div>
                        )}
                        {reportData.report.customer_name && (
                            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText size={18} />
                                    <span className="text-sm font-medium text-indigo-100">Customer Name</span>
                                </div>
                                <p className="text-lg font-semibold">{reportData.report.customer_name}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Analysis Section */}
                {loadingAnalysis ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                        <p className="text-gray-600">Loading analysis...</p>
                    </div>
                ) : analysisResult ? (
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                                        <FileText className="text-white" size={24} />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Analysis Report</h3>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCopy}
                                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={18} />
                                                <span className="text-sm font-medium">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={18} />
                                                <span className="text-sm font-medium">Copy</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (reportId) {
                                                try {
                                                    const blob = await reportsApi.downloadReport(reportId);
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `${reportData?.report.report_name || 'report'}.pdf`;
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    window.URL.revokeObjectURL(url);
                                                    document.body.removeChild(a);
                                                } catch (error) {
                                                    console.error('Download failed', error);
                                                    alert('Failed to download report');
                                                }
                                            }
                                        }}
                                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur"
                                    >
                                        <Download size={18} />
                                        <span className="text-sm font-medium">Export PDF</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="p-8">
                            <div
                                className="prose prose-lg prose-indigo max-w-none
                                    [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-8 [&_h1]:mb-4
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-3
                                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2
                                    [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4
                                    [&_ul]:list-disc [&_ul]:list-inside [&_ul]:mb-4 [&_ul]:space-y-2
                                    [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:mb-4 [&_ol]:space-y-2
                                    [&_li]:text-gray-700 [&_li]:ml-4
                                    [&_strong]:font-semibold [&_strong]:text-gray-900
                                    [&_code]:bg-gray-200 [&_code]:text-gray-800 [&_code]:px-2 [&_code]:py-1 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono
                                    [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-4
                                    [&_a]:text-blue-600 [&_a]:hover:text-blue-800 [&_a]:underline"
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdown(analysisResult)
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <FileText className="mx-auto text-gray-400 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analysis Available</h3>
                        <p className="text-gray-500">This report has not been analyzed yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
