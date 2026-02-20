import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';

import StepIndicator from './upload/StepIndicator';
import ProjectNameStep from './upload/ProjectNameStep';
import UploadStep from './upload/UploadStep';
import FileSelectionStep from './upload/FileSelectionStep';
import ProcessingStep from './upload/ProcessingStep';
import CompletionStep from './upload/CompletionStep';
import ReportsSidebar from './upload/ReportsSidebar';
import ReportDetailView from './upload/ReportDetailView';

import { UploadedFile, ProjectReport } from './upload/types';
import { useCreateReport, useReport } from '../hooks/useReports';
import { reportsApi } from '../apis/report.api';

// Helper to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [bankName, setBankName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'upload' | 'browse'>('upload');
  const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);
  const [recentProjects] = useState<ProjectReport[]>([]);

  const createReportMutation = useCreateReport();

  // URL-based state persistence
  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();

  // Track if we've already restored from URL to avoid re-running
  const restoredRef = useRef(false);

  const {
    data: reportData,
    isLoading: isLoadingReport,
    isError: isReportError,
    error: reportError,
  } = useReport(urlReportId);

  // Restore state from URL on mount or when report data loads (only once)
  useEffect(() => {
    if (urlReportId && reportData && !isLoadingReport && !restoredRef.current) {
      restoredRef.current = true;

      const report = reportData.report;
      setProjectName(report.report_name || '');
      setBankName(report.bank_name || '');

      // Check if analysis already exists
      const checkAnalysis = async () => {
        try {
          const analysisResponse = await reportsApi.getReportAnalysis(report.id);
          if (analysisResponse && analysisResponse.analysis) {
            setAnalysisResult(analysisResponse.analysis);
            setCurrentStep(5); // analysis exists -> completion
          } else {
            setCurrentStep(2); // no analysis yet -> upload
          }
        } catch {
          setCurrentStep(2); // no analysis -> upload
        }
      };

      checkAnalysis();
    }
  }, [urlReportId, reportData, isLoadingReport]);

  // Handle invalid report IDs
  useEffect(() => {
    if (isReportError && urlReportId) {
      console.error('Failed to load report:', reportError);
      alert("Failed to load report. It may have been deleted or you don't have access.");
      navigate('/upload');
      setProjectName('');
      setBankName('');
      setFiles([]);
      setSelectedFiles([]);
      setAnalysisResult(null);
      setCurrentStep(1);
    }
  }, [isReportError, urlReportId, navigate, reportError]);

  const handleCreateReport = async () => {
    try {
      const response = await createReportMutation.mutateAsync({
        name: projectName,
        bank_name: bankName,
      });

      // createReport returns { id, report_name, created_at } directly
      const createdId = (response as any).id;

      if (createdId) {
        navigate(`/upload/${createdId}`); // persist in URL
        setCurrentStep(2);
      } else {
        throw new Error('Report ID not found in response');
      }
    } catch (err: any) {
      console.error('Failed to create report', err);
      alert(`Failed to create report: ${err.message || 'Unknown error'}`);
    }
  };

  // Job progress state — keyed by job_id
  const [jobProgress, setJobProgress] = useState<Record<string, {
    status: string;
    currentPage: number | null;
    totalPages: number | null;
    error?: string;
  }>>({});

  /** Poll a single job until done; resolves with final status string */
  const pollJob = (jobId: string): Promise<string> =>
    new Promise((resolve) => {
      const interval = setInterval(async () => {
        try {
          const data = await reportsApi.pollJobStatus(jobId);
          const status = data.details?.processing_status ?? data.celery?.state ?? 'unknown';
          setJobProgress((prev) => ({
            ...prev,
            [jobId]: {
              status,
              currentPage: data.details?.current_page ?? null,
              totalPages: data.details?.total_pages ?? null,
              error: data.details?.error_message ?? undefined,
            },
          }));
          if (status === 'completed' || status === 'failed' || data.celery?.failed) {
            clearInterval(interval);
            resolve(status);
          }
        } catch (e) {
          // network blip — keep polling
        }
      }, 3_000);
    });

  // Helper to upload pending files
  const uploadPendingFiles = async (): Promise<boolean> => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return true;

    const effectiveReportId = urlReportId;
    if (!effectiveReportId) return false;

    // Set status to uploading
    setFiles(prev => prev.map(f =>
      pendingFiles.some(pf => pf.id === f.id)
        ? { ...f, status: 'uploading', progress: 50 }
        : f
    ));

    try {
      const rawFiles = pendingFiles.map(f => f.file);
      await reportsApi.uploadFiles(effectiveReportId, rawFiles);

      // Mark as completed
      setFiles(prev => prev.map(f =>
        pendingFiles.some(pf => pf.id === f.id)
          ? { ...f, status: 'completed', progress: 100 }
          : f
      ));
      return true;
    } catch (err: any) {
      console.error('Upload failed:', err);
      setFiles(prev => prev.map(f =>
        pendingFiles.some(pf => pf.id === f.id)
          ? { ...f, status: 'error', progress: 0 }
          : f
      ));
      alert('Failed to upload files. Please try again.');
      return false;
    }
  };

  const handleImportAndAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    // Ensure pending files are uploaded
    const uploadSuccess = await uploadPendingFiles();
    if (!uploadSuccess) return;

    const effectiveReportId = urlReportId;
    if (!effectiveReportId) {
      alert('Report ID is missing. Please go back and create a report first.');
      return;
    }

    setCurrentStep(4);
    setJobProgress({});

    try {
      // Mark files as processing in local state
      setFiles((prev) =>
        prev.map((f) =>
          selectedFiles.includes(f.id) ? { ...f, status: 'processing', progress: 10 } : f
        )
      );

      // ── Step 1: Dispatch Celery jobs (returns instantly) ──────────────────
      let importResponse;
      try {
        importResponse = await reportsApi.importFiles(effectiveReportId);
      } catch (importErr: any) {
        throw new Error(importErr.message || 'Failed to queue files for processing.');
      }

      if (!importResponse.success && !importResponse.job_ids?.length) {
        throw new Error('No jobs were queued. Please try again.');
      }

      const jobIds = importResponse.job_ids ?? [];

      if (jobIds.length === 0) {
        // Everything was skipped (already processed)
        const reasons = importResponse.skipped_files?.map((f) => f.reason).join('\n') ?? '';
        if (reasons) alert(`Files skipped:\n${reasons}`);
        setCurrentStep(3);
        return;
      }

      // Initialise progress entries
      setJobProgress(
        Object.fromEntries(jobIds.map((id) => [id, { status: 'queued', currentPage: null, totalPages: null }]))
      );

      // Update file progress to 30%
      setFiles((prev) =>
        prev.map((f) =>
          selectedFiles.includes(f.id) ? { ...f, progress: 30 } : f
        )
      );

      // ── Step 2: Poll all jobs in parallel ────────────────────────────────
      const finalStatuses = await Promise.all(jobIds.map(pollJob));

      const anyFailed = finalStatuses.some((s) => s === 'failed');

      // Update file progress to 80%
      setFiles((prev) =>
        prev.map((f) =>
          selectedFiles.includes(f.id) ? { ...f, progress: 80 } : f
        )
      );

      // ── Step 3: Trigger LLM analysis (non-fatal if it fails) ─────────────
      try {
        const analysisResponse = await reportsApi.analyzeReport(effectiveReportId);
        if (analysisResponse?.analysis) {
          setAnalysisResult(analysisResponse.analysis);
        }
      } catch (analysisErr: any) {
        console.warn('Analysis step failed (non-fatal):', analysisErr.message);
      }

      // Mark files completed
      setFiles((prev) =>
        prev.map((f) =>
          selectedFiles.includes(f.id)
            ? { ...f, status: anyFailed ? 'error' : 'completed', progress: 100 }
            : f
        )
      );

      setCurrentStep(5);
    } catch (error: any) {
      console.error('Error in import flow:', error);
      alert(error.message || 'An error occurred during processing. Please try again.');
      setFiles((prev) =>
        prev.map((f) =>
          selectedFiles.includes(f.id) ? { ...f, status: 'completed', progress: 100 } : f
        )
      );
      setCurrentStep(3);
    }
  };

  // Add files to local state as 'pending' (do not upload yet)
  const handleFileSelection = (rawFiles: File[]) => {
    const newUploadedFiles: UploadedFile[] = rawFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      fileSize: formatFileSize(file.size),
      uploadDate: new Date(),
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newUploadedFiles]);
    setSelectedFiles((prev) => [...prev, ...newUploadedFiles.map((f) => f.id)]);
  };

  const handleUploadAndContinue = async () => {
    // Check if we have any files at all
    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }

    const success = await uploadPendingFiles();
    if (success) {
      setCurrentStep(3);
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    if (file.serverFileId) {
      try {
        const blob = await reportsApi.downloadFile(file.serverFileId);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err) {
        console.error('Download failed:', err);
        alert('Failed to download file.');
      }
    }
  };

  const handleFinish = () => {
    setProjectName('');
    setBankName('');
    setFiles([]);
    setSelectedFiles([]);
    setAnalysisResult(null);
    setCurrentStep(1);
    restoredRef.current = false;
    navigate('/upload');
  };

  const startNewProject = () => {
    handleFinish();
  };

  const handleReportSelect = (id: string) => {
    setSelectedBrowseReportId(id);
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-secondary-900 mb-2 tracking-tight">
              Document Analysis Platform
            </h1>
            <p className="text-secondary-500">
              Process Tamil land documents with intelligent analysis
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode('upload')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${viewMode === 'upload'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              Upload New
            </button>

            <button
              onClick={() => setViewMode('browse')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${viewMode === 'browse'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                }`}
            >
              <FolderOpen size={20} />
              Browse Reports
            </button>
          </div>
        </div>

        {viewMode === 'browse' ? (
          <div
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
            style={{ height: 'calc(100vh - 220px)' }}
          >
            <div className="grid grid-cols-12 h-full">
              <div className="col-span-4 border-r border-secondary-200 overflow-hidden">
                <ReportsSidebar
                  selectedReportId={selectedBrowseReportId}
                  onReportSelect={handleReportSelect}
                />
              </div>

              <div className="col-span-8 overflow-hidden">
                <ReportDetailView reportId={selectedBrowseReportId} />
              </div>
            </div>
          </div>
        ) : (
          <>
            <StepIndicator currentStep={currentStep} />

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
                onFilesChange={(newFilesList) => {
                  const newIds = new Set(newFilesList.map((f) => f.id));
                  setFiles(newFilesList);
                  setSelectedFiles((prev) => prev.filter((id) => newIds.has(id)));
                }}
                onUpload={handleFileSelection}
                onNext={handleUploadAndContinue}
                onBack={() => setCurrentStep(1)}
                onDownload={handleDownloadFile}
              />
            )}

            {currentStep === 3 && (
              <FileSelectionStep
                files={files}
                selectedFiles={selectedFiles}
                setSelectedFiles={setSelectedFiles}
                onFilesChange={setFiles}
                onUpload={handleFileSelection}
                onBack={() => setCurrentStep(2)}
                onNext={handleImportAndAnalyze}
                onDownload={handleDownloadFile}
              />
            )}

            {currentStep === 4 && (
              <ProcessingStep files={files} selectedFiles={selectedFiles} jobProgress={jobProgress} />
            )}

            {currentStep === 5 && (
              <CompletionStep
                files={files}
                selectedFiles={selectedFiles}
                analysisResult={analysisResult}
                onSave={handleFinish}
                onRestart={startNewProject}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
