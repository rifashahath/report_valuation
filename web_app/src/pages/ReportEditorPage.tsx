import { useNavigate, useParams } from 'react-router-dom';
import ReportEditor from '../components/report/ReportEditor';
import { useReport } from '../hooks/useReports';
import { ValuationReport } from '../types';
import { mapApiReportToValuation } from '../utils/reportMapper';
import Loader from '../components/common/Loader';

export default function ReportEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { data: apiData, isLoading, error } = useReport(id);

  const selectedReport = apiData ? mapApiReportToValuation(apiData) : null;

  const handleBack = () => {
    navigate('/files');
  };

  const handleSave = async (_reportId: string, content: ValuationReport['content']) => {
    // In a real app, we would send this to the backend
    console.log('Saving report content:', content);
    // updateReportMutation.mutate({ reportId, data: { content } });
  };

  const handleSendForReview = async (reportId: string) => {
    // updateReportMutation.mutate({ reportId, data: { status: 'review' } });
    navigate(`/reports/${reportId}/review`);
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error || (!isLoading && !selectedReport)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Failed to load report</h2>
        <p className="text-gray-600 mt-2">The report you are looking for might not exist or you don't have permission to view it.</p>
        <button
          onClick={() => navigate('/files')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg"
        >
          Go to Reports
        </button>
      </div>
    );
  }

  return (
    <ReportEditor
      report={selectedReport}
      onBack={handleBack}
      onSave={handleSave}
      onSendForReview={handleSendForReview}
    />
  );
}
