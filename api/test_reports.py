#!/usr/bin/env python3
"""Quick test to verify repository returns files"""
import sys
sys.path.insert(0, '/app')

from app.repositories.report_repo import ReportRepository, OriginalFileRepository

# Get all reports
reports = ReportRepository.get_all()
print(f"Total reports: {len(reports)}")

for report in reports:
    print(f"\nReport: {report['report_name']} (ID: {report['id']})")
    print(f"  Bank: {report['bank_name']}")
    print(f"  Files included in report dict: {len(report.get('files', []))}")
    
    # Also fetch directly
    direct_files = OriginalFileRepository.get_by_report(report['id'])
    print(f"  Files from direct fetch: {len(direct_files)}")
    
    if report.get('files'):
        for file in report['files'][:3]:  # Show first 3
            print(f"    - {file.get('file_name')} ({file.get('file_size_mb', 'Unknown')} MB)")
