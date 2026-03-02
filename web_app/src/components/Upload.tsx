import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, History } from 'lucide-react';
import { config } from '../config/config';

// Components
import StepIndicator from './upload/StepIndicator';
import ProjectNameStep from './upload/ProjectNameStep';
import UploadStep from './upload/UploadStep';
import FileSelectionStep from './upload/FileSelectionStep';
import ProcessingStep from './upload/ProcessingStep';
import CompletionStep from './upload/CompletionStep';
import ReportsSidebar from './upload/ReportsSidebar';
import ReportDetailView from './upload/ReportDetailView';

// Types
import { UploadedFile, ProjectReport } from './upload/types';

// Hooks & APIs
import { useCreateReport, useReport } from '../hooks/useReports';
import { useProcessMultipleDocuments } from '../hooks/useDocuments';
import { reportsApi } from '../apis/report.api';
import { useAppStore } from '../store/useAppStore';

type ViewMode = 'upload' | 'browse';

export default function Upload() {
  // ==================== STATE ====================

  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [currentStep, setCurrentStep] = useState(1);

  const [projectName, setProjectName] = useState('');
  const [bankName, setBankName] = useState('');

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState({
    completed: 0,
    total: 0,
    percentage: 0,
  });

  const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);
  const [recentProjects] = useState<ProjectReport[]>([]);

  // ==================== REFS ====================

  const hasInitialized = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== HELPERS ====================

  /**
   * ✅ Production-safe copy:
   * - Uses navigator.clipboard on secure contexts (https or localhost)
   * - Falls back to execCommand for http/ip:port or restricted contexts
   */
  const copyToClipboard = async (text: string) => {
    try {
      // Modern way (works only on HTTPS or localhost)
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }

      // Fallback for HTTP / older browsers / some restricted contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const ok = document.execCommand('copy');
      document.body.removeChild(textarea);
      return ok;
    } catch (e) {
      console.error('Copy failed:', e);
      return false;
    }
  };

  /**
   * Builds a stable link that people can open later:
   * /upload/:reportId
   *
   * If you have an env like config.FRONTEND_URL, you can swap origin for that.
   */
  const buildShareUrl = (effectiveReportId: string) => {
    // Prefer a configured public URL if you have one (optional)
    // Example: config.publicWebUrl or config.frontendUrl etc.
    // If you don't have it, we just use window.location.origin
    const origin =
      (config as any)?.frontendUrl ||
      (config as any)?.publicWebUrl ||
      window.location.origin;

    return `${origin}/upload/${effectiveReportId}`;
  };

  // ==================== HOOKS ====================

  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();

  const { currentUploadReportId: reportId, setCurrentUploadReportId: setReportId } = useAppStore();
  const { data: reportData, isLoading: isLoadingReport } = useReport(urlReportId);
  const createReportMutation = useCreateReport();
  const processMultipleMutation = useProcessMultipleDocuments(); // (kept, even if unused here)

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!urlReportId || !reportData || isLoadingReport) return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    initializeFromExistingReport(reportData as any);
  }, [urlReportId, reportData, isLoadingReport]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ==================== INITIALIZATION ====================

  const initializeFromExistingReport = async (rawData: any) => {
    const report = rawData?.report ?? rawData;
    const backendFiles: any[] = rawData?.files ?? report?.files ?? [];
    const effectiveReportId = report?.id;

    if (!effectiveReportId) return;

    setReportId(effectiveReportId);
    setProjectName(report.report_name || report.name || '');
    setBankName(report.bank_name || '');

    if (backendFiles.length > 0) {
      const restoredFiles: UploadedFile[] = backendFiles.map((f: any) => ({
        id: f.id,
        serverFileId: f.id,
        name: f.file_name,
        status: 'completed' as const,
        progress: 100,
        uploadDate: new Date(f.created_at || Date.now()),
        fileSize: f.file_size_mb ? `${f.file_size_mb} MB` : '',
      }));
      setFiles(restoredFiles);
      setSelectedFiles(restoredFiles.map((f) => f.id));
    }

    try {
      const statusData = await reportsApi.getReportStatus(effectiveReportId);

      if (statusData.status === 'completed' || statusData.has_analysis) {
        try {
          const analysisResponse = await reportsApi.getReportAnalysis(effectiveReportId);
          if (analysisResponse?.analysis) {
            setAnalysisResult(analysisResponse.analysis);
          }
        } catch (_) { }
        setCurrentStep(5);
      } else if (statusData.status === 'processing') {
        setProcessingProgress(statusData.progress);
        setCurrentStep(4);
        startPolling(effectiveReportId);
      } else {
        setCurrentStep(2);
      }
    } catch (error) {
      try {
        const analysisResponse = await reportsApi.getReportAnalysis(effectiveReportId);
        if (analysisResponse?.analysis) {
          setAnalysisResult(analysisResponse.analysis);
          setCurrentStep(5);
          return;
        }
      } catch (_) { }
      setCurrentStep(2);
    }
  };

  const startPolling = (effectiveReportId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    const MAX_POLLS = 200; // ~10 minutes @ 3s
    let polls = 0;

    pollingRef.current = setInterval(async () => {
      polls++;
      if (polls > MAX_POLLS) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        return;
      }

      try {
        const statusData = await reportsApi.getReportStatus(effectiveReportId);
        setProcessingProgress(statusData.progress);

        if (statusData.status === 'completed') {
          if (pollingRef.current) clearInterval(pollingRef.current);

          try {
            const analysisResponse = await reportsApi.getReportAnalysis(effectiveReportId);
            if (analysisResponse?.analysis) setAnalysisResult(analysisResponse.analysis);
          } catch (_) { }

          setCurrentStep(5);
        }
      } catch (_) { }
    }, 3000);
  };

  // ==================== STEP HANDLERS ====================

  const handleCreateReport = async () => {
    if (!projectName.trim()) {
      alert('Please enter a project name');
      return;
    }

    try {
      const response = await createReportMutation.mutateAsync({
        name: projectName,
        bank_name: bankName,
      });

      const createdReport = 'id' in response ? response : (response as any).reports?.[0];

      if (!createdReport?.id) {
        throw new Error('Report ID not found in response');
      }

      setReportId(createdReport.id);
      navigate(`/upload/${createdReport.id}`);
      setCurrentStep(2);
    } catch (error) {
      console.error('Failed to create report', error);
      alert('Failed to create report. Please try another name.');
    }
  };

  const handleFileUpload = async (newFiles: File[]) => {
    const effectiveReportId = reportId || urlReportId;

    if (!effectiveReportId) {
      alert('Report ID missing. Please restart the project.');
      return;
    }
    if (newFiles.length === 0) return;

    const tempFiles: UploadedFile[] = newFiles.map((file) => ({
      id: generateFileId(),
      file,
      status: 'uploading',
      progress: 0,
      uploadDate: new Date(),
      fileSize: formatFileSize(file.size),
    }));

    setFiles((prev) => [...prev, ...tempFiles]);

    try {
      updateFilesProgress(tempFiles.map((f) => f.id), 50);

      const response = await reportsApi.uploadFiles(effectiveReportId, newFiles);

      if (response && ((response as any).success || (response as any).files)) {
        const serverFiles = (response as any).files || (response as any).documents || [];

        setFiles((prev) =>
          prev.map((f) => {
            const localName = f.name || f.file?.name;
            const match = serverFiles.find((sf: any) => sf.file_name === localName);
            if (match) {
              return { ...f, serverFileId: match.id, status: 'completed', progress: 100 };
            }
            return f;
          })
        );

        updateFilesStatus(tempFiles.map((f) => f.id), 'completed', 100);
        setSelectedFiles((prev) => [...prev, ...tempFiles.map((f) => f.id)]);
      } else {
        throw new Error('Upload response invalid');
      }
    } catch (error) {
      console.error('Upload failed', error);
      updateFilesStatus(tempFiles.map((f) => f.id), 'error', 0, 'Upload failed');
    }
  };

  const handleImportAndAnalyze = async () => {
    const effectiveReportId = reportId || urlReportId;

    if (selectedFiles.length === 0) {
      alert('Please select at least one file.');
      return;
    }
    if (!effectiveReportId) {
      alert('Report ID is missing. Please restart or check the URL.');
      return;
    }

    setCurrentStep(4);

    try {
      await reportsApi.importFiles(effectiveReportId);
    } catch (error: any) {
      console.error('Import failed:', error);
      // still poll
    }

    startPolling(effectiveReportId);
  };

  const handleCreateProject = () => {
    const effectiveReportId = reportId || urlReportId;
    if (!effectiveReportId) {
      alert('Report ID is missing. Cannot save report.');
      return;
    }
    navigate(`/reports/${effectiveReportId}/edit`);
  };

  const handleFinish = () => {
    resetUploadState();
    navigate('/upload');
  };

  // ==================== FILE OPERATIONS ====================

  const handleDownload = async (file: UploadedFile) => {
    const targetId = (file as any).serverFileId || file.id;

    try {
      const blob = await reportsApi.downloadFile(targetId);
      downloadBlob(blob, file.name || file.file?.name || 'download');
    } catch (error) {
      console.error('File download failed', error);

      if (file.file) {
        const url = URL.createObjectURL(file.file);
        downloadUrl(url, file.file.name);
        URL.revokeObjectURL(url);
      }
    }
  };

  // ==================== UTILS ====================

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const formatFileSize = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  const updateFilesProgress = (fileIds: string[], progress: number) => {
    setFiles((prev) => prev.map((f) => (fileIds.includes(f.id) ? { ...f, progress } : f)));
  };

  const updateFilesStatus = (
    fileIds: string[],
    status: UploadedFile['status'],
    progress?: number,
    error?: string
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        fileIds.includes(f.id)
          ? { ...f, status, ...(progress !== undefined && { progress }), ...(error && { error }) }
          : f
      )
    );
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    downloadUrl(url, filename);
    URL.revokeObjectURL(url);
  };

  const downloadUrl = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetUploadState = () => {
    setProjectName('');
    setBankName('');
    setFiles([]);
    setSelectedFiles([]);
    setAnalysisResult(null);
    setReportId(null);
    setCurrentStep(1);
  };

  // ==================== RENDER ====================

  return (
    <div className="h-full">
      <div className="bg-white dark:bg-night-900 rounded-2xl border border-brand-100 dark:border-night-800 shadow-lg dark:shadow-none overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white dark:bg-night-900/95 backdrop-blur-xl border-b border-slate-100 dark:border-night-700">
          <div className="w-full mx-auto px-2 sm:px-3 lg:px-4 py-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Title */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
                  <Plus className="text-white" size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  New Report
                </h1>
              </div>

              {/* Step Indicator */}
              {viewMode === 'upload' && (
                <div className="mt-6">
                  <StepIndicator currentStep={currentStep} />
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-slate-100 dark:bg-night-800 p-1 rounded-xl">
                <button
                  onClick={() => setViewMode('upload')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${viewMode === 'upload'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <LayoutGrid size={16} />
                  Wizard
                </button>
                <button
                  onClick={() => setViewMode('browse')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${viewMode === 'browse'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                >
                  <History size={16} />
                  History
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-4 py-8">
          {viewMode === 'browse' ? (
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-16rem)]">
              <div className="bg-white dark:bg-night-900 rounded-2xl shadow-lg border border-slate-200 dark:border-night-700 overflow-hidden">
                <ReportsSidebar
                  selectedReportId={selectedBrowseReportId}
                  onReportSelect={setSelectedBrowseReportId}
                />
              </div>
              <div className="bg-white dark:bg-night-900 rounded-2xl shadow-lg border border-slate-200 dark:border-night-700 overflow-hidden">
                <ReportDetailView reportId={selectedBrowseReportId} />
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {currentStep === 1 && (
                <ProjectNameStep
                  projectName={projectName}
                  setProjectName={setProjectName}
                  bankName={bankName}
                  setBankName={setBankName}
                  onNext={handleCreateReport}
                  recentProjects={recentProjects}
                />
              )}

              {currentStep === 2 && (
                <UploadStep
                  projectName={projectName}
                  files={files}
                  onFilesChange={setFiles}
                  onUpload={handleFileUpload}
                  onDownload={handleDownload}
                  onNext={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              )}

              {currentStep === 3 && (
                <FileSelectionStep
                  files={files}
                  selectedFiles={selectedFiles}
                  setSelectedFiles={setSelectedFiles}
                  onFilesChange={setFiles}
                  onUpload={handleFileUpload}
                  onDownload={handleDownload}
                  onBack={() => setCurrentStep(2)}
                  onNext={handleImportAndAnalyze}
                />
              )}

              {currentStep === 4 && (
                <ProcessingStep
                  files={files}
                  selectedFiles={selectedFiles}
                  progress={processingProgress}
                  onCopyLink={async () => {
                    const effectiveReportId = reportId || urlReportId;
                    if (!effectiveReportId) return false;
                    const shareUrl = buildShareUrl(effectiveReportId);
                    return copyToClipboard(shareUrl);
                  }}
                  onGoHome={() => navigate('/')}
                />
              )}

              {currentStep === 5 && (
                <CompletionStep
                  files={files}
                  selectedFiles={selectedFiles}
                  analysisResult={analysisResult}
                  onSave={handleCreateProject}
                  onRestart={handleFinish}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}