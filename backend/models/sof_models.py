"""
Enhanced data models for the new SoF pipeline integration
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from datetime import datetime

class UploadRequest(BaseModel):
    """Enhanced upload request model"""
    use_enhanced_processing: Optional[bool] = Field(default=False, description="Use enhanced clicked PDF processing")

class EventData(BaseModel):
    """Individual event data structure"""
    event: str = Field(description="Event description")
    start_time_iso: Optional[str] = Field(description="Start time in ISO format")
    end_time_iso: Optional[str] = Field(description="End time in ISO format")
    date: Optional[str] = Field(description="Display date")
    duration: Optional[str] = Field(description="Duration string")
    laytime: Optional[str] = Field(description="Laytime calculation")
    laytime_counts: Optional[bool] = Field(description="Whether this event counts as laytime")
    raw_line: Optional[str] = Field(description="Raw text line from document")
    filename: Optional[str] = Field(description="Source filename")

class VoyageSummary(BaseModel):
    """Voyage summary data structure"""
    created_for: Optional[str] = Field(None, alias="CREATED FOR")
    voyage_from: Optional[str] = Field(None, alias="VOYAGE FROM")
    voyage_to: Optional[str] = Field(None, alias="VOYAGE TO")
    cargo: Optional[str] = Field(None, alias="CARGO")
    port: Optional[str] = Field(None, alias="PORT")
    operation: Optional[str] = Field(None, alias="OPERATION")
    demurrage: Optional[float] = Field(None, alias="DEMURRAGE")
    dispatch: Optional[float] = Field(None, alias="DISPATCH")
    load_disch: Optional[float] = Field(None, alias="LOAD/DISCH")
    cargo_qty: Optional[float] = Field(None, alias="CARGO QTY")

class LaytimeCalculation(BaseModel):
    """Laytime calculation request"""
    summary: Dict[str, Any] = Field(description="Voyage summary data")
    events: List[Dict[str, Any]] = Field(description="Event data for calculation")

class LaytimeResult(BaseModel):
    """Laytime calculation result"""
    laytime_allowed_days: float = Field(description="Allowed laytime in days")
    laytime_consumed_days: float = Field(description="Consumed laytime in days")
    laytime_saved_days: float = Field(description="Saved laytime in days")
    demurrage_due: float = Field(description="Demurrage amount due")
    dispatch_due: float = Field(description="Dispatch amount due")
    calculation_log: List[str] = Field(description="Calculation steps log")

class ProcessingResult(BaseModel):
    """Processing result structure"""
    job_id: str = Field(description="Job identifier")
    status: str = Field(description="Processing status")
    events: List[EventData] = Field(description="Extracted events")
    summary: VoyageSummary = Field(description="Voyage summary")
    processed_at: str = Field(description="Processing timestamp")
    has_laytime_data: bool = Field(description="Whether laytime calculation is available")

class JobStatus(BaseModel):
    """Job status tracking"""
    job_id: str
    status: str
    user: str
    uploaded_at: str
    filename: Optional[str] = None  # Legacy single file support
    filenames: Optional[List[str]] = None  # Multiple file support
    total_files: Optional[int] = 1
    successful_files: Optional[int] = 0
    processed_files: Optional[List[str]] = None
    batch_name: Optional[str] = None  # Optional batch identifier
    events: Optional[List[Dict]] = None
    summary: Optional[Dict] = None
    error: Optional[str] = None
    processed_at: Optional[str] = None
    failed_at: Optional[str] = None

class MultipleUploadResponse(BaseModel):
    """Response model for multiple file uploads"""
    message: str
    job_id: str
    filenames: List[str]
    total_files: int
    enhanced_processing: bool
    batch_name: Optional[str] = None
    batch_size: Optional[int] = None

class BatchProcessingResult(BaseModel):
    """Result model for batch processing"""
    job_id: str
    status: str
    filenames: List[str]
    total_files: int
    processed_files: List[str]
    successful_files: int
    events: List[EventData]
    summary: VoyageSummary
    processed_at: str
    has_laytime_data: bool
    batch_name: Optional[str] = None
