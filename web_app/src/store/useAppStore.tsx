import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ValuationReport, ReportStatus } from '../types';
import { mockReports, mockDashboardStats } from '../data/mockData';

interface AppState {
    currentPage: string;
    selectedReportId: string | null;
    currentUploadReportId: string | null;
    reports: ValuationReport[];
    dashboardStats: typeof mockDashboardStats;
}

interface AppContextType extends AppState {
    setCurrentPage: (page: string) => void;
    setSelectedReportId: (id: string | null) => void;
    setCurrentUploadReportId: (id: string | null) => void;
    updateReport: (reportId: string, content: ValuationReport['content']) => void;
    updateReportStatus: (reportId: string, status: ReportStatus) => void;
    addReport: (report: ValuationReport) => void;
    selectedReport: ValuationReport | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppStoreProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AppState>({
        currentPage: 'dashboard',
        selectedReportId: null,
        currentUploadReportId: localStorage.getItem('current_upload_report_id'),
        reports: mockReports,
        dashboardStats: mockDashboardStats,
    });

    const setCurrentPage = (page: string) => {
        setState(prev => ({ ...prev, currentPage: page }));
    };

    const setSelectedReportId = (id: string | null) => {
        setState(prev => ({ ...prev, selectedReportId: id }));
    };

    const setCurrentUploadReportId = (id: string | null) => {
        if (id) {
            localStorage.setItem('current_upload_report_id', id);
        } else {
            localStorage.removeItem('current_upload_report_id');
        }
        setState(prev => ({ ...prev, currentUploadReportId: id }));
    };

    const updateReport = (reportId: string, content: ValuationReport['content']) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.map(report =>
                report.id === reportId
                    ? { ...report, content, updatedAt: new Date() }
                    : report
            ),
        }));
    };

    const updateReportStatus = (reportId: string, status: ReportStatus) => {
        setState(prev => ({
            ...prev,
            reports: prev.reports.map(report =>
                report.id === reportId
                    ? { ...report, status, updatedAt: new Date() }
                    : report
            ),
        }));
    };

    const addReport = (report: ValuationReport) => {
        setState(prev => ({
            ...prev,
            reports: [report, ...prev.reports],
        }));
    };

    const getSelectedReport = (): ValuationReport | null => {
        if (!state.selectedReportId) return null;
        return state.reports.find(r => r.id === state.selectedReportId) || null;
    };

    const value = {
        ...state,
        selectedReport: getSelectedReport(),
        setCurrentPage,
        setSelectedReportId,
        setCurrentUploadReportId,
        updateReport,
        updateReportStatus,
        addReport,
    };

    return <AppContext.Provider value={value}> {children} </AppContext.Provider>;
}

export function useAppStore() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppStore must be used within an AppStoreProvider');
    }
    return context;
}
