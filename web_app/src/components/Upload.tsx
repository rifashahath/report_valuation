import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, History, ChevronRight, Copy, Home } from 'lucide-react';
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

// Types
type ViewMode = 'upload' | 'browse';

export default function Upload() {
  // ==================== STATE ====================

  // View Management
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [currentStep, setCurrentStep] = useState(1);

  // Project Information
  const [projectName, setProjectName] = useState('');
  const [bankName, setBankName] = useState('');

  // File Management
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState({ completed: 0, total: 0, percentage: 0 });

  // Browse Mode
  const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);
  const [recentProjects] = useState<ProjectReport[]>([]);

  // ==================== REFS ====================

  // Prevents initializeFromExistingReport running twice on StrictMode / re-renders
  const hasInitialized = useRef(false);
  // Holds active polling interval so we can clear it on unmount
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ==================== HOOKS ====================

  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();

  const { currentUploadReportId: reportId, setCurrentUploadReportId: setReportId } = useAppStore();
  const { data: reportData, isLoading: isLoadingReport } = useReport(urlReportId);
  const createReportMutation = useCreateReport();
  const processMultipleMutation = useProcessMultipleDocuments();

  // ==================== EFFECTS ====================

  // Initialize from URL report (run once when data arrives)
  useEffect(() => {
    if (!urlReportId || !reportData || isLoadingReport) return;
    if (hasInitialized.current) return;  // guard against double-run
    hasInitialized.current = true;
    initializeFromExistingReport(reportData as any);
  }, [urlReportId, reportData, isLoadingReport]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // ==================== INITIALIZATION ====================

  const initializeFromExistingReport = async (rawData: any) => {
    // Backend returns { report, files } shape
    const report = rawData?.report ?? rawData;
    const backendFiles: any[] = rawData?.files ?? report?.files ?? [];
    const reportId = report?.id;

    if (!reportId) return;

    setReportId(reportId);
    setProjectName(report.report_name || report.name || '');
    setBankName(report.bank_name || '');

    // ✅ Restore files list from backend so ProcessingStep shows correct data on refresh
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
      // Check processing status to determine which step to resume
      const statusData = await reportsApi.getReportStatus(reportId);

      if (statusData.status === 'completed' || statusData.has_analysis) {
        // Processing done — load analysis and go to step 5
        try {
          const analysisResponse = await reportsApi.getReportAnalysis(reportId);
          if (analysisResponse?.analysis) {
            setAnalysisResult(analysisResponse.analysis);
          }
        } catch (_) { }
        setCurrentStep(5);
      } else if (statusData.status === 'processing') {
        // Still processing — resume step 4 with live polling
        setProcessingProgress(statusData.progress);
        setCurrentStep(4);
        startPolling(reportId);
      } else {
        // empty / unknown — let them upload files
        setCurrentStep(2);
      }
    } catch (error) {
      // Fallback if status call fails
      try {
        const analysisResponse = await reportsApi.getReportAnalysis(reportId);
        if (analysisResponse?.analysis) {
          setAnalysisResult(analysisResponse.analysis);
          setCurrentStep(5);
          return;
        }
      } catch (_) { }
      setCurrentStep(2);
    }
  };

  // Shared polling logic — used by both fresh-start and refresh-resume paths
  const startPolling = (effectiveReportId: string) => {
    // Clear any existing interval before starting a new one
    if (pollingRef.current) clearInterval(pollingRef.current);

    const MAX_POLLS = 200; // ~10 minutes at 3s intervals
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

  // Step 1: Create Report
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

  // Step 2: Upload Files
  const handleFileUpload = async (newFiles: File[]) => {
    const effectiveReportId = reportId || urlReportId;

    if (!effectiveReportId) {
      alert('Report ID missing. Please restart the project.');
      return;
    }

    if (newFiles.length === 0) return;

    // Create temporary file entries
    const tempFiles: UploadedFile[] = newFiles.map(file => ({
      id: generateFileId(),
      file,
      status: 'uploading',
      progress: 0,
      uploadDate: new Date(),
      fileSize: formatFileSize(file.size),
    }));

    setFiles(prev => [...prev, ...tempFiles]);

    try {
      // Update progress
      updateFilesProgress(tempFiles.map(f => f.id), 50);

      // Upload files
      const response = await reportsApi.uploadFiles(effectiveReportId, newFiles);

      if (response && (response.success || (response as any).files)) {
        const serverFiles = (response as any).files || response.documents || [];

        setFiles(prev => prev.map(f => {
          // Find matching server file by name
          const match = serverFiles.find((sf: any) => sf.file_name === (f.name || f.file?.name));
          if (match) {
            return { ...f, serverFileId: match.id, status: 'completed', progress: 100 };
          }
          return f;
        }));

        updateFilesStatus(tempFiles.map(f => f.id), 'completed', 100);
        setSelectedFiles(prev => [...prev, ...tempFiles.map(f => f.id)]);
      } else {
        throw new Error('Upload response invalid');
      }
    } catch (error) {
      console.error('Upload failed', error);
      updateFilesStatus(
        tempFiles.map(f => f.id),
        'error',
        0,
        'Upload failed'
      );
    }
  };

  // Step 3 -> 4: Import and Analyze — stays inside wizard, no separate page
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
      // Trigger backend processing
      await reportsApi.importFiles(effectiveReportId);
    } catch (error: any) {
      console.error('Import failed:', error);
      // Stay on step 4 even if import call errors — polling will still try
    }

    // Start polling via shared helper
    startPolling(effectiveReportId);
  };

  // Step 5: Navigate to the report editor
  const handleCreateProject = () => {
    const effectiveReportId = reportId || urlReportId;

    if (!effectiveReportId) {
      alert('Report ID is missing. Cannot save report.');
      return;
    }

    navigate(`/reports/${effectiveReportId}/edit`);
  };

  // Reset and Start Over
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

      // Fallback: download from local file object
      if (file.file) {
        const url = URL.createObjectURL(file.file);
        downloadUrl(url, file.file.name);
        URL.revokeObjectURL(url);
      }
    }
  };

  // ==================== UTILITY FUNCTIONS ====================

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const formatFileSize = (bytes: number): string => {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const updateFilesProgress = (fileIds: string[], progress: number) => {
    setFiles(prev =>
      prev.map(f => (fileIds.includes(f.id) ? { ...f, progress } : f))
    );
  };

  const updateFilesStatus = (
    fileIds: string[],
    status: UploadedFile['status'],
    progress?: number,
    error?: string
  ) => {
    setFiles(prev =>
      prev.map(f =>
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
            /* Browse Mode - History View */
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
            /* Upload Wizard Mode */
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
                <div className="flex flex-col gap-6">
                  <ProcessingStep
                    files={files}
                    selectedFiles={selectedFiles}
                    progress={processingProgress}
                  />
                  <div className="flex items-center justify-center gap-3 pb-8">
                    <button
                      onClick={() => {
                        const url = window.location.href;
                        navigator.clipboard.writeText(url);
                      }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm"
                    >
                      <Copy size={15} />
                      Copy Link
                    </button>
                    <button
                      onClick={() => navigate('/')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm"
                    >
                      <Home size={15} />
                      Go to Home
                    </button>
                  </div>
                </div>
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