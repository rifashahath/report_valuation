import {
  FileText,
  Calendar,
  Building2,
  MapPin,
  Loader2,
  Copy,
  Check,
  Download,
  ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useReport } from '../../hooks/useReports';
import { reportsApi } from '../../apis/report.api';
import { useQueryClient } from '@tanstack/react-query';

interface ReportDetailViewProps {
  reportId: string | null;
}

export default function ReportDetailView({ reportId }: ReportDetailViewProps) {
  const queryClient = useQueryClient();

  const { data: reportData, isLoading, refetch } = useReport(reportId || undefined);

  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);
  const [approving, setApproving] = useState(false);

  const report = reportData?.report;

  useEffect(() => {
    if (!reportId) return;

    const fetchAnalysis = async () => {
      setLoadingAnalysis(true);
      try {
        const analysisResponse = await reportsApi.getReportAnalysis(reportId);
        setAnalysisResult(analysisResponse?.analysis ?? null);
      } catch (error) {
        console.log('No analysis found for this report');
        setAnalysisResult(null);
      } finally {
        setLoadingAnalysis(false);
      }
    };

    fetchAnalysis();
  }, [reportId]);

  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!reportId || !report) return;

    setApproving(true);
    try {
      await reportsApi.updateReport(reportId, {
        report_name: report.report_name,
        report_status: 'approved'
      });

      // ✅ Update sidebar list instantly (no reload needed)
      queryClient.setQueriesData(
        { predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('reports') },
        (old: any) => {
          if (!old?.reports) return old;
          return {
            ...old,
            reports: old.reports.map((r: any) =>
              r.id === reportId ? { ...r, report_status: 'approved', status: 'approved' } : r
            )
          };
        }
      );

      // ✅ Refresh detail view
      await refetch?.();

      // ✅ Re-sync list from server (in case backend returns different shape)
      await queryClient.invalidateQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('reports')
      });
      await queryClient.refetchQueries({
        predicate: (q) => Array.isArray(q.queryKey) && q.queryKey.includes('reports')
      });
    } catch (error: any) {
      console.error('Failed to approve report', error);
      console.error('Server says:', error?.response?.status, error?.response?.data);
      alert(error?.response?.data?.detail?.[0]?.msg || 'Failed to approve report');
    } finally {
      setApproving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatMarkdown = (text: string): string => {
    let html = text;

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 class="text-2xl font-bold mt-8 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">$1</h2>'
    );
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-slate-900 dark:text-white">$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em class="italic">$1</em>');

    html = html.replace(
      /^\* (.+)$/gim,
      '<li class="ml-6 mb-2 relative pl-2 before:content-[\'•\'] before:absolute before:left-[-1rem] before:text-slate-400">$1</li>'
    );
    html = html.replace(
      /^- (.+)$/gim,
      '<li class="ml-6 mb-2 relative pl-2 before:content-[\'•\'] before:absolute before:left-[-1rem] before:text-slate-400">$1</li>'
    );
    html = html.replace(/^\d+\. (.+)$/gim, '<li class="ml-6 mb-2 list-decimal">$1</li>');

    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-slate-900 text-slate-50 p-4 rounded-xl overflow-x-auto my-6 shadow-sm border border-slate-800 text-sm"><code>$1</code></pre>'
    );

    html = html.replace(
      /`(.+?)`/g,
      '<code class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-200 dark:border-slate-700">$1</code>'
    );

    html = html.replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" class="text-brand-600 hover:text-brand-700 underline underline-offset-2 decoration-brand-200" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html.replace(
      /^(?!<[h|u|o|l|p|d|b])(.+)$/gim,
      '<p class="mb-4 leading-relaxed text-slate-600 dark:text-slate-300">$1</p>'
    );

    html = html.replace(/\n\n/g, '<br/><br/>');

    return html;
  };

  if (!reportId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/50">
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
          <FileText className="text-slate-400" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Report Selected</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Select a report from the sidebar to view its detailed analysis and valuation insights.
        </p>
      </div>
    );
  }

  if (isLoading || loadingAnalysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white/50 dark:bg-slate-900/50">
        <Loader2 className="animate-spin text-brand-600 mb-4" size={40} />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Loading report details...</p>
      </div>
    );
  }

  if (!reportData || !report) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <FileText className="text-red-500" size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Report Not Found</h3>
        <p className="text-slate-500 dark:text-slate-400">The requested report could not be accessed.</p>
      </div>
    );
  }

  const status = report.report_status ?? (report as any).status ?? 'draft';

  const statusClass =
    status === 'approved'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      : status === 'review'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {report.report_name || (report as any).name}
              </h1>

              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusClass}`}>
                {status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>{formatDate(report.created_at) || 'Unknown Date'}</span>
              </div>

              {report.bank_name && (
                <div className="flex items-center gap-1.5">
                  <Building2 size={14} />
                  <span>{report.bank_name}</span>
                </div>
              )}

              {report.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  <span>{report.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
              title="Copy Analysis"
            >
              {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
            </button>

            <button
              onClick={async () => {
                if (!reportId) return;
                try {
                  const blob = await reportsApi.downloadReport(reportId);
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${report.report_name || (report as any).name || 'report'}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('Download failed', error);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-brand-300 hover:text-brand-600 transition-colors text-sm font-semibold text-slate-600 dark:text-slate-300 shadow-sm"
            >
              <Download size={16} />
              Export PDF
            </button>

            {status !== 'approved' && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-semibold shadow-sm shadow-brand-200 dark:shadow-none"
              >
                {approving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                {approving ? 'Approving...' : 'Approve'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Customer', value: (report as any).customer_name || report.report_name, icon: <FileText size={14} /> },
            { label: 'Bank', value: report.bank_name, icon: <Building2 size={14} /> },
            { label: 'Property', value: (report as any).property_type, icon: <Building2 size={14} /> },
            { label: 'Location', value: report.location, icon: <MapPin size={14} /> }
          ].map((item, i) =>
            item.value ? (
              <div
                key={i}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  {item.icon}
                  {item.label}
                </div>
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">{item.value}</div>
              </div>
            ) : null
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
        {analysisResult ? (
          <div className="max-w-4xl mx-auto">
            <div
              className="prose prose-slate dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800 prose-h2:pb-2 prose-h2:mt-8 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-strong:text-slate-800 dark:prose-strong:text-slate-200 max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(analysisResult) }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 mt-12 text-center text-slate-400">
            <FileText size={48} className="mb-4 opacity-20" />
            <p>No analysis content available.</p>
          </div>
        )}
      </div>
    </div>
  );
}