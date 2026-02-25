import { useState, useMemo } from 'react';
import { ArrowRight, Building2, FileText } from 'lucide-react';
import { ProjectReport } from './types';
import { useQuery } from '@tanstack/react-query';
import { banksApi } from '../../apis/bank.api';
import { ReactSelectField, Option } from '../common/ReactSelectField';

interface ProjectNameStepProps {
  projectName: string;
  setProjectName: (name: string) => void;
  bankName: string;
  setBankName: (name: string) => void;
  onNext: () => void;
  recentProjects: ProjectReport[];
}

const INDIAN_BANKS = [

  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "IDBI Bank",
  "Federal Bank",
  "IDFC First Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "City Union Bank",
  "Tamilnad Mercantile Bank",
  "Karnataka Bank",
  "Dhanlaxmi Bank"
];

export default function ProjectNameStep({
  projectName,
  setProjectName,
  bankName,
  setBankName,
  onNext,
  recentProjects
}: ProjectNameStepProps) {
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);

  const { data: banksData } = useQuery({
    queryKey: ['banks'],
    queryFn: banksApi.getBanks
  });

  const banks = Array.isArray(banksData) ? banksData : (banksData as any)?.banks || [];
  console.log(banks);

  const handleProjectNameSubmit = () => {
    if (projectName?.trim() && bankName?.trim()) {
      onNext();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Combine static Indian banks with dynamic banks from API
  const allBankOptions = useMemo(() => {
    // Get bank names from API if available
    const apiBankNames = banks?.map((bank: any) => bank.name) || [];

    // Combine both lists and remove duplicates
    const allBanks = [...INDIAN_BANKS, ...apiBankNames];
    const uniqueBanks = Array.from(new Set(allBanks));

    // Convert to Option format
    return uniqueBanks.map((bank) => ({
      label: bank,
      value: bank,
    }));
  }, [banks]);

  const selectedBank = useMemo(() => {
    if (!bankName) return null;
    return { label: bankName, value: bankName };
  }, [bankName]);

  const handleBankChange = (value: Option | Option[] | null) => {
    if (value && !Array.isArray(value)) {
      setBankName(value.value);
    } else {
      setBankName('');
    }
  };

  const handleRecentProjectClick = (project: ProjectReport) => {
    setProjectName(project.name);
    setBankName(project.bankName || '');
  };
  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
          Start New Analysis
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Enter the details below to initialize your report
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">
        {/* Bank Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Bank Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
              <Building2 size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <ReactSelectField
              options={allBankOptions}
              value={selectedBank}
              onChange={handleBankChange}
              placeholder="Select or type bank name..."
              isClearable
            />
          </div>
        </div>

        {/* Report Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Report Name
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <FileText size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleProjectNameSubmit()}
              placeholder="e.g. Valuation Report - Jan 2024"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder-slate-400 dark:text-white"
            />
          </div>
        </div>

        <button
          onClick={handleProjectNameSubmit}
          disabled={!projectName?.trim() || !bankName?.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
        >
          Create Report
          <ArrowRight size={18} />
        </button>
      </div>

      {recentProjects.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Recent Reports
            </span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          </div>

          <div className="grid gap-3">
            {recentProjects.slice(0, 3).map((project) => (
              <div
                key={project.id}
                onClick={() => handleRecentProjectClick(project)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleRecentProjectClick(project);
                  }
                }}
                role="button"
                tabIndex={0}
                className="group p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {project.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(project.createdAt)} • {project.fileCount || 0} files
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}