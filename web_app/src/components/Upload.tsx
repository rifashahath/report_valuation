import { useState, useRef } from 'react';
import {
  Upload as UploadIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  FileStack,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  BarChart3,
  FolderOpen,
  ArrowRight,
  Home
} from 'lucide-react';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed';
  progress: number;
  uploadDate: Date;
  fileSize: string;
  pages?: number;
  language?: string;
}

interface ProjectReport {
  id: string;
  name: string;
  createdAt: Date;
  fileCount: number;
  status: 'completed' | 'processing';
}

export default function Upload() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectName, setProjectName] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [recentProjects, setRecentProjects] = useState<ProjectReport[]>([
    {
      id: '1',
      name: 'Tamil Land Documents - Jan 2024',
      createdAt: new Date('2024-01-15'),
      fileCount: 12,
      status: 'completed'
    },
    {
      id: '2',
      name: 'Bank Reports Analysis',
      createdAt: new Date('2024-01-10'),
      fileCount: 8,
      status: 'completed'
    }
  ]);
  const [expandedFile, setExpandedFile] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
        .filter(file => file.type === 'application/pdf')
        .map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: 'pending' as const,
          progress: 0,
          uploadDate: new Date(),
          fileSize: formatFileSize(file.size)
        }));
      
      setFiles(prev => [...prev, ...newFiles]);
      setSelectedFiles(prev => [...prev, ...newFiles.map(f => f.id)]);
      
      if (newFiles.length > 0 && currentStep === 2) {
        setCurrentStep(3);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
        .filter(file => file.type === 'application/pdf')
        .map(file => ({
          id: Math.random().toString(36).substr(2, 9),
          file,
          status: 'pending' as const,
          progress: 0,
          uploadDate: new Date(),
          fileSize: formatFileSize(file.size)
        }));
      
      setFiles(prev => [...prev, ...newFiles]);
      setSelectedFiles(prev => [...prev, ...newFiles.map(f => f.id)]);
      e.target.value = '';
      
      if (newFiles.length > 0 && currentStep === 2) {
        setCurrentStep(3);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
    setSelectedFiles(prev => prev.filter(fileId => fileId !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setSelectedFiles([]);
    setCurrentStep(2);
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(fileId => fileId !== id) : [...prev, id]
    );
  };

  const selectAllFiles = () => {
    setSelectedFiles(selectedFiles.length === files.length ? [] : files.map(file => file.id));
  };

  const handleProjectNameSubmit = () => {
    if (projectName.trim()) {
      setCurrentStep(2);
    }
  };

  const handleImportAndAnalyze = () => {
    if (selectedFiles.length === 0) return;
    
    setCurrentStep(4);
    
    setFiles(prev => prev.map(file => ({
      ...file,
      status: selectedFiles.includes(file.id) ? 'processing' : file.status,
      progress: selectedFiles.includes(file.id) ? 50 : file.progress
    })));

    setTimeout(() => {
      setFiles(prev => prev.map(file => ({
        ...file,
        status: selectedFiles.includes(file.id) ? 'completed' : file.status,
        progress: selectedFiles.includes(file.id) ? 100 : file.progress,
        pages: selectedFiles.includes(file.id) ? Math.floor(Math.random() * 20) + 1 : file.pages,
        language: selectedFiles.includes(file.id) ? 'Tamil' : file.language
      })));
      setCurrentStep(5);
    }, 3000);
  };

  const handleCreateProject = () => {
    const newProject: ProjectReport = {
      id: Math.random().toString(36).substr(2, 9),
      name: projectName,
      createdAt: new Date(),
      fileCount: selectedFiles.length,
      status: 'completed'
    };

    setRecentProjects(prev => [newProject, ...prev]);
    
    setProjectName('');
    setFiles([]);
    setSelectedFiles([]);
    setCurrentStep(1);
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Project Name', icon: FolderOpen },
              { num: 2, label: 'Upload Files', icon: UploadIcon },
              { num: 3, label: 'Select Files', icon: FileStack },
              { num: 4, label: 'Process', icon: BarChart3 },
              { num: 5, label: 'Complete', icon: CheckCircle }
            ].map((step, idx) => (
              <div key={step.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    currentStep > step.num
                      ? 'bg-green-500 text-white'
                      : currentStep === step.num
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.num ? <CheckCircle size={24} /> : <step.icon size={24} />}
                  </div>
                  <span className={`text-sm font-medium ${currentStep >= step.num ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
                {idx < 4 && (
                  <div className={`h-1 flex-1 mx-2 mb-8 rounded transition-all ${
                    currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen size={32} className="text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Project</h2>
              <p className="text-gray-600">Enter a name for your document analysis project</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleProjectNameSubmit()}
                  placeholder="e.g., Tamil Land Documents - January 2024"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
                  autoFocus
                />
              </div>

              <button
                onClick={handleProjectNameSubmit}
                disabled={!projectName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
              >
                Continue to Upload
                <ArrowRight size={20} />
              </button>
            </div>

            {recentProjects.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Recent Projects</h3>
                <div className="space-y-2">
                  {recentProjects.slice(0, 3).map((project) => (
                    <div
                      key={project.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{project.name}</p>
                        <p className="text-xs text-gray-600">{formatDate(project.createdAt)} • {project.fileCount} files</p>
                      </div>
                      <ArrowRight size={16} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Upload Documents</h2>
                  <p className="text-gray-600 mt-1">Project: <span className="font-semibold">{projectName}</span></p>
                </div>
                <button onClick={startNewProject} className="text-sm text-gray-600 hover:text-gray-900">
                  Change Project Name
                </button>
              </div>

              <div
                className={`border-3 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                  multiple
                />
                <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full inline-flex items-center justify-center mb-6">
                  <UploadIcon size={40} className="text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Drop PDF Files Here</h3>
                <p className="text-gray-600 mb-6 text-lg">or click to browse from your computer</p>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <span>Multiple PDFs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <span>Max 50MB each</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-green-500" />
                    <span>Tamil supported</span>
                  </div>
                </div>
              </div>
            </div>

            {files.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Uploaded Files ({files.length})</h3>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    Continue
                    <ArrowRight size={18} />
                  </button>
                </div>
                <div className="space-y-2">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-blue-600" />
                        <div>
                          <p className="font-medium text-gray-900">{file.file.name}</p>
                          <p className="text-sm text-gray-600">{file.fileSize}</p>
                        </div>
                      </div>
                      <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 p-2">
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Select Files to Process</h2>
                  <p className="text-gray-600 mt-1">Choose which documents to analyze</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setCurrentStep(2)} className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg font-medium">
                    Back
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add More
                  </button>
                </div>
              </div>

              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === files.length && files.length > 0}
                      onChange={selectAllFiles}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                    />
                    <span className="font-medium text-gray-900">Select All Files</span>
                  </label>
                  <span className="text-sm text-gray-600">({selectedFiles.length} of {files.length} selected)</span>
                </div>
                <button onClick={clearAllFiles} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                  <Trash2 size={16} />
                  Clear All
                </button>
              </div>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${
                      selectedFiles.includes(file.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => {}}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-5 h-5"
                      />
                      <FileText size={24} className="text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{file.file.name}</p>
                        <p className="text-sm text-gray-600">{file.fileSize} • {formatDate(file.uploadDate)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedFile(expandedFile === file.id ? null : file.id);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-2"
                      >
                        {expandedFile === file.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-2"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {expandedFile === file.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">File Name</p>
                            <p className="text-gray-900">{file.file.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Size</p>
                            <p className="text-gray-900">{file.fileSize}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Upload Date</p>
                            <p className="text-gray-900">{formatDate(file.uploadDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Type</p>
                            <p className="text-gray-900">PDF Document</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{selectedFiles.length}</span> files selected for processing
                </div>
                <button
                  onClick={handleImportAndAnalyze}
                  disabled={selectedFiles.length === 0}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all shadow-lg"
                >
                  <BarChart3 size={20} />
                  Import & Analyze Files
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 size={48} className="text-white animate-spin" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Processing Documents</h2>
              <p className="text-gray-600 text-lg mb-8">Analyzing {selectedFiles.length} files for your project</p>

              <div className="space-y-4">
                {files.filter(f => selectedFiles.includes(f.id)).map((file) => (
                  <div key={file.id} className="text-left">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Loader2 size={18} className="text-blue-600 animate-spin" />
                        <span className="font-medium text-gray-900">{file.file.name}</span>
                      </div>
                      <span className="text-sm text-gray-600">{file.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center mb-6">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} className="text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Processing Complete!</h2>
              <p className="text-gray-600 text-lg mb-8">
                All {selectedFiles.length} files have been successfully analyzed
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-blue-50 rounded-xl">
                  <p className="text-3xl font-bold text-blue-600 mb-2">{selectedFiles.length}</p>
                  <p className="text-sm text-gray-600">Files Processed</p>
                </div>
                <div className="p-6 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600 mb-2">
                    {files.filter(f => selectedFiles.includes(f.id) && f.pages).reduce((acc, f) => acc + (f.pages || 0), 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Pages</p>
                </div>
                <div className="p-6 bg-purple-50 rounded-xl">
                  <p className="text-3xl font-bold text-purple-600 mb-2">100%</p>
                  <p className="text-sm text-gray-600">Success Rate</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleCreateProject}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all shadow-lg"
                >
                  <FolderOpen size={20} />
                  Save Project
                </button>
                <button
                  onClick={startNewProject}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg flex items-center gap-2 transition-all shadow-lg"
                >
                  <Plus size={20} />
                  Start New Project
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Processed Files</h3>
              <div className="space-y-3">
                {files.filter(f => selectedFiles.includes(f.id)).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-500" />
                      <div>
                        <p className="font-medium text-gray-900">{file.file.name}</p>
                        <p className="text-sm text-gray-600">{file.pages} pages • {file.language}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Completed
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}