import { useNavigate } from 'react-router-dom';
import FileManagement from '../components/report/FileManagement';
import { mockReports, buildFileTree } from '../data/mockData';

export default function ReportsPage() {
    const reports = mockReports;
    const fileTree = buildFileTree(reports);
     const navigate = useNavigate();
    return (
        <FileManagement
            fileTree={fileTree}
            reports={reports}
            onNavigate={navigate({})}
        />
    );
}
