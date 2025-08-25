"""
SoF Event Extractor Backend API
FastAPI application for processing maritime Statement of Facts documents with authentication
"""

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Depends, Form, Query
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from pydantic import BaseModel
import uvicorn
import os
import uuid
import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import pandas as pd
from pathlib import Path

# Import our new integrated modules
try:
    from utils.sof_pipeline import (
        process_uploaded_files, 
        extract_events_and_summary,
        calculate_laytime,
        process_clicked_pdf_enhanced,
        LaytimeResult as SofLaytimeResult
    )
    print("✅ SoF Pipeline modules imported successfully")
except ImportError as e:
    print(f"⚠️ Warning: SoF Pipeline modules failed to import: {e}")
    process_uploaded_files = None
    extract_events_and_summary = None
    calculate_laytime = None
    process_clicked_pdf_enhanced = None
    SofLaytimeResult = None

# Import authentication modules
from utils.auth import (
    get_password_hash, verify_password, create_access_token, 
    get_current_user, validate_password_strength, validate_email,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from utils.user_models import (
    User, UserCreate, UserLogin, UserResponse, Token,
    user_db
)
from models.sof_models import (
    UploadRequest, EventData, VoyageSummary, LaytimeCalculation,
    LaytimeResult, ProcessingResult, JobStatus as JobStatusModel
)
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Pydantic models for API requests
class ExportRequest(BaseModel):
    events: List[Dict] = []

# Initialize FastAPI app
app = FastAPI(
    title="SoF Event Extractor API with Authentication",
    description="AI-powered maritime document processing for Statement of Facts with user authentication",
    version="2.0.0"
)

# Configure CORS for frontend integration
cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://sof-extractor-frontend.onrender.com",
    "https://*.onrender.com",  # Allow all Render subdomains
]

# Add any additional origins from environment variable
if os.getenv("CORS_ORIGINS"):
    additional_origins_str = os.getenv("CORS_ORIGINS")
    # Split by comma and strip whitespace
    additional_origins = [origin.strip() for origin in additional_origins_str.split(',')]
    cors_origins.extend(additional_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
# Directories (allow override via environment variables for deployment)
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", 10 * 1024 * 1024))  # default 10MB
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
RESULTS_DIR = Path(os.getenv("RESULTS_DIR", "results"))
# Ensure dirs exist (create parent directories when deploying with mounted volumes)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# No longer need these old processors - using integrated SoF pipeline
print("🚀 Using integrated SoF Pipeline for document processing")

# In-memory job storage (use database in production)
jobs = {}

class JobStatus:
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "SoF Event Extractor API is running", "status": "healthy"}

@app.get("/health")
async def health():
    """Health check endpoint for Render"""
    return {"status": "healthy", "service": "sof-event-extractor-backend"}

# Authentication endpoints
@app.post("/api/auth/register", response_model=UserResponse)
async def register(user_create: UserCreate):
    """Register a new user"""
    try:
        # Validate email format
        if not validate_email(user_create.email):
            raise HTTPException(
                status_code=400,
                detail="Invalid email format"
            )
        
        # Validate password strength
        if not validate_password_strength(user_create.password):
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters"
            )
        
        # Hash password
        hashed_password = get_password_hash(user_create.password)
        
        # Create user
        user = user_db.create_user(user_create, hashed_password)
        
        # Return user response (without password)
        return UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
            last_login=user.last_login
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    """Authenticate user and return JWT token"""
    try:
        # Get user from database
        user = user_db.get_user_by_username(user_login.username)
        if not user:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )
        
        # Verify password
        if not verify_password(user_login.password, user.hashed_password):
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, 
            expires_delta=access_token_expires
        )
        
        # Update last login
        user_db.update_last_login(user.username)
        
        # Get updated user info
        updated_user = user_db.get_user_by_username(user.username)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=updated_user.id,
                username=updated_user.username,
                email=updated_user.email,
                full_name=updated_user.full_name,
                is_active=updated_user.is_active,
                created_at=updated_user.created_at,
                last_login=updated_user.last_login
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@app.post("/api/auth/demo-login", response_model=Token)
async def demo_login():
    """Demo authentication endpoint for testing"""
    try:
        # Automatically login as demo user
        demo_user = user_db.get_user_by_username("demo")
        if not demo_user:
            raise HTTPException(status_code=404, detail="Demo user not found")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": demo_user.username}, 
            expires_delta=access_token_expires
        )
        
        # Update last login
        user_db.update_last_login(demo_user.username)
        
        # Get updated user info
        updated_user = user_db.get_user_by_username(demo_user.username)
        
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse(
                id=updated_user.id,
                username=updated_user.username,
                email=updated_user.email,
                full_name=updated_user.full_name,
                is_active=updated_user.is_active,
                created_at=updated_user.created_at,
                last_login=updated_user.last_login
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo login failed: {str(e)}")

@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    """Get current user information"""
    # Handle demo user
    if current_user == "demo@sof-extractor.com":
        return UserResponse(
            id="demo",
            username="Demo User",
            email="demo@sof-extractor.com",
            full_name="Demo User",
            is_active=True,
            created_at="2025-08-23 00:00:00",
            last_login="2025-08-23 00:00:00"
        )
    
    user = user_db.get_user_by_username(current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at,
        last_login=user.last_login
    )

@app.get("/api/auth/users", response_model=List[UserResponse])
async def list_users(current_user: str = Depends(get_current_user)):
    """List all users (admin endpoint)"""
    # In production, add admin role check here
    return user_db.get_all_users()

# Job status enumeration 
class JobStatus:
    PENDING = "pending"
    PROCESSING = "processing" 
    COMPLETED = "completed"
    FAILED = "failed"

# Create a simple file-like object from upload
class FileUpload:
    def __init__(self, content: bytes, name: str):
        self.content = content
        self.name = name
        
    def read(self):
        return self.content
    
    def getvalue(self):
        return self.content

async def process_documents_with_sof_pipeline(job_id: str, file_paths_and_names: List[tuple], use_enhanced_processing: bool = False):
    """
    Process multiple documents using the new integrated SoF pipeline
    """
    try:
        logger.info(f"🚀 Processing {len(file_paths_and_names)} documents with SoF Pipeline (enhanced: {use_enhanced_processing})")
        
        # Get API key for Gemini
        gemini_api_key = os.getenv("GOOGLE_API_KEY", "")
        if not gemini_api_key:
            logger.warning("⚠️ No Google API key found, processing will be limited")
        
        all_file_uploads = []
        all_events_list = []
        all_summaries = []
        processed_filenames = []
        
        # Process each file
        for file_path, filename in file_paths_and_names:
            try:
                logger.info(f"📄 Processing file: {filename}")
                
                # Read file content
                with open(file_path, 'rb') as f:
                    file_content = f.read()
                
                # Create file upload object
                file_upload = FileUpload(file_content, filename)
                
                # Determine file type and process accordingly
                file_extension = filename.lower().split('.')[-1]
                
                if use_enhanced_processing and file_extension == 'pdf' and len(file_paths_and_names) == 1:
                    # Use specialized clicked PDF processing (only for single PDF files)
                    logger.info("🎯 Using enhanced clicked PDF processing")
                    
                    if not gemini_api_key:
                        raise Exception("Enhanced processing requires Google API key")
                    
                    events_df, summary_data = process_clicked_pdf_enhanced(file_content, filename, gemini_api_key)
                    
                else:
                    # Collect files for batch processing
                    all_file_uploads.append(file_upload)
                    continue
                
                # Process individual enhanced PDF result
                if not events_df.empty:
                    events_list = events_df.to_dict('records')
                    # Convert any Timestamp objects to strings
                    for event in events_list:
                        for key, value in event.items():
                            if pd.isna(value):
                                event[key] = None
                            elif hasattr(value, 'isoformat'):
                                event[key] = value.isoformat()
                            else:
                                event[key] = str(value) if value is not None else None
                    all_events_list.extend(events_list)
                
                if summary_data:
                    all_summaries.append({**summary_data, "source_file": filename})
                
                processed_filenames.append(filename)
                
            except Exception as file_error:
                logger.error(f"❌ Failed to process {filename}: {file_error}")
                # Continue processing other files
                continue
        
        # Process remaining files using standard pipeline (batch processing)
        if all_file_uploads:
            try:
                logger.info(f"📄 Using standard SoF pipeline processing for {len(all_file_uploads)} files")
                
                # Process uploaded files in batch
                docs = process_uploaded_files(all_file_uploads)
                
                if docs:
                    # Extract events and summary
                    if gemini_api_key:
                        events_df, summary_data = extract_events_and_summary(docs, gemini_api_key)
                        
                        # Convert DataFrame to list of dictionaries for JSON serialization
                        if not events_df.empty:
                            events_list = events_df.to_dict('records')
                            # Convert any Timestamp objects to strings
                            for event in events_list:
                                for key, value in event.items():
                                    if pd.isna(value):
                                        event[key] = None
                                    elif hasattr(value, 'isoformat'):
                                        event[key] = value.isoformat()
                                    else:
                                        event[key] = str(value) if value is not None else None
                            all_events_list.extend(events_list)
                        
                        if summary_data:
                            all_summaries.append({**summary_data, "source_file": "batch_processed"})
                    else:
                        # Fallback without Gemini
                        logger.warning("⚠️ No Gemini API key - using text extraction only")
                
                processed_filenames.extend([upload.name for upload in all_file_uploads])
                
            except Exception as batch_error:
                logger.error(f"❌ Batch processing failed: {batch_error}")
        
        # Combine all summaries into one (prefer the first non-empty summary)
        combined_summary = {}
        for summary in all_summaries:
            if summary and not combined_summary:
                combined_summary = {k: v for k, v in summary.items() if k != "source_file"}
                break
        
        if not all_events_list:
            logger.warning("No events extracted from any document")
        
        # Save results
        result_data = {
            "events": all_events_list,
            "summary": combined_summary,
            "has_laytime_data": len(all_events_list) > 0 and any(event.get('laytime_counts') for event in all_events_list),
            "processed_files": processed_filenames,
            "total_files": len(file_paths_and_names),
            "successful_files": len(processed_filenames)
        }
        
        result_file = RESULTS_DIR / f"{job_id}_results.json"
        with open(result_file, 'w') as f:
            json.dump(result_data, f, indent=2, default=str)
        
        # Update job status
        jobs[job_id].update({
            "status": JobStatus.COMPLETED,
            "events": all_events_list,
            "summary": combined_summary,
            "has_laytime_data": result_data["has_laytime_data"],
            "processed_at": datetime.now().isoformat(),
            "result_file": str(result_file),
            "processed_files": processed_filenames,
            "total_files": len(file_paths_and_names),
            "successful_files": len(processed_filenames)
        })
        
        logger.info(f"✅ Batch processing completed: {len(processed_filenames)}/{len(file_paths_and_names)} files, {len(all_events_list)} total events")
        
    except Exception as e:
        logger.error(f"💥 Batch document processing failed: {e}")
        jobs[job_id].update({
            "status": JobStatus.FAILED,
            "error": str(e),
            "failed_at": datetime.now().isoformat()
        })

@app.post("/api/upload")
async def upload_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    use_enhanced_processing: bool = False
):
    """
    Upload and process multiple maritime documents using the integrated SoF pipeline
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files uploaded")
        
        # Validate file types and sizes
        allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp'}
        validated_files = []
        file_paths_and_names = []
        job_id = str(uuid.uuid4())
        
        for i, file in enumerate(files):
            file_extension = '.' + file.filename.lower().split('.')[-1]

            if file_extension not in allowed_extensions:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {file_extension} in file '{file.filename}'. Supported types: {', '.join(allowed_extensions)}"
                )

            # Validate file size (limit configurable via MAX_FILE_SIZE)
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File '{file.filename}' exceeds the maximum allowed size ({MAX_FILE_SIZE} bytes)"
                )

            # Save uploaded file
            file_path = UPLOAD_DIR / f"{job_id}_{i}_{file.filename}"

            with open(file_path, 'wb') as f:
                f.write(content)

            validated_files.append(file.filename)
            file_paths_and_names.append((file_path, file.filename))
        
        # Create job entry
        jobs[job_id] = {
            "job_id": job_id,
            "status": JobStatus.PROCESSING,
            "user": "demo",
            "filenames": validated_files,
            "total_files": len(validated_files),
            "use_enhanced_processing": use_enhanced_processing,
            "created_at": datetime.now().isoformat()
        }
        
        # Start background processing
        background_tasks.add_task(
            process_documents_with_sof_pipeline, 
            job_id, 
            file_paths_and_names,
            use_enhanced_processing
        )
        
        logger.info(f"📤 Batch document upload initiated: {len(validated_files)} files (enhanced: {use_enhanced_processing})")
        
        return {
            "message": f"{len(validated_files)} file(s) uploaded successfully",
            "job_id": job_id,
            "filenames": validated_files,
            "total_files": len(validated_files),
            "enhanced_processing": use_enhanced_processing
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

# Legacy single file upload endpoint for backward compatibility
@app.post("/api/upload-single")
async def upload_single_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    use_enhanced_processing: bool = False
):
    """
    Upload and process a single maritime document (backward compatibility)
    """
    # Redirect to the new multi-file endpoint
    return await upload_documents(
        background_tasks=background_tasks,
        files=[file],
        use_enhanced_processing=use_enhanced_processing
    )

@app.post("/api/upload-batch")
async def upload_batch_documents(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    use_enhanced_processing: bool = False,
    batch_name: Optional[str] = Form(None)
):
    """
    Upload and process multiple maritime documents with batch metadata
    """
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files uploaded")
        
        if len(files) > 10:  # Limit batch size
            raise HTTPException(status_code=400, detail="Maximum 10 files per batch")
        
        # Use the existing upload_documents function but add batch metadata
        result = await upload_documents(
            background_tasks=background_tasks,
            files=files,
            use_enhanced_processing=use_enhanced_processing
        )
        
        # Add batch metadata to the job
        job_id = result["job_id"]
        if batch_name:
            jobs[job_id]["batch_name"] = batch_name
        
        logger.info(f"📦 Batch upload '{batch_name}' initiated: {len(files)} files")
        
        return {
            **result,
            "batch_name": batch_name,
            "batch_size": len(files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch upload failed: {str(e)}")

@app.post("/api/calculate-laytime")
async def calculate_laytime_endpoint(
    laytime_data: LaytimeCalculation,
    current_user: str = Depends(get_current_user)
):
    """
    Calculate laytime based on voyage summary and events data
    """
    try:
        # Convert events data to DataFrame format expected by the pipeline
        events_df = pd.DataFrame(laytime_data.events)
        
        if events_df.empty:
            raise HTTPException(status_code=400, detail="No events provided for calculation")
        
        # Perform laytime calculation using the SoF pipeline
        laytime_result = calculate_laytime(laytime_data.summary, events_df)
        
        # Convert result to API response format
        result = {
            "laytime_allowed_days": laytime_result.laytime_allowed_days,
            "laytime_consumed_days": laytime_result.laytime_consumed_days,
            "laytime_saved_days": laytime_result.laytime_saved_days,
            "demurrage_due": laytime_result.demurrage_due,
            "dispatch_due": laytime_result.dispatch_due,
            "calculation_log": laytime_result.calculation_log,
            "events_with_calculations": laytime_result.events_df.to_dict('records') if not laytime_result.events_df.empty else []
        }
        
        logger.info(f"💰 Laytime calculated: allowed={laytime_result.laytime_allowed_days:.4f}, consumed={laytime_result.laytime_consumed_days:.4f}")
        
        return result
        
    except Exception as e:
        logger.error(f"Laytime calculation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Laytime calculation failed: {str(e)}")

@app.get("/api/result/{job_id}")
async def get_result(job_id: str):
    """
    Get processing results for a specific job (user can only access their own jobs)
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    # Allow access to all results in demo mode
    
    if job["status"] == JobStatus.PROCESSING:
        return {
            "job_id": job_id,
            "status": JobStatus.PROCESSING,
            "message": "Document(s) still being processed",
            "total_files": job.get("total_files", 1),
            "filenames": job.get("filenames", [job.get("filename", "")])
        }
    elif job["status"] == JobStatus.FAILED:
        return {
            "job_id": job_id,
            "status": JobStatus.FAILED,
            "error": job["error"],
            "total_files": job.get("total_files", 1),
            "filenames": job.get("filenames", [job.get("filename", "")])
        }
    else:
        # Handle both single file (legacy) and multiple file responses
        filenames = job.get("filenames") or [job.get("filename", "")]
        return {
            "job_id": job_id,
            "status": JobStatus.COMPLETED,
            "filenames": filenames,
            "total_files": job.get("total_files", len(filenames)),
            "processed_files": job.get("processed_files", filenames),
            "successful_files": job.get("successful_files", len(filenames)),
            "events": job["events"],
            "summary": job.get("summary", {}),
            "has_laytime_data": job.get("has_laytime_data", False),
            "processed_at": job["processed_at"]
        }

@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    """
    Get processing status for a specific job (user can only access their own jobs)
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    # Allow access to all jobs in demo mode
    
    # Handle both single file (legacy) and multiple file responses
    filenames = job.get("filenames") or [job.get("filename", "")]
    
    return {
        "job_id": job_id,
        "status": job["status"],
        "filenames": filenames,
        "total_files": job.get("total_files", len(filenames)),
        "successful_files": job.get("successful_files", 0) if job["status"] == JobStatus.COMPLETED else 0,
        "created_at": job["created_at"]
    }

@app.post("/api/export/{job_id}")
async def export_data(
    job_id: str, 
    export_request: ExportRequest,
    export_format: str = Query("csv", alias="type", description="Export format: csv or json")
):
    """
    Export processed events as CSV or JSON with calculated laytime
    Accepts events in request body to include manually added events
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    
    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job not completed yet")
    
    # Use events from request body if provided, otherwise fall back to job events
    if export_request.events:
        events = export_request.events
        logger.info(f"📋 Using {len(events)} events from request body for export (includes manual events)")
    else:
        events = job["events"]
        logger.info(f"📋 Using {len(events)} events from job data for export")
    
    summary = job.get("summary", {})
    
    if not events:
        raise HTTPException(status_code=404, detail="No events found")

    try:
        # Convert events to DataFrame
        events_df = pd.DataFrame(events)
        
        # Calculate laytime for all events if summary data is available
        if summary and not events_df.empty:
            logger.info(f"� Calculating laytime for export with {len(events_df)} events")
            try:
                # Import the calculate_laytime function
                from utils.sof_pipeline import calculate_laytime
                
                # Calculate laytime with summary data
                laytime_result = calculate_laytime(summary, events_df)
                
                # Use the calculated events dataframe with laytime information
                events_df = laytime_result.events_df
                
                logger.info(f"� Laytime calculated for export: consumed={laytime_result.laytime_consumed_days:.4f} days")
            except Exception as e:
                logger.warning(f"⚠️ Could not calculate laytime for export: {e}")
                # Continue with original events if laytime calculation fails
        
        # Remove the laytime_counts column from export as requested
        if 'laytime_counts' in events_df.columns:
            events_df = events_df.drop('laytime_counts', axis=1)
            logger.info("�️ Removed 'laytime_counts' column from export")
            
        # Remove additional unwanted columns from export
        columns_to_remove = ['start', 'end', 'duration', 'laytime_utilization_%', 'event', 'date', 'description', 'raw_line', 'filename']
        for col in columns_to_remove:
            if col in events_df.columns:
                events_df = events_df.drop(col, axis=1)
                logger.info(f"🗑️ Removed duplicate/unwanted '{col}' column from export")
        
        # Ensure only standard backend format columns are included in export
        # This prevents any duplicate columns from mixed frontend/backend field naming
        preferred_columns = ['Event', 'start_time_iso', 'end_time_iso', 'Date', 'Duration', 'Laytime', 'Raw Line', 'Filename']
        final_columns = [col for col in preferred_columns if col in events_df.columns]
        events_df = events_df[final_columns]
        logger.info(f"📋 Final export columns: {final_columns}")
        
        if export_format.lower() == "csv":
            # Export as CSV
            csv_file = RESULTS_DIR / f"{job_id}_export.csv"
            events_df.to_csv(csv_file, index=False)
            
            return FileResponse(
                csv_file,
                media_type='text/csv',
                filename=f"sof_events_{job_id[:8]}.csv"
            )
        
        elif export_format.lower() == "json":
            # Export as JSON with proper datetime handling
            import json
            
            class DateTimeEncoder(json.JSONEncoder):
                def default(self, obj):
                    if pd.isna(obj):
                        return None
                    if hasattr(obj, 'isoformat'):
                        return obj.isoformat()
                    return super().default(obj)
            
            # Convert DataFrame to clean records for JSON export
            logger.info(f"📄 Creating JSON export for {len(events_df)} events")
            
            # Convert DataFrame to dictionary records and clean data
            clean_events = []
            for _, row in events_df.iterrows():
                clean_event = {}
                for key, value in row.items():
                    if pd.isna(value) or value is None or value == '':
                        clean_event[key] = None
                    elif isinstance(value, pd.Timestamp):
                        clean_event[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif isinstance(value, datetime):
                        clean_event[key] = value.strftime('%Y-%m-%d %H:%M:%S')
                    elif hasattr(value, 'isoformat'):
                        clean_event[key] = value.isoformat()
                    else:
                        clean_event[key] = str(value)
                clean_events.append(clean_event)
            
            json_file = RESULTS_DIR / f"{job_id}_export.json"
            
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(clean_events, f, indent=2, cls=DateTimeEncoder, ensure_ascii=False)
            
            return FileResponse(
                json_file,
                media_type='application/json',
                filename=f"sof_events_{job_id[:8]}.json"
            )
        
        else:
            raise HTTPException(status_code=400, detail="Invalid export format. Use 'csv' or 'json'")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@app.get("/api/jobs")
async def list_jobs():
    """
    List all processing jobs (demo mode - no user filtering)
    """
    user_jobs = []
    for job_id, job in jobs.items():
        # Show all jobs in demo mode
        # Handle both single file (legacy) and multiple file responses
        filenames = job.get("filenames") or [job.get("filename", "")]
        user_jobs.append({
            "job_id": job_id,
            "status": job["status"],
            "filenames": filenames,
            "total_files": job.get("total_files", len(filenames)),
            "successful_files": job.get("successful_files", 0) if job["status"] == JobStatus.COMPLETED else 0,
            "created_at": job["created_at"]
        })
    
    return {"jobs": user_jobs}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
