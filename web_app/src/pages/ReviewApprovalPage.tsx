import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  Clock,
  ChevronLeft,
  History,
} from 'lucide-react';

import { ReportStatus } from '../types';
import { formatDate } from '../utils/formatDate';
import { useReport, useUpdateReport } from '../hooks/useReports';
import reportsApi from '../apis/reports.api';
import { Loader } from '../components/common/Loader';

export default function ReviewApprovalPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: report, isLoading, error, refetch } = useReport(id);
  const updateReport = useUpdateReport();

  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleBack = () => {
    navigate('/');
  };

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    try {
      await updateReport.mutateAsync({
        reportId,
        data: { status }
      });
      toast.success(`Report status updated to ${status}`);
      refetch();
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleExport = async (reportId: string, format: 'pdf' | 'docx') => {
    setIsExporting(true);
    try {
      let blob;
      if (format === 'pdf') {
        blob = await reportsApi.exportPdf(reportId);
      } else {
        blob = await reportsApi.exportDocx(reportId);
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report?.customerName || 'report'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (e) {
      toast.error("Failed to export report");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <Loader fullScreen text="Loading report..." />;
  if (error || !report) {
    return (
      <div className="p-8">
        <div className="bg-white border rounded-lg p-12 text-center">
          <p className="text-gray-600">Report not found</p>
          <button onClick={handleBack} className="mt-4 text-blue-600 hover:underline">
            Go to Dashboard
          </button>
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
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
      <div className="bg-white border-b px-8 py-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft size={20} />
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAuditTrail(!showAuditTrail)}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white"
            >
              <History size={18} />
              Audit Trail
            </button>

            <button
              onClick={() => handleExport(report.id, 'pdf')}
              disabled={isExporting}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'PDF'}
            </button>
            <button
              onClick={() => handleExport(report.id, 'docx')}
              disabled={isExporting}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 bg-white disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'DOCX'}
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold">{report.customerName}</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-600">
          <span>{report.bankName}</span>
          <span>•</span>
          <span>{report.propertyType}</span>
          <span>•</span>
          <span>{report.location}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-50 p-8">
          <div className="bg-white border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Report Status</h2>

            <div className="flex justify-between mb-6">
              {statusWorkflow.map((item, index) => (
                <div key={item.status} className="flex items-center flex-1">
                  <button
                    onClick={() => handleStatusChange(report.id, item.status)}
                    className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-colors
                      ${report.status === item.status
                        ? getStatusColor(item.status)
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                  {index < statusWorkflow.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2" />
                  )}
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600">
              <strong>Updated:</strong> {formatDate(report.updatedAt, 'long')}
            </p>
          </div>

          {/* Placeholder for future Audit Trail or other components */}
          {showAuditTrail && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-4">Audit Trail</h3>
              <p className="text-gray-500">Audit trail implementation coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
