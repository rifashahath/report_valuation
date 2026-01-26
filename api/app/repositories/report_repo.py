"""
Report repository - database operations for reports
"""

from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from app.db.session import db, reports, original_files, ai_extracted_content, final_reports


class ReportRepository:
    
    @staticmethod
    def create_report(
        report_name: str,
        bank_name: str,
        user_id: str,
        created_by: str,
        property_type: str = "Residential",
        location: str = "",
        status: str = "draft"
        ) -> dict:
        """Create a new report"""
        now = datetime.utcnow()
        doc = {
            "report_name": report_name,
            "bank_name": bank_name,
            "property_type": property_type,
            "location": location,
            "status": status,
            "user_id": ObjectId(user_id),
            "created_by": ObjectId(created_by),
            "updated_by": ObjectId(created_by),
            "created_at": now,
            "updated_at": now
        }
        result = reports.insert_one(doc)
        return ReportRepository.get_by_id(str(result.inserted_id))
    
    @staticmethod
    def get_by_id(report_id: str) -> Optional[dict]:
        """Get report by ID"""
        try:
            report = reports.find_one({"_id": ObjectId(report_id)})
            if report:
                report["id"] = str(report["_id"])
                report["user_id"] = str(report["user_id"])
                if "content" not in report:
                    report["content"] = {}
            return report
        except:
            return None
    
    @staticmethod
    def get_all(user_id: str = None) -> list:
        query = {}
        if user_id:
            query["user_id"] = ObjectId(user_id)

        result = []
        for report in reports.find(query):
            result.append({
            "id": str(report["_id"]),
            "report_name": report.get("report_name"),
            "bank_name": report.get("bank_name"),
            "property_type": report.get("property_type"),
            "location": report.get("location"),
            "status": report.get("status", "draft"),
            "content": report.get("content", {}),
            "user_id": str(report.get("user_id")),
            "created_at": report.get("created_at"),
            "updated_at": report.get("updated_at")
            })
        return result
        
    @staticmethod
    def update(report_id: str, data: dict, updated_by: str) -> Optional[dict]:
        """Update report fields"""
        try:
            update_data = {
                "updated_by": ObjectId(updated_by),
                "updated_at": datetime.utcnow()
            }
            
            # Allow updating specific fields
            if "report_name" in data:
                update_data["report_name"] = data["report_name"]
            if "content" in data:
                update_data["content"] = data["content"]
            if "status" in data:
                update_data["status"] = data["status"]
            if "property_type" in data:
                update_data["property_type"] = data["property_type"]
            if "location" in data:
                update_data["location"] = data["location"]

            reports.update_one(
            {"_id": ObjectId(report_id)},
            {"$set": update_data}
            )
            return ReportRepository.get_by_id(report_id)
        except:
            return None
    
    @staticmethod
    def exists_by_name(report_name: str, user_id: str = None) -> bool:
        """Check if a report name already exists"""
        query = {"report_name": report_name}
        if user_id:
            query["user_id"] = ObjectId(user_id)

        return reports.count_documents(query) > 0

    @staticmethod
    def delete(report_id: str) -> bool:
        """Delete a report and all related data"""
        oid = ObjectId(report_id)
        # Delete related data
        original_files.delete_many({"report_id": oid})
        ai_extracted_content.delete_many({"report_id": oid})
        final_reports.delete_many({"report_id": oid})
        # Delete report
        result = reports.delete_one({"_id": oid})
        return result.deleted_count > 0


class OriginalFileRepository:
    
    @staticmethod
    def create(report_id: str, file_name: str, file_type: str, 
               file_path: str, created_by: str, file_size_mb: float = None) -> dict:
        """Create an original file record"""
        now = datetime.utcnow()
        doc = {
            "report_id": ObjectId(report_id),
            "file_name": file_name,
            "file_type": file_type,
            "file_path": file_path,
            "file_size_mb": file_size_mb,
            "created_by": ObjectId(created_by),
            "updated_by": ObjectId(created_by),
            "created_at": now,
            "updated_at": now
        }
        result = original_files.insert_one(doc)
        return OriginalFileRepository.get_by_id(str(result.inserted_id))
    
    @staticmethod
    def get_by_id(file_id: str) -> Optional[dict]:
        """Get file by ID"""
        try:
            file = original_files.find_one({"_id": ObjectId(file_id)})
            if file:
                file["id"] = str(file["_id"])
                file["report_id"] = str(file["report_id"])
            return file
        except:
            return None
    
    @staticmethod
    def update_path(file_id: str, file_path: str, updated_by: str) -> Optional[dict]:
        """Update file path"""
        original_files.update_one(
            {"_id": ObjectId(file_id)},
            {"$set": {
                "file_path": file_path,
                "updated_by": ObjectId(updated_by),
                "updated_at": datetime.utcnow()
            }}
        )
        return OriginalFileRepository.get_by_id(file_id)
    
    @staticmethod
    def get_by_report(report_id: str) -> List[dict]:
        """Get all files for a report"""
        result = []
        for file in original_files.find({"report_id": ObjectId(report_id)}):
            file["id"] = str(file["_id"])
            file["report_id"] = str(file["report_id"])
            result.append(file)
        return result
    
    @staticmethod
    def delete(file_id: str) -> bool:
        """Delete a document record"""
        try:
            result = original_files.delete_one(
            {"_id": ObjectId(file_id)}
            )
            return result.deleted_count > 0
        except:
            return False
        
    @staticmethod
    def update_file_content(file_id: str, content: str, updated_by: str) -> bool:
        result = original_files.update_one(
            {"_id": ObjectId(file_id)},
            {"$set": {
                "file_content": content,
                "updated_by": ObjectId(updated_by),
                "updated_at": datetime.utcnow()
            }}
        )
        return result.modified_count > 0

  
        