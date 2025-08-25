import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import ResultTable from '../components/ResultTable';
import Timeline from '../components/Timeline';
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentIcon
} from '@heroicons/react/24/outline';

const Results = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [manualEvents, setManualEvents] = useState([]);

  const maxRetries = 30; // 30 retries * 2 seconds = 1 minute max wait

  // Combined events (original + manual)
  const allEvents = [...(job?.events || []), ...manualEvents];

  const fetchResults = useCallback(async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_BASE_URL}/api/result/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = response.data;

      setJob(data);

      if (data.status === 'processing' && retryCount < maxRetries) {
        // Continue polling for processing jobs
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchResults();
        }, 2000); // Poll every 2 seconds
      } else if (data.status === 'processing' && retryCount >= maxRetries) {
        setError('Processing is taking longer than expected. Please check back later.');
        setLoading(false);
      } else {
        setLoading(false);
        if (data.status === 'completed') {
          setRetryCount(0);
          toast.success('Document processed successfully!');
        } else if (data.status === 'failed') {
          setError(data.error || 'Processing failed');
        }
      }

    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.response?.data?.detail || 'Failed to fetch results');
      setLoading(false);
    }
  }, [jobId, token, retryCount, maxRetries]);

  useEffect(() => {
    if (jobId) {
      fetchResults();
    }
  }, [jobId, fetchResults]);

  // Handler for adding manual events
  const handleAddManualEvent = (manualEvent) => {
    setManualEvents(prev => [...prev, manualEvent]);
    toast.success('Manual event added successfully!');
  };
  
  // Handler for deleting events
  const handleDeleteEvent = (index) => {
    // Create a copy of all events
    const updatedEvents = [...allEvents];
    
    // Remove the event at the specified index
    updatedEvents.splice(index, 1);
    
    // Determine if the deleted event was from original job events or manual events
    if (index < job.events.length) {
      // If the deleted event was from the original job events, update the job
      const updatedJobEvents = [...job.events];
      updatedJobEvents.splice(index, 1);
      setJob({...job, events: updatedJobEvents});
    } else {
      // If the deleted event was from manual events, update manual events
      const updatedManualEvents = [...manualEvents];
      updatedManualEvents.splice(index - job.events.length, 1);
      setManualEvents(updatedManualEvents);
    }
    
    toast.success('Event deleted successfully!');
  };
  
  // Handler for editing events
  const handleEditEvent = (index, updatedEvent) => {
    // Create a copy of all events
    const updatedEvents = [...allEvents];
    
    // Get original event before updates
    const originalEvent = updatedEvents[index];
    
    // Ensure Raw Line field is preserved when editing
    // If the event already has a Raw Line, keep it
    // If not, generate one that captures the edit
    if (!updatedEvent['Raw Line'] && !updatedEvent.raw_line) {
      const rawLine = originalEvent['Raw Line'] || originalEvent.raw_line || 
        `EDITED: ${updatedEvent.event || updatedEvent.Event || 'Event'} | ${
          formatDateTimeForExport(updatedEvent.start || updatedEvent.start_time_iso)
        } to ${
          formatDateTimeForExport(updatedEvent.end || updatedEvent.end_time_iso)
        } | ${updatedEvent.description || ''}`;
      
      updatedEvent['Raw Line'] = rawLine;
      updatedEvent.raw_line = rawLine;
    }
    
    // Ensure Laytime field is preserved
    if (updatedEvent.Laytime === undefined && updatedEvent.laytime === undefined) {
      updatedEvent.Laytime = originalEvent.Laytime || originalEvent.laytime || 0;
    }
    
    // Update the event at the specified index
    updatedEvents[index] = updatedEvent;
    
    // Determine if the edited event was from original job events or manual events
    if (index < job.events.length) {
      // If the edited event was from the original job events, update the job
      const updatedJobEvents = [...job.events];
      updatedJobEvents[index] = updatedEvent;
      setJob({...job, events: updatedJobEvents});
    } else {
      // If the edited event was from manual events, update manual events
      const updatedManualEvents = [...manualEvents];
      updatedManualEvents[index - job.events.length] = updatedEvent;
      setManualEvents(updatedManualEvents);
    }
    
    toast.success('Event updated successfully!');
  };
  
  // Helper function for formatting dates in raw line
  const formatDateTimeForExport = (dateTime) => {
    if (!dateTime) return 'Unknown time';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString();
    } catch {
      return String(dateTime);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.loading(`Preparing ${format.toUpperCase()} export...`);

      // Prepare a normalized events payload so edited events are exported correctly
      const exportEvents = allEvents.map((ev) => {
        // Determine start/end ISO strings
        const toIso = (val) => {
          if (!val) return null;
          if (typeof val === 'string') {
            try { return new Date(val).toISOString(); } catch { return val; }
          }
          if (val instanceof Date) return val.toISOString();
          // fallback
          try { return new Date(val).toISOString(); } catch { return null; }
        };

        const start_iso = ev.start_time_iso || ev.start || ev.startTime || ev.start_date || ev.startDate || ev.start_time || null;
        const end_iso = ev.end_time_iso || ev.end || ev.endTime || ev.end_date || ev.endDate || ev.end_time || null;

        const startIso = toIso(start_iso);
        const endIso = toIso(end_iso);

        // Compute Date (YYYY-MM-DD) from start
        const dateOnly = startIso ? startIso.split('T')[0] : (ev.Date || ev.date || null);

        // Compute Duration (hours) if possible
        let durationVal = ev.Duration || ev.duration || null;
        if (!durationVal && startIso && endIso) {
          try {
            const s = new Date(startIso);
            const e = new Date(endIso);
            const hours = Math.round((e - s) / (1000 * 60 * 60));
            durationVal = `${hours}h 0m`;
          } catch {
            durationVal = null;
          }
        }

        // Handle Raw Line field - ensure it's preserved for all events
        let rawLine = ev['Raw Line'] || ev.raw_line || ev.rawLine || ev.raw || '';
        
        // If no raw line exists, create one from event data for edited/manual entries
        if (!rawLine) {
          // Generate a descriptive raw line based on event details
          rawLine = `${ev.event || ev.Event || 'Event'}: ${formatDateForRawLine(startIso)} to ${formatDateForRawLine(endIso)} - ${ev.description || ev.Description || ''}`;
        }

        // Handle Laytime field - ensure it exists for all events
        const laytime = ev.Laytime || ev.laytime || ev.laytime_value || 0;

        return {
          Event: ev.event || ev.Event || ev.name || '',
          start_time_iso: startIso,
          end_time_iso: endIso,
          Date: dateOnly,
          Duration: durationVal,
          'Raw Line': rawLine,
          Filename: ev.filename || ev.FileName || (job && (job.filename || (job.filenames && job.filenames.join(', ')))) || '',
          Description: ev.description || ev.Description || '',
          Laytime: laytime
        };
      });
      
      // Helper function to format dates for raw line
      function formatDateForRawLine(isoDate) {
        if (!isoDate) return 'Unknown';
        try {
          const date = new Date(isoDate);
          return date.toLocaleString();
        } catch {
          return isoDate;
        }
      }

      // Send normalized events to backend for export
      const response = await axios.post(
        `${API_BASE_URL}/api/export/${jobId}?type=${format}`,
        { events: exportEvents },
        {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sof_events_${jobId.substring(0, 8)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success(`${format.toUpperCase()} file downloaded successfully!`);

    } catch (err) {
      toast.dismiss();
      console.error('Export failed:', err);
      toast.error(`Export failed: ${err.response?.data?.detail || 'Unknown error'}`);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    fetchResults();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'processing':
        return 'Processing document...';
      case 'completed':
        return 'Processing completed';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  if (!jobId) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-maritime-navy mb-2">
          Invalid Job ID
        </h2>
        <p className="text-maritime-gray-600 mb-4">
          The job ID is missing or invalid.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Upload
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-maritime-navy mb-2">
          Error
        </h2>
        <p className="text-maritime-gray-600 mb-6 max-w-md mx-auto">
          {error}
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleRetry}
            className="btn-secondary"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (loading || !job) {
    return (
      <div className="text-center py-12">
        <div className="spinner mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-maritime-navy mb-2">
          Loading Results...
        </h2>
        <p className="text-maritime-gray-600">
          Please wait while we fetch your results.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-maritime-navy via-blue-900 to-maritime-blue">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Processing Results
            </h1>
            <div className="flex items-center space-x-3">
              {getStatusIcon(job.status)}
              <span className="text-white/80">
                {getStatusText(job.status)}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Upload Another
          </button>
        </div>

        {/* Job Information Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-white mb-2 flex items-center">
                <DocumentIcon className="h-5 w-5 mr-2 text-blue-200" />
                Document{job.total_files > 1 ? 's' : ''}
              </h3>
              {job.total_files > 1 ? (
                <div className="space-y-1">
                  <p className="text-white/80 bg-white/10 rounded-lg px-3 py-2">
                    {job.total_files} files processed
                  </p>
                  {job.filenames && job.filenames.length <= 3 ? (
                    job.filenames.map((filename, index) => (
                      <p key={index} className="text-white/60 text-sm truncate" title={filename}>
                        • {filename}
                      </p>
                    ))
                  ) : (
                    <p className="text-white/60 text-sm">
                      {job.filenames?.slice(0, 2).map(f => f.split('.')[0]).join(', ')}
                      {job.filenames?.length > 2 && ` and ${job.filenames.length - 2} more...`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-white/80 truncate bg-white/10 rounded-lg px-3 py-2" title={job.filename || job.filenames?.[0]}>
                  {job.filename || job.filenames?.[0]}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-medium text-white mb-2 flex items-center">
                <ClockIcon className="h-5 w-5 mr-2 text-blue-200" />
                Job ID
              </h3>
              <p className="text-white/80 font-mono text-sm bg-white/10 rounded-lg px-3 py-2">
                {jobId.substring(0, 8)}...
              </p>
            </div>
            <div>
              <h3 className="font-medium text-white mb-2">Status</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2">
                  {getStatusIcon(job.status)}
                  <span className={`
                    text-sm font-medium capitalize
                    ${job.status === 'completed' ? 'text-green-300' :
                      job.status === 'failed' ? 'text-red-300' : 'text-yellow-300'}
                  `}>
                    {job.status}
                  </span>
                </div>
                {job.status === 'completed' && job.total_files > 1 && (
                  <p className="text-white/60 text-xs">
                    {job.successful_files || job.total_files}/{job.total_files} files processed successfully
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Event Count Badge */}
          {job.status === 'completed' && job.events && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex flex-wrap gap-2">
                <div className="inline-flex items-center px-4 py-2 bg-green-500/20 text-green-200 rounded-full text-sm font-medium">
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  {allEvents.length} events found
                  {job.total_files > 1 && ` across ${job.total_files} documents`}
                </div>
                {job.has_laytime_data && (
                  <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-200 rounded-full text-sm font-medium">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Laytime calculation available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Processing Status */}
      {job.status === 'processing' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20">
          <div className="animate-pulse-slow">
            <ClockIcon className="h-16 w-16 text-blue-200 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Processing Your Document{job.total_files > 1 ? 's' : ''}
          </h3>
          <p className="text-white/80 mb-4">
            Our AI is analyzing your {job.total_files > 1 ? `${job.total_files} documents` : 'document'} and extracting port events.
            This usually takes {job.total_files > 1 ? '30-60' : '15-30'} seconds.
          </p>
          <div className="bg-white/20 rounded-full h-2 max-w-md mx-auto">
            <div className="bg-blue-300 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-sm text-white/60 mt-2">
            Attempt {retryCount + 1} of {maxRetries}
          </p>
          {job.total_files > 1 && (
            <p className="text-sm text-white/60 mt-2">
              Processing multiple files may take longer
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {job.status === 'completed' && job.events && (
        <>
          <ResultTable
            events={allEvents}
            jobId={jobId}
            onExport={handleExport}
            onViewTimeline={() => setShowTimeline(true)}
            onAddManualEvent={handleAddManualEvent}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
          />

          {/* Timeline Modal */}
          {showTimeline && (
            <Timeline
              events={allEvents}
              onClose={() => setShowTimeline(false)}
            />
          )}
        </>
      )}

      {/* Failed Status */}
      {job.status === 'failed' && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 text-center border border-white/20">
          <ExclamationCircleIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Processing Failed
          </h3>
          <p className="text-white/80 mb-4">
            {job.error || 'The document could not be processed. Please try with a different file.'}
          </p>
          <div className="flex justify-center space-x-4">
            <button 
              onClick={handleRetry} 
              className="inline-flex items-center px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Retry Processing
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-all duration-300"
            >
              Upload New Document
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Results;
