import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Loader2, Folder, FolderOpen, ChevronRight, ChevronDown, FileText,
    Eye, Search, X, BookOpen, Sparkles, Copy, Check, Play, RefreshCw,
    AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '../services/apiClient';
import reportsApi from '../apis/report.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TreeNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    path: string;
    url?: string;
    children?: TreeNode[];
}

interface ReportInfo {
    id: string;
    report_name: string;
    bank_name: string;
    created_at: string;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string) {
    return text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-gray-900 mt-5 mb-2">{line.slice(4)}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2 border-b border-gray-100 pb-1">{line.slice(3)}</h2>;
        if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.slice(2)}</h1>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-900 mb-1">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-5 text-gray-700 mb-1 list-disc">{line.slice(2)}</li>;
        if (line.match(/^\d+\. /)) return <li key={i} className="ml-5 text-gray-700 mb-1 list-decimal">{line.replace(/^\d+\. /, '')}</li>;
        if (line.trim() === '') return <div key={i} className="h-3" />;
        return <p key={i} className="text-gray-700 leading-relaxed mb-1">{line}</p>;
    });
}

// ─── Tree Item ────────────────────────────────────────────────────────────────

function TreeItem({ node, level, expanded, selected, onToggle, onSelect }: {
    node: TreeNode; level: number; expanded: Set<string>;
    selected: TreeNode | null; onToggle: (id: string) => void; onSelect: (node: TreeNode) => void;
}) {
    const isExpanded = expanded.has(node.id);
    const isSelected = selected?.id === node.id;
    return (
        <div>
            <div
                className={`flex items-center gap-1.5 py-1.5 pr-2 cursor-pointer rounded-lg transition-all text-sm select-none ${isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                style={{ paddingLeft: `${level * 14 + 8}px` }}
                onClick={() => { if (node.type === 'folder') onToggle(node.id); onSelect(node); }}
            >
                {node.type === 'folder' && (
                    <span className="text-gray-400 flex-shrink-0">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {node.type === 'folder'
                    ? isExpanded
                        ? <FolderOpen size={16} className="text-indigo-500 flex-shrink-0" />
                        : <Folder size={16} className="text-indigo-400 flex-shrink-0" />
                    : <FileText size={15} className="text-gray-400 flex-shrink-0" />}
                <span className="truncate">{node.name}</span>
            </div>
            {node.type === 'folder' && isExpanded && node.children && (
                <div>{node.children.map(child => (
                    <TreeItem key={child.id} node={child} level={level + 1} expanded={expanded}
                        selected={selected} onToggle={onToggle} onSelect={onSelect} />
                ))}</div>
            )}
        </div>
    );
}

// ─── PDF Preview Modal ────────────────────────────────────────────────────────

function PreviewModal({ file, onClose }: { file: TreeNode; onClose: () => void }) {
    const previewUrl = file.url ? `http://localhost:8000${file.url}` : null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-[92vw] h-[92vh] flex flex-col overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText size={18} className="text-red-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm truncate max-w-[55vw]">{file.name}</p>
                            <p className="text-xs text-gray-400">{file.path}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {previewUrl && (
                            <a href={previewUrl} download={file.name}
                                className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                                Download
                            </a>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden bg-gray-100">
                    {previewUrl ? (
                        <iframe src={previewUrl} className="w-full h-full border-0" title={file.name} />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <p className="text-gray-500">No preview available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Report Output Panel ──────────────────────────────────────────────────────

function ReportOutputPanel({ reportId, reportName }: { reportId: string; reportName: string }) {
    const [activeTab, setActiveTab] = useState<'extracted' | 'analysis'>('extracted');
    const [copied, setCopied] = useState<string | null>(null);
    const [running, setRunning] = useState(false);
    const [runStatus, setRunStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
    const queryClient = useQueryClient();

    const { data: contentData, isLoading: loadingContent, refetch: refetchContent } = useQuery({
        queryKey: ['file-contents', reportId],
        queryFn: () => reportsApi.getFileContents(reportId),
        enabled: !!reportId,
    });

    const { data: analysisData, isLoading: loadingAnalysis, refetch: refetchAnalysis } = useQuery({
        queryKey: ['report-analysis', reportId],
        queryFn: () => reportsApi.getReportAnalysis(reportId),
        enabled: !!reportId,
    });

    const files = (contentData as any)?.files ?? [];
    const analysis = (analysisData as any)?.analysis ?? null;
    const hasContent = files.some((f: any) => f.content && f.content.trim().length > 0);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleRunPipeline = async () => {
        setRunning(true);
        setRunStatus(null);
        try {
            // Step 1: Import (OCR + translate)
            await reportsApi.importFiles(reportId);
            await refetchContent();

            // Step 2: Analyze (LLM summary)
            const analysisResp = await reportsApi.analyzeReport(reportId);
            await refetchAnalysis();

            setRunStatus({ type: 'success', msg: 'Import & Analysis completed successfully!' });
            setActiveTab('analysis');
        } catch (err: any) {
            setRunStatus({ type: 'error', msg: err?.message || 'Pipeline failed. Check backend logs.' });
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{reportName}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {files.length} file{files.length !== 1 ? 's' : ''}
                        {hasContent ? ' · Content extracted' : ' · Not yet processed'}
                    </p>
                </div>

                {/* Run Pipeline Button */}
                <button
                    onClick={handleRunPipeline}
                    disabled={running}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${running
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-200 hover:shadow-md'
                        }`}
                >
                    {running ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing…</>
                    ) : hasContent ? (
                        <><RefreshCw size={16} /> Re-run Analysis</>
                    ) : (
                        <><Zap size={16} /> Run Import & Analysis</>
                    )}
                </button>
            </div>

            {/* Status banner */}
            {runStatus && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm font-medium ${runStatus.type === 'success'
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                    {runStatus.type === 'success'
                        ? <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                        : <AlertCircle size={18} className="text-red-600 flex-shrink-0" />}
                    {runStatus.msg}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('extracted')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'extracted' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <BookOpen size={15} />
                    Extracted Text
                    {hasContent && <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />}
                </button>
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analysis' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <Sparkles size={15} />
                    AI Analysis
                    {analysis && <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />}
                </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-auto">

                {/* ── Extracted Text Tab ── */}
                {activeTab === 'extracted' && (
                    <div className="space-y-4">
                        {loadingContent ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-indigo-500" size={36} />
                            </div>
                        ) : !hasContent ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-10 text-center">
                                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <BookOpen size={32} className="text-amber-500" />
                                </div>
                                <p className="font-semibold text-amber-900 text-lg">No extracted content yet</p>
                                <p className="text-amber-700 text-sm mt-2 max-w-sm mx-auto">
                                    Click <strong>"Run Import & Analysis"</strong> above to OCR and translate the uploaded files.
                                </p>
                            </div>
                        ) : (
                            files.filter((f: any) => f.content).map((f: any) => (
                                <div key={f.file_id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                <FileText size={15} className="text-indigo-600" />
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{f.file_name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(f.content, f.file_id)}
                                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-900 transition-colors px-2 py-1 rounded-lg hover:bg-gray-200"
                                        >
                                            {copied === f.file_id ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                                            {copied === f.file_id ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="p-5 max-h-96 overflow-auto">
                                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{f.content}</pre>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* ── AI Analysis Tab ── */}
                {activeTab === 'analysis' && (
                    <div>
                        {loadingAnalysis ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-purple-500" size={36} />
                            </div>
                        ) : !analysis ? (
                            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-10 text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles size={32} className="text-purple-500" />
                                </div>
                                <p className="font-semibold text-purple-900 text-lg">No AI analysis yet</p>
                                <p className="text-purple-700 text-sm mt-2 max-w-sm mx-auto">
                                    Click <strong>"Run Import & Analysis"</strong> above to generate the AI-powered report summary.
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                {/* Analysis header */}
                                <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                                            <Sparkles size={18} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">AI Analysis Report</p>
                                            <p className="text-white/70 text-xs">Generated by GPT-4o-mini</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(analysis, 'analysis')}
                                        className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        {copied === 'analysis' ? <Check size={14} /> : <Copy size={14} />}
                                        {copied === 'analysis' ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>

                                {/* Analysis content */}
                                <div className="p-7">
                                    <div className="prose prose-sm max-w-none">
                                        {renderMarkdown(analysis)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
    const [expanded, setExpanded] = useState<Set<string>>(new Set(['uploads']));
    const [selected, setSelected] = useState<TreeNode | null>(null);
    const [preview, setPreview] = useState<TreeNode | null>(null);
    const [search, setSearch] = useState('');

    const { data: treeData, isLoading: treeLoading, isError: treeError } = useQuery({
        queryKey: ['file-tree'],
        queryFn: () => apiClient.get<{ tree: TreeNode[] }>('/api/v1/files/tree'),
    });

    const { data: reportsData } = useQuery({
        queryKey: ['reports'],
        queryFn: () => reportsApi.getReports(),
    });

    const toggleNode = (id: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const collectFiles = (node: TreeNode): TreeNode[] => {
        if (node.type === 'file') return [node];
        return (node.children ?? []).flatMap(collectFiles);
    };

    const filterTree = (nodes: TreeNode[], q: string): TreeNode[] => {
        if (!q) return nodes;
        return nodes.map(n => {
            if (n.type === 'file') return n.name.toLowerCase().includes(q.toLowerCase()) ? n : null;
            const children = filterTree(n.children ?? [], q);
            if (children.length > 0 || n.name.toLowerCase().includes(q.toLowerCase())) return { ...n, children };
            return null;
        }).filter(Boolean) as TreeNode[];
    };

    const tree: TreeNode[] = treeData ? (treeData as any).tree ?? [] : [];
    const filteredTree = filterTree(tree, search);
    const reports: ReportInfo[] = reportsData ? (reportsData as any).reports ?? [] : [];

    const matchedReport = selected?.type === 'folder'
        ? reports.find(r => r.report_name?.toLowerCase().trim() === selected.name.toLowerCase().trim()) ?? null
        : null;

    const selectedFiles = selected ? collectFiles(selected) : [];

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">File Management</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Browse uploaded documents and view AI analysis output</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    OpenAI Connected
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left — Tree sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
                    <div className="p-3 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" placeholder="Search files…" value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {treeLoading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="animate-spin text-indigo-500" size={24} />
                            </div>
                        )}
                        {treeError && <p className="text-red-500 text-xs text-center py-8">Failed to load files.</p>}
                        {!treeLoading && !treeError && filteredTree.map(node => (
                            <TreeItem key={node.id} node={node} level={0} expanded={expanded}
                                selected={selected} onToggle={toggleNode} onSelect={setSelected} />
                        ))}
                    </div>
                </div>

                {/* Right — Content area */}
                <div className="flex-1 overflow-auto p-6">
                    {!selected ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-5">
                                <Folder size={40} className="text-indigo-400" />
                            </div>
                            <p className="text-gray-700 text-lg font-semibold">Select a folder to view output</p>
                            <p className="text-gray-400 text-sm mt-1">Click any folder in the tree on the left</p>
                        </div>
                    ) : matchedReport ? (
                        <ReportOutputPanel reportId={matchedReport.id} reportName={matchedReport.report_name} />
                    ) : selected.type === 'file' ? (
                        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText size={24} className="text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 truncate">{selected.name}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{selected.path}</p>
                            </div>
                            <button
                                onClick={() => setPreview(selected)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-semibold"
                            >
                                <Eye size={16} /> Preview PDF
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</p>
                            </div>
                            {selectedFiles.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <Folder size={48} className="text-gray-300 mb-3" />
                                    <p className="text-gray-500">This folder is empty</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedFiles.map(file => (
                                        <div key={file.id}
                                            className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-200 group flex items-center gap-4">
                                            <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <FileText size={22} className="text-red-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 truncate">{file.path}</p>
                                            </div>
                                            <button onClick={() => setPreview(file)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors opacity-0 group-hover:opacity-100 font-medium">
                                                <Eye size={15} /> Preview
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {preview && <PreviewModal file={preview} onClose={() => setPreview(null)} />}
        </div>
    );
}
