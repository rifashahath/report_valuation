import React, { useMemo } from 'react';
import {
    FileText,
    Clock,
    CheckCircle,
    AlertCircle,
    Upload,
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
            color: 'text-brand-600 dark:text-brand-400',
            bg: 'bg-brand-100 dark:bg-brand-400/10',
            border: 'border-brand-200 dark:border-brand-400/20',
            circleBg: 'bg-brand-300 dark:bg-brand-400/10',
            trendColor: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            trend: '+12%'
        },
        {
            label: 'Draft',
            value: stats.draftReports,
            icon: <Clock size={20} />,
            color: 'text-amber-500 dark:text-amber-400',
            bg: 'bg-amber-100 dark:bg-amber-400/10',
            border: 'border-amber-200 dark:border-amber-400/20',
            circleBg: 'bg-amber-300 dark:bg-amber-400/10',
            trendColor: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            trend: '+5%'
        },
        {
            label: 'In Review',
            value: stats.reviewReports,
            icon: <AlertCircle size={20} />,
            color: 'text-orange-500 dark:text-orange-400',
            bg: 'bg-orange-100 dark:bg-orange-400/10',
            border: 'border-orange-200 dark:border-orange-400/20',
            circleBg: 'bg-orange-300 dark:bg-orange-400/10',
            trendColor: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400',
            trend: 'Pending'
        },
        {
            label: 'Approved',
            value: stats.approvedReports,
            icon: <CheckCircle size={20} />,
            color: 'text-emerald-500 dark:text-emerald-400',
            bg: 'bg-emerald-100 dark:bg-emerald-400/10',
            border: 'border-emerald-200 dark:border-emerald-400/20',
            circleBg: 'bg-emerald-300 dark:bg-emerald-400/10',
            trendColor: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
            trend: 'Verified'
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
            case 'review': return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30';
            case 'approved': return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30';
            default: return 'bg-slate-50 dark:bg-night-800/50 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-night-800/50';
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
                    <p className="text-slate-600 dark:text-slate-300 font-semibold mt-1">Welcome back, monitor your recent Valuation activities.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-night-900 border border-brand-200 dark:border-night-800 rounded-xl text-base focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none w-80 shadow-sm transition-all font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        />
                    </div>
                    <button className="p-2.5 bg-white dark:bg-night-900 border border-brand-200 dark:border-night-800 rounded-xl text-brand-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-night-800 transition-all shadow-sm">
                        <Filter size={20} />
                    </button>
                    <button
                        onClick={() => navigate('upload')}
                        className="bg-gradient-to-r from-brand-700 to-brand-900 hover:from-brand-800 hover:to-brand-950 dark:from-brand-600 dark:to-brand-800 text-white px-6 py-2.5 rounded-xl text-base font-bold flex items-center gap-2 shadow-lg shadow-brand-300/40 dark:shadow-brand-900/20 transition-all hover:-translate-y-0.5"
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
                        className="group bg-white dark:bg-night-900 rounded-2xl border border-brand-100 dark:border-night-800 p-6 shadow-lg hover:shadow-2xl hover:shadow-brand-200/40 dark:shadow-none dark:hover:shadow-brand-900/10 transition-all duration-500 relative overflow-hidden hover:border-brand-200 dark:hover:border-slate-700 isolate"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className={`${card.bg} ${card.color} ${card.border} p-4 rounded-2xl border group-hover:scale-110 transition-transform duration-500 shadow-md dark:shadow-none`}>
                                {React.cloneElement(card.icon as React.ReactElement, { size: 24 })}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em] mb-2">{card.label}</span>
                                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{card.value}</span>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center justify-between relative z-10">
                            <div className={`text-xs font-bold px-3 py-1 rounded-full ${card.trendColor}`}>
                                {card.trend}
                            </div>
                            <TrendingUp size={16} className={`${card.color} opacity-60`} />
                        </div>
                        {/* Decorative orb — prominent in both modes */}
                        <div className={`absolute -right-6 -bottom-6 w-28 h-28 ${card.circleBg} rounded-full opacity-35 dark:opacity-40 group-hover:scale-125 transition-transform duration-700 flex items-end justify-start p-4 -z-10`}>
                            {/* Removed the extra TrendingUp icon from inside the orb as it was duplicating and spilling out */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Tables / Recent Reports */}
                <div className="lg:col-span-12 bg-white dark:bg-night-900 rounded-2xl border border-brand-100 dark:border-night-800 shadow-md dark:shadow-none overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-50 dark:border-night-800 bg-slate-50/30 dark:bg-night-900/50 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recent Activity</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-300 font-semibold mt-1">Track your latest generated reports and their status.</p>
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
                                <tr className="bg-slate-50/50 dark:bg-night-800/50 border-b border-slate-100 dark:border-night-800">
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em] w-1/4">
                                        Customer / Report
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em]">
                                        Bank / Issuer
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em]">
                                        Property Details
                                    </th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em]">
                                        Status
                                    </th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-[0.15em]">
                                        Last Updated
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {recentReports.length > 0 ? recentReports.map((report) => (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-brand-50/30 dark:hover:bg-night-800/50 cursor-pointer transition-all group"
                                        onClick={() => navigate(`/upload/${report.id}`)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-night-800 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-sm group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                                                    {report.customerName[0]}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{report.customerName}</div>
                                                    <div className="text-xs text-slate-400 dark:text-slate-400 font-bold truncate uppercase tracking-tight mt-0.5">{report.id.substring(0, 8)}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-base text-slate-600 dark:text-slate-300 font-bold tracking-tight">{report.bankName}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="text-base text-slate-600 dark:text-slate-300 font-semibold tracking-tight">{report.propertyType}</div>
                                            <div className="text-sm text-slate-400 dark:text-slate-400 font-medium mt-0.5">{report.location}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border ${getStatusColor(report.status)} shadow-sm`}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="text-base text-slate-900 dark:text-white font-bold">{formatDate(report.updatedAt, 'short')}</div>
                                            <div className="text-xs text-slate-400 dark:text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">Last active</div>
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
                    <div className="px-6 py-4 bg-slate-50/20 dark:bg-night-800/10 border-t border-slate-50 dark:border-night-800 flex justify-center">
                        <button
                            onClick={() => navigate('files')}
                            className="text-slate-400 dark:text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-2"
                        >
                            Load More Reports <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
