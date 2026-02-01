import { useState } from 'react';
import StepIndicator from './upload/StepIndicator';
import ProjectNameStep from './upload/ProjectNameStep';
import UploadStep from './upload/UploadStep';
import FileSelectionStep from './upload/FileSelectionStep';
import ProcessingStep from './upload/ProcessingStep';
import CompletionStep from './upload/CompletionStep';
import { UploadedFile, ProjectReport } from './upload/types';
import { useCreateReport } from '../hooks/useReports';
import { useProcessMultipleDocuments } from '../hooks/useDocuments';
import { reportsApi } from '../apis/report.api';

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [bankName, setBankName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);


  const [recentProjects] = useState<ProjectReport[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const createReportMutation = useCreateReport();
  const processMultipleMutation = useProcessMultipleDocuments();


  const handleCreateReport = async () => {
    try {
      const response = await createReportMutation.mutateAsync({
        name: projectName,
        bank_name: bankName,
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

    try {
      const filesToUpload = files
        .filter(f => selectedFiles.includes(f.id))
        .map(f => f.file);

      if (filesToUpload.length === 0) {
        throw new Error("No files selected for upload.");
      }

      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'processing', progress: 10 } : f
      ));

      // Import Data (Process Files)
      await processMultipleMutation.mutateAsync({
        files: filesToUpload,
        clientName: projectName,
        reportId: reportId
      });

      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'completed', progress: 100 } : f
      ));

      // Trigger Analysis
      const analysisResponse = await reportsApi.analyzeReport(reportId);
      if (analysisResponse && analysisResponse.analysis) {
        setAnalysisResult(analysisResponse.analysis);
      }

      setCurrentStep(5);

    } catch (error) {
      console.error("Error in import/analyze flow:", error);
      alert("An error occurred during processing. Please try again.");
      setFiles(prev => prev.map(f =>
        selectedFiles.includes(f.id) ? { ...f, status: 'error', progress: 0 } : f
      ));
      setCurrentStep(3);
    } finally {
      // Finished
    }
  };

  const handleFinish = () => {
    // Reset
    setProjectName('');
    setBankName('');
    setFiles([]);
    setSelectedFiles([]);
    setAnalysisResult(null);
    setCurrentStep(1);
  };

  const handleCreateProject = () => {
    handleFinish();
  };


  const startNewProject = () => {
    handleFinish();
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
            analysisResult={analysisResult}
            onSave={handleCreateProject}
            onRestart={startNewProject}
          />
        )}
      </div>
    </div>
  );
}