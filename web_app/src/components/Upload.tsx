import { useState } from 'react';
import StepIndicator from './upload/StepIndicator';
import ProjectNameStep from './upload/ProjectNameStep';
import UploadStep from './upload/UploadStep';
import FileSelectionStep from './upload/FileSelectionStep';
import ProcessingStep from './upload/ProcessingStep';
import CompletionStep from './upload/CompletionStep';
import { UploadedFile, ProjectReport } from './upload/types';
import { useCreateReport } from '../hooks/useReports';
import apiService from '../services/apiService';
import { reportsApi } from '../apis/report.api';

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [recentProjects, setRecentProjects] = useState<ProjectReport[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const createReportMutation = useCreateReport();


  const handleCreateReport = async () => {
    try {
      const response = await createReportMutation.mutateAsync({
        name: projectName,
        bank_name: 'Default Bank',
      });

      const createdReport = 'id' in response ? response : (response as any).reports?.[0];

      if (createdReport?.id) {
        setReportId(createdReport.id);
        setCurrentStep(2);
      } else {
        throw new Error("Report ID not found in response");
      }
    } catch (err) {
      console.error('Failed to create report', err);
      alert('Failed to create report. Try another name.');
    }
  };

  const handleImportAndAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    if (!reportId) {
      alert("Report ID is missing. Please restart.");
      return;
    }

    setCurrentStep(4);
    setIsProcessing(true);

    try {
      // 1. Upload files if not already uploaded
      const uploadedFileIds: string[] = [];

      for (const fileId of selectedFiles) {
        const fileData = files.find(f => f.id === fileId);
        if (!fileData) continue;

        setFiles(prev => prev.map(f =>
          f.id === fileId ? { ...f, status: 'processing', progress: 10 } : f
        ));

        try {
          // apiService.processDocument is still valid for file upload
          const response = await apiService.processDocument(fileData.file);
          uploadedFileIds.push(response.document_id);

          setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'completed', progress: 100 } : f
          ));
        } catch (err) {
          console.error(`Failed to upload file ${fileData.file.name}`, err);
          setFiles(prev => prev.map(f =>
            f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
          ));
        }
      }

      if (uploadedFileIds.length === 0) {
        throw new Error("No files were successfully uploaded.");
      }

      // 2. Import Files into Report (using reportsApi from report.api.ts)
      await reportsApi.importFiles(reportId, uploadedFileIds);

      // 3. Trigger Analysis
      await reportsApi.analyzeReport(reportId);

      // Success! Move to completion
      setCurrentStep(5);

    } catch (error) {
      console.error("Error in import/analyze flow:", error);
      alert("An error occurred during processing. Please try again.");
      setCurrentStep(3);
    } finally {
      setIsProcessing(false);
    }
  };

  /* 
   * Previous handleCreateProject was mixing "saving to local store" with "resetting".
   * With the new flow, the project is created in the backend during step 4.
   * So "CompletionStep" just needs to "finish" or "view report".
   * We'll need to adjust CompletionStep usage or this handler.
   */
  const handleFinish = () => {
    // Trigger global refresh or navigation if needed

    // Reset
    setProjectName('');
    setFiles([]);
    setSelectedFiles([]);
    setCurrentStep(1);
  };

  const handleCreateProject = () => {
    handleFinish();
  };


  const startNewProject = () => {
    setProjectName('');
    setFiles([]);
    setSelectedFiles([]);
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Document Analysis Platform</h1>
          <p className="text-gray-600">Process Tamil land documents with intelligent analysis</p>
        </div>

        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && (
          <ProjectNameStep
            projectName={projectName}
            setProjectName={setProjectName}
            onNext={handleCreateReport}
            recentProjects={recentProjects}
          />
        )}

        {currentStep === 2 && (
          <UploadStep
            projectName={projectName}
            files={files}
            onFilesChange={(newFilesList) => {
              if (newFilesList.length > files.length) {
                // Files added
                const addedFiles = newFilesList.filter(
                  (nf) => !files.find((of) => of.id === nf.id)
                );
                setFiles(newFilesList);
                setSelectedFiles((prev) => [...prev, ...addedFiles.map((f) => f.id)]);
              } else {
                // Files removed (or same)
                setFiles(newFilesList);
                // Cleanup selectedFiles
                const newIds = new Set(newFilesList.map((f) => f.id));
                setSelectedFiles((prev) => prev.filter((id) => newIds.has(id)));
              }
            }}
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
            onBack={() => setCurrentStep(2)}
            onNext={handleImportAndAnalyze}
          />
        )}

        {currentStep === 4 && (
          <ProcessingStep files={files} selectedFiles={selectedFiles} />
        )}

        {currentStep === 5 && (
          <CompletionStep
            files={files}
            selectedFiles={selectedFiles}
            onSave={handleCreateProject}
            onRestart={startNewProject}
          />
        )}
      </div>
    </div>
  );
}