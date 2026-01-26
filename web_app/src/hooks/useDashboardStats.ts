import { useMemo } from 'react';
import { useReports } from './useReports';
import { DashboardStats } from '../types';

export function useDashboardStats() {
    const { data: reports = [], isLoading, error } = useReports();

    const stats: DashboardStats = useMemo(() => {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        return {
            totalReports: reports.length,
            draftReports: reports.filter(r => r.status === 'draft').length,
            reviewReports: reports.filter(r => r.status === 'review').length,
            approvedReports: reports.filter(r => r.status === 'approved').length,
            recentUploads: reports.filter(r => new Date(r.createdAt) > last7Days).length
        };
    }, [reports]);

    return { stats, isLoading, error, recentReports: reports.slice(0, 10) };
}
