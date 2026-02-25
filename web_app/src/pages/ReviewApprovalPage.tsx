import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Clock,
  ChevronLeft,
  History,
} from 'lucide-react';

import { ValuationReport, ReportStatus } from '../types';
import { formatDate } from '../utils/formatDate';
import { mockReports } from '../data/mockData';

export default function ReviewApprovalPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [reports, setReports] = useState<ValuationReport[]>(mockReports);
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  const report = id
    ? reports.find(r => r.id === id) || null
    : null;

  const handleBack = () => {
    navigate('/');
  };

  const handleStatusChange = (reportId: string, status: ReportStatus) => {
    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? { ...r, status, updatedAt: new Date() }
          : r
      )
    );
  };

  const handleExport = (reportId: string, format: 'pdf' | 'docx') => {
    const r = reports.find(rep => rep.id === reportId);
    if (r) {
      alert(`Exporting ${r.customerName}'s report as ${format.toUpperCase()}`);
    }
  };

  if (!report) {
    return (
      <div className="p-8">
        <div className="bg-white border border-secondary-200 rounded-lg p-12 text-center">
          <p className="text-secondary-600">Report not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const statusWorkflow: { status: ReportStatus; label: string; icon: JSX.Element }[] = [
    { status: 'draft', label: 'Draft', icon: <Clock size={16} /> },
    { status: 'review', label: 'Under Review', icon: <FileText size={16} /> },
    { status: 'approved', label: 'Approved', icon: <CheckCircle size={16} /> },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-secondary-200 px-10 py-8 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-3 text-secondary-500 hover:text-brand-600 font-bold transition-all hover:-translate-x-1"
          >
            <ChevronLeft size={28} />
            <span className="text-lg">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="flex items-center gap-3 px-6 py-3 border-2 border-secondary-100 rounded-2xl hover:bg-secondary-50 transition-all font-bold text-secondary-700 shadow-sm hover:shadow"
            >
              <History size={22} />
              Audit Trail
            </button>

            <button
              onClick={() => handleExport(report.id, 'pdf')}
              className="px-6 py-3 bg-brand-50 text-brand-700 border-2 border-brand-100 rounded-2xl hover:bg-brand-100 transition-all font-bold shadow-sm hover:shadow"
            >
              Export PDF
            </button>
            <button
              onClick={() => handleExport(report.id, 'docx')}
              className="px-6 py-3 bg-brand-50 text-brand-700 border-2 border-brand-100 rounded-2xl hover:bg-brand-100 transition-all font-bold shadow-sm hover:shadow"
            >
              Export DOCX
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-black text-secondary-900 tracking-tight">{report.customerName}</h1>
        <div className="flex items-center gap-5 mt-3 text-sm font-bold text-secondary-500">
          <span className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
            {report.bankName}
          </span>
          <span className="w-1 h-1 rounded-full bg-secondary-200"></span>
          <span>{report.propertyType}</span>
          <span className="w-1 h-1 rounded-full bg-secondary-200"></span>
          <span>{report.location}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-50/50 p-8">
          <div className="bg-white border border-secondary-100 rounded-2xl p-6 mb-8 shadow-md">
            <h2 className="text-xl font-black text-secondary-900 mb-6 border-b border-secondary-50 pb-3">Report Status</h2>

            <div className="flex justify-between items-center mb-8 gap-3">
              {statusWorkflow.map((item, index) => (
                <div key={item.status} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => handleStatusChange(report.id, item.status)}
                    className={`flex items-center gap-2 px-6 py-3 border-2 rounded-xl transition-all font-black text-sm shadow-sm
                      ${report.status === item.status
                        ? getStatusColor(item.status) + ' shadow-md'
                        : 'border-secondary-100 text-secondary-400 hover:bg-secondary-50 hover:border-secondary-200'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                  {index < statusWorkflow.length - 1 && (
                    <div className="flex-1 h-0.5 bg-secondary-100 mx-3 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-secondary-500 font-bold bg-secondary-50 px-3 py-1.5 rounded-lg border border-secondary-100 inline-flex">
              <Clock size={16} />
              <span>Last Updated:</span>
              <span className="text-secondary-900">{formatDate(report.updatedAt, 'long')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
