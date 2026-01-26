import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import ReportEditor from '../components/report/ReportEditor';
import { ValuationReport } from '../types';
import { useReport, useUpdateReport } from '../hooks/useReports';
import { Loader } from '../components/common/Loader';

export default function ReportEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Fetch report using hook
  const { data: report, isLoading, error } = useReport(id);
  const updateReport = useUpdateReport();

  const handleBack = () => {
    navigate('/');
  };

  const handleSave = async (reportId: string, content: ValuationReport['content']) => {
    try {
      await updateReport.mutateAsync({
        reportId,
        data: { content }
      });
      toast.success("Report saved successfully");
    } catch (e) {
      toast.error("Failed to save report");
      console.error(e);
    }
  };

  const handleSendForReview = async (reportId: string) => {
    try {
      await updateReport.mutateAsync({
        reportId,
        data: { status: 'review' }
      });
      toast.success("Sent for review");
      navigate(`/reports/${reportId}/review`);
    } catch (e) {
      toast.error("Failed to update status");
      console.error(e);
    }
  };

  if (isLoading) return <Loader fullScreen text="Loading report..." />;
  if (error || !report) return <div className="p-8 text-center text-red-600">Failed to load report or report not found.</div>;

  return (
    <ReportEditor
      report={report}
      onBack={handleBack}
      onSave={handleSave}
      onSendForReview={handleSendForReview}
    />
  );
}
