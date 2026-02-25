import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, History, ChevronRight } from 'lucide-react';
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

  // Browse Mode
  const [selectedBrowseReportId, setSelectedBrowseReportId] = useState<string | null>(null);
  const [recentProjects] = useState<ProjectReport[]>([]);

  // ==================== HOOKS ====================

  const { reportId: urlReportId } = useParams<{ reportId?: string }>();
  const navigate = useNavigate();

  const { currentUploadReportId: reportId, setCurrentUploadReportId: setReportId } = useAppStore();
  const { data: reportData, isLoading: isLoadingReport } = useReport(urlReportId);
  const createReportMutation = useCreateReport();
  const processMultipleMutation = useProcessMultipleDocuments();

  // ==================== EFFECTS ====================

  // Initialize from URL report
  useEffect(() => {
    if (!urlReportId || !reportData || isLoadingReport) return;

    initializeFromExistingReport(reportData);
  }, [urlReportId, reportData, isLoadingReport]);

  // ==================== INITIALIZATION ====================

  const initializeFromExistingReport = async (report: typeof reportData) => {
    setReportId(report.id);
    setProjectName(report.name);
    setBankName(report.bank_name || '');

    try {
      const analysisResponse = await reportsApi.analyzeReport(report.id);

      if (analysisResponse?.analysis) {
        setAnalysisResult(analysisResponse.analysis);
        setCurrentStep(5);
      } else {
        setCurrentStep(2);
      }
    } catch (error) {
      console.log('No analysis found for this report yet');
      setCurrentStep(2);
    }
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

  // Step 3 -> 4: Import and Analyze
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
      // 1. Trigger processing via backend
      await reportsApi.importFiles(effectiveReportId);

      // 2. Navigate to dedicated processing page
      navigate(`/processing/${effectiveReportId}`);

    } catch (error: any) {
      console.error('Import/Analyze workflow status:', error);
      // For errors, still allow them to move forward so they aren't trapped
      setCurrentStep(5);
    }
  };

  // Step 5: Save and Navigate
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
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
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${viewMode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
              >
                <LayoutGrid size={16} />
                Wizard
              </button>
              <button
                onClick={() => setViewMode('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${viewMode === 'browse'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
              <ReportsSidebar
                selectedReportId={selectedBrowseReportId}
                onReportSelect={setSelectedBrowseReportId}
              />
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
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
                />
                <div className="flex justify-center pb-8">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-600 transition-all font-medium text-sm group"
                  >
                    <span>Processing in background — click here to return to Dashboard</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
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
  );
}