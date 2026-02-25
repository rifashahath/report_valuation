import React, { useMemo } from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Upload,
    FolderOpen,
    TrendingUp,
    ArrowRight,
    Search,
    Filter
} from 'lucide-react';
import { DashboardStats, ValuationReport, ReportStatus, PropertyType } from '../types';
import { formatDate } from '../utils/formatDate';
import { mockDashboardStats } from '../data/mockData';
import { useNavigate } from "react-router-dom";
import { useReports } from '../hooks/useReports';
import { ApiReport } from '../apis/report.api';

export default function DashboardPage() {
    const { data: reportsData, isLoading } = useReports();
    const navigate = useNavigate();

    // Stats calculation based on real data
    const stats: DashboardStats = useMemo(() => {
        if (!reportsData?.reports) return mockDashboardStats;

        const reports = reportsData.reports;
        return {
            totalReports: reports.length,
            draftReports: reports.filter(r => r.status === 'draft').length,
            reviewReports: reports.filter(r => r.status === 'review').length,
            approvedReports: reports.filter(r => r.status === 'approved').length,
            recentUploads: reports.filter(r => {
                const diff = new Date().getTime() - new Date(r.created_at).getTime();
                return diff < 7 * 24 * 60 * 60 * 1000;
            }).length
        };
    }, [reportsData]);

    const recentReports: ValuationReport[] = useMemo(() => {
        if (!reportsData?.reports) return [];

        return reportsData.reports
            .slice(0, 5) // Show only latest 5
            .map((r: ApiReport) => ({
                id: r.id,
                customerName: r.customer_name || r.name || (r as any).property_owner || r.bank_name || 'Untitled Report',
                bankName: r.bank_name || 'Unknown Bank',
                propertyType: (r.property_type as PropertyType) || 'Residential',
                location: r.location || 'Unknown Location',
                status: (r.status as ReportStatus) || 'draft',
                createdAt: new Date(r.created_at),
                updatedAt: new Date(r.updated_at),
                year: new Date(r.created_at).getFullYear().toString(),
                month: (new Date(r.created_at).getMonth() + 1).toString().padStart(2, '0'),
                files: [], // Not needed for dashboard table
                metadata: {} as any,
                content: {} as any,
                comments: [],
                auditTrail: [],
            }));
    }, [reportsData]);

    const statCards = [
        {
            label: 'Total Reports',
            value: stats.totalReports,
            icon: <FileText size={20} />,
            color: 'text-brand-600',
            bg: 'bg-brand-50',
            border: 'border-brand-100',
            trend: '+12%'
        },
        {
            label: 'Draft',
            value: stats.draftReports,
            icon: <Clock size={20} />,
            color: 'text-amber-500',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
            trend: '+5%'
        },
        {
            label: 'In Review',
            value: stats.reviewReports,
            icon: <AlertCircle size={20} />,
            color: 'text-orange-500',
            bg: 'bg-orange-50',
            border: 'border-orange-100',
            trend: 'Pending'
        },
        {
            label: 'Approved',
            value: stats.approvedReports,
            icon: <CheckCircle size={20} />,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            trend: 'Verified'
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
            case 'review': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30';
            case 'approved': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
            default: return 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-700/50';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Overview</h1>
                    <p className="text-slate-600 dark:text-slate-400 font-semibold mt-1">Welcome back, monitor your recent Valuation activities.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-base focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none w-80 shadow-sm transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                    </div>
                    <button className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                        <Filter size={20} />
                    </button>
                    <button
                        onClick={() => navigate('upload')}
                        className="bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl text-base font-bold flex items-center gap-2 shadow-lg shadow-slate-200 dark:shadow-brand-900/20 transition-all hover:-translate-y-0.5"
                    >
                        <Upload size={18} />
                        New Analysis
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((card, index) => (
                    <div
                        key={card.label}
                        className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-brand-900/10 transition-all duration-500 relative overflow-hidden"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className={`${card.bg} dark:bg-slate-800 ${card.color} ${card.border} dark:border-slate-700 p-4 rounded-2xl border group-hover:scale-110 transition-transform duration-500`}>
                                {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2">{card.label}</span>
                                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{card.value}</span>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center justify-between relative z-10">
                            <div className={`text-xs font-bold px-3 py-1 rounded-full ${card.trend.includes('+') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                {card.trend}
                            </div>
                            <TrendingUp size={16} className="text-slate-300 dark:text-slate-700" />
                        </div>
                        {/* Subtle bg decoration */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${card.bg} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700`} />
                    </div>
                ))}
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tables / Recent Reports */}
                <div className="lg:col-span-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">Track your latest generated reports and their status.</p>
                        </div>
                        <button
                            onClick={() => navigate('files')}
                            className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 px-6 py-2.5 rounded-xl transition-all border border-brand-100 dark:border-brand-900/30 active:scale-95"
                        >
                            View Full History
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] w-1/4">
                                        Customer / Report
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                        Bank / Issuer
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                        Property Details
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                        Status
                                    </th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                                        Last Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {recentReports.length > 0 ? recentReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-all group"
                                        onClick={() => navigate(`/upload/${report.id}`)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold text-sm group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                                    {report.customerName[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{report.customerName}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-500 font-bold truncate uppercase tracking-tight mt-0.5">{report.id.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-base text-slate-600 dark:text-slate-400 font-bold tracking-tight">{report.bankName}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-base text-slate-600 dark:text-slate-400 font-semibold tracking-tight">{report.propertyType}</div>
                                            <div className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">{report.location}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${getStatusColor(report.status)} shadow-sm`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-base text-slate-900 dark:text-white font-bold">{formatDate(report.updatedAt, 'short')}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wide">Last active</div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                            No reports found. Start by creating a new analysis!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Empty state footer or more reports hint */}
                    <div className="px-6 py-4 bg-slate-50/20 dark:bg-slate-800/10 border-t border-slate-50 dark:border-slate-800 flex justify-center">
                        <button
                            onClick={() => navigate('files')}
                            className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-2"
                        >
                            Load More Reports <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
