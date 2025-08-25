import React, { useState } from 'react';
import { format } from 'date-fns';
import ClockPicker from './ClockPicker';
import {
  CalendarIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ResultTable = ({ events, jobId, onExport, onViewTimeline, onAddManualEvent, onDeleteEvent = null, onEditEvent = null }) => {
  const [sortField, setSortField] = useState('start');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterEvent, setFilterEvent] = useState('');
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedEvent, setEditedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  });

  if (!events || events.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 text-center border border-white/20">
        <DocumentTextIcon className="h-12 w-12 text-white/60 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">
          No Events Found
        </h3>
        <p className="text-white/80 mb-6">
          No port events were extracted from the document.
        </p>
        <button
          onClick={() => setShowAddEventForm(true)}
          className="inline-flex items-center px-6 py-3 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-all duration-300"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Manual Event
        </button>
      </div>
    );
  }

  // Check for validation warnings
  const hasWarning = events.some(event =>
    event.event === 'Document Validation Warning' ||
    event.severity === 'Warning'
  );

  if (hasWarning) {
    const warningEvent = events.find(event =>
      event.event === 'Document Validation Warning' ||
      event.severity === 'Warning'
    );

    return (
      <div className="space-y-6">
        {/* Warning Card */}
        <div className="bg-amber-500/20 backdrop-blur-lg rounded-3xl p-6 border border-amber-300/30">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-8 w-8 text-amber-300 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-200 mb-2">
                Document Validation Warning
              </h3>
              <p className="text-amber-100 mb-4">
                {warningEvent.description}
              </p>
              {warningEvent.suggestion && (
                <div className="bg-white/10 rounded-lg p-3 border-l-4 border-amber-300">
                  <p className="text-sm text-amber-100">
                    <strong>Suggestion:</strong> {warningEvent.suggestion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Requirements Information */}
        <div className="card bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3">Required Document Format:</h4>
                    <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Event timestamps (start and/or end times)</span>
            </li>
            <li className="flex items-center space-x-2">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Detailed event descriptions</span>
            </li>
                <li className="flex items-center space-x-2">
              <span className="h-4 w-4 inline-block" />
              <span>Duration calculations between events</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Handle adding manual event
  const handleAddEvent = () => {
    if (!newEvent.name || !newEvent.startDate || !newEvent.startTime) {
      alert('Please fill in at least Event Name, Start Date, and Start Time');
      return;
    }

    try {
      const startDateTime = `${newEvent.startDate}T${newEvent.startTime}:00`;
      const endDateTime = newEvent.endDate && newEvent.endTime 
        ? `${newEvent.endDate}T${newEvent.endTime}:00`
        : null;

      // Calculate duration
      let duration = null;
      if (endDateTime) {
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);
        if (endDate > startDate) {
          const diffMs = endDate - startDate;
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          duration = `${hours}h ${minutes}m`;
        }
      }

      // Create new event object using backend column format only
      // Include a detailed Raw Line and Laytime field for exports
      const manualEvent = {
        Event: newEvent.name,
        start_time_iso: startDateTime,
        end_time_iso: endDateTime,
        Date: newEvent.startDate,
        Duration: duration,
        Laytime: 0.0000, // Always include Laytime field for consistency
        'Raw Line': `MANUAL: ${newEvent.name} | Start: ${newEvent.startDate} ${newEvent.startTime}${endDateTime ? ` | End: ${newEvent.endDate} ${newEvent.endTime}` : ''} | Description: ${newEvent.description || 'No description'}`,
        Filename: 'Manual Entry',
        // Add extra fields to ensure frontend state has consistent data
        event: newEvent.name,
        description: newEvent.description || 'No description',
        raw_line: `MANUAL: ${newEvent.name} | Start: ${newEvent.startDate} ${newEvent.startTime}${endDateTime ? ` | End: ${newEvent.endDate} ${newEvent.endTime}` : ''} | Description: ${newEvent.description || 'No description'}`,
        laytime_value: 0.0000
      };

      // Call parent callback to add manual event
      if (onAddManualEvent) {
        onAddManualEvent(manualEvent);
      }

      // Reset form
      setNewEvent({
        name: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: ''
      });
      setShowAddEventForm(false);

    } catch (error) {
      console.error('Error adding event:', error);
      alert('Error adding event. Please check your input format.');
    }
  };

  // Normalize event data to handle backend field names
  const normalizeEvents = (rawEvents) => {
    return rawEvents.map(event => {
      // Extract description from Raw Line for manual events, or use existing description field
      let description = event.description || event.event || event.Event || 'No description';
      
      // If it's a manual entry, extract description from Raw Line
      const rawLine = event['Raw Line'] || event.raw_line || null;
      if (rawLine && rawLine.startsWith('MANUAL:')) {
        const descMatch = rawLine.match(/Description: (.+)$/);
        if (descMatch) {
          description = descMatch[1];
        }
      }
      
      return {
        event: event.Event || event.event || 'Unknown Event',
        start: event.start_time_iso || event.start || null,
        end: event.end_time_iso || event.end || null,
        date: event.Date || event.date || null,
        duration: event.Duration || event.duration || null,
        location: event.location || null,
        description: description,
        laytime_counts: event.laytime_counts || false,
        raw_line: rawLine,
        filename: event.Filename || event.filename || null
      };
    });
  };

  // Sort and filter events
  const processedEvents = normalizeEvents(events)
    .filter(event => {
      const eventMatch = !filterEvent ||
        (event.event && event.event.toLowerCase().includes(filterEvent.toLowerCase()));
      return eventMatch;
    })
    .sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle null/undefined values
      if (!aValue && !bValue) return 0;
      if (!aValue) return sortDirection === 'asc' ? 1 : -1;
      if (!bValue) return sortDirection === 'asc' ? -1 : 1;

      if (sortField === 'start' || sortField === 'end') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
        
        // Handle invalid dates
        if (isNaN(aValue) && isNaN(bValue)) return 0;
        if (isNaN(aValue)) return sortDirection === 'asc' ? 1 : -1;
        if (isNaN(bValue)) return sortDirection === 'asc' ? -1 : 1;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Start editing an event
  const handleStartEdit = (event, index) => {
    setEditingIndex(index);
    setEditedEvent({...event});
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditedEvent(null);
  };

  // Save edited event
  const handleSaveEdit = () => {
    if (editingIndex !== null && editedEvent) {
      // Create a formatted event to save
      const updatedEvent = {
        ...editedEvent,
        // Ensure dates are properly formatted if they were changed
        start: editedEvent.start instanceof Date ? editedEvent.start.toISOString() : editedEvent.start,
        end: editedEvent.end instanceof Date ? editedEvent.end.toISOString() : editedEvent.end,
      };
      
      // Generate a raw line for the edited event if one doesn't exist
      if (!updatedEvent['Raw Line'] && !updatedEvent.raw_line) {
        const formattedStart = formatEditedDateTime(updatedEvent.start);
        const formattedEnd = formatEditedDateTime(updatedEvent.end);
        
        const rawLine = `EDITED: ${updatedEvent.event} | Start: ${formattedStart} | End: ${formattedEnd} | Description: ${updatedEvent.description || 'No description'}`;
        
        // Add raw line to both properties for consistency
        updatedEvent['Raw Line'] = rawLine;
        updatedEvent.raw_line = rawLine;
      }
      
      // Ensure Laytime field exists (required for export)
      if (updatedEvent.Laytime === undefined && updatedEvent.laytime === undefined) {
        updatedEvent.Laytime = 0;
        updatedEvent.laytime = 0;
      }
      
      // Call the parent handler with the updated event and index
      if (onEditEvent) {
        onEditEvent(editingIndex, updatedEvent);
      }
      
      // Reset edit state
      setEditingIndex(null);
      setEditedEvent(null);
    }
  };
  
  // Helper function to format datetime for raw line
  const formatEditedDateTime = (dateTime) => {
    if (!dateTime) return 'Unknown';
    try {
      const date = new Date(dateTime);
      return date.toLocaleString();
    } catch {
      return String(dateTime);
    }
  };

  // Handle input changes for editing
  const handleEditChange = (field, value) => {
    setEditedEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    try {
      const date = new Date(dateTime);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch {
      return dateTime;
    }
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'Not specified';
    try {
      const date = new Date(dateTime);
      return format(date, 'EEEE'); // This will show full weekday name like "Monday", "Tuesday"
    } catch {
      return dateTime;
    }
  };

  const getEventTypeColor = (eventType) => {
    // Handle undefined or null eventType
    if (!eventType || typeof eventType !== 'string') {
      return 'bg-gray-100 text-gray-800';
    }
    
    const type = eventType.toLowerCase();
    if (type.includes('arrival') || type.includes('arrived')) {
      return 'bg-green-100 text-green-800';
    } else if (type.includes('departure') || type.includes('departed')) {
      return 'bg-blue-100 text-blue-800';
    } else if (type.includes('loading') || type.includes('discharge')) {
      return 'bg-purple-100 text-purple-800';
    } else if (type.includes('anchor')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (type.includes('pilot') || type.includes('tug')) {
      return 'bg-indigo-100 text-indigo-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      {/* Header with actions - Responsive */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="w-full lg:w-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Extracted Events
          </h2>
          <p className="text-sm sm:text-base text-white/80">
            {processedEvents.length} events found in the document
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <button
            onClick={() => setShowAddEventForm(!showAddEventForm)}
            className="inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-all duration-300 flex-1 sm:flex-none"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Add Event</span>
            <span className="sm:hidden">Add</span>
          </button>

          {onViewTimeline && (
            <button
              onClick={onViewTimeline}
              className="inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-1 sm:flex-none"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Timeline View</span>
              <span className="sm:hidden">Timeline</span>
            </button>
          )}

          <button
            onClick={() => onExport('csv')}
            className="inline-flex items-center justify-center px-4 py-2 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-1 sm:flex-none"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </button>

          <button
            onClick={() => onExport('json')}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-medium rounded-full hover:bg-blue-600 transition-all duration-300 flex-1 sm:flex-none"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export JSON</span>
            <span className="sm:hidden">JSON</span>
          </button>
        </div>
      </div>

      {/* Filters - Responsive */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Filter by Event Type
            </label>
            <input
              type="text"
              placeholder="Enter event type..."
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Add Event Form */}
      {showAddEventForm && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Manual Event
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-white mb-2">
                Event Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Arrived at berth, Loading commenced"
                value={newEvent.name}
                onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                placeholder="e.g., Additional details about the event..."
                value={newEvent.description}
                onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-2xl text-white placeholder-white/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm resize-vertical"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={(newEvent.startDate || '').toString().replace(/^['\"]+|['\"]+$/g, '')}
                onChange={(e) => setNewEvent({...newEvent, startDate: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-2">
                Start Time *
              </label>
              <ClockPicker
                value={newEvent.startTime}
                onChange={(time) => setNewEvent({...newEvent, startTime: time})}
                placeholder="Select start time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                End Date
              </label>
              <input
                type="date"
                value={(newEvent.endDate || '').toString().replace(/^['\"]+|['\"]+$/g, '')}
                onChange={(e) => setNewEvent({...newEvent, endDate: e.target.value})}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm"
              />
            </div>

            <div>
                <label className="block text-sm font-medium text-white mb-2">
                End Time
              </label>
              <ClockPicker
                value={newEvent.endTime}
                onChange={(time) => setNewEvent({...newEvent, endTime: time})}
                placeholder="Select end time"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              onClick={handleAddEvent}
              className="inline-flex items-center justify-center px-6 py-3 bg-green-500 text-white font-medium rounded-full hover:bg-green-600 transition-all duration-300 flex-1 sm:flex-none"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Event
            </button>
            <button
              onClick={() => {
                setShowAddEventForm(false);
                setNewEvent({
                  name: '',
                  description: '',
                  startDate: '',
                  startTime: '',
                  endDate: '',
                  endTime: ''
                });
              }}
              className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-medium rounded-full hover:bg-white/20 transition-all duration-300 backdrop-blur-sm border border-white/20 flex-1 sm:flex-none"
            >
              Cancel
            </button>
          </div>

          <p className="text-sm text-white/60 mt-3">
            * Required fields. Duration will be calculated automatically if both start and end times are provided.
          </p>
        </div>
      )}

      {/* Mobile Card View - Show on small screens */}
      <div className="block lg:hidden space-y-3">
        {processedEvents.map((event, index) => {
          const duration = event.start && event.end
            ? (() => {
              try {
                const startDate = new Date(event.start);
                const endDate = new Date(event.end);
                const diffMs = endDate - startDate;
                const hours = Math.floor(diffMs / (1000 * 60 * 60));
                const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                return `${hours}h ${minutes}m`;
              } catch {
                return 'N/A';
              }
            })()
            : 'N/A';

          return (
            <div key={index} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 border-l-4 border-l-blue-300 relative">
              <div className="space-y-3">
                {/* Event Type Badge */}
                <div className="flex items-start justify-between">
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${getEventTypeColor(event.event)}
                  `}>
                    {event.event}
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => onDeleteEvent && onDeleteEvent(index)}
                      className="group p-2 rounded-full hover:bg-red-500/20 transition-colors"
                      title="Delete event"
                    >
                      <TrashIcon className="h-4 w-4 text-white/60 group-hover:text-red-500 transition-colors" />
                    </button>
                    <span className="text-xs text-white/60">#{index + 1}</span>
                  </div>
                </div>

                {/* Day and Times */}
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center text-white/80">
                    <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="font-medium">{formatDate(event.start)}</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <span className="mr-2" />
                    <span>Start: {formatDateTime(event.start)}</span>
                  </div>
                  {event.end && formatDateTime(event.end) !== 'Not specified' && (
                    <div className="flex items-center text-white/80">
                      <span className="mr-2" />
                      <span>End: {formatDateTime(event.end)}</span>
                    </div>
                  )}
                  {duration !== 'N/A' && (
                    <div className="flex items-center text-white/80">
                      <span className="mr-2" />
                      <span className="font-medium">Duration: {duration}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="text-sm text-white/90 bg-white/10 p-3 rounded-md">
                  {event.description || 'No description'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View - Hide on small screens */}
      <div className="hidden lg:block bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/20">
            <thead className="bg-white/10">
              <tr>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('event')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Event</span>
                    {sortField === 'event' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('start')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Day</span>
                    {sortField === 'start' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('start')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Start Time</span>
                    {sortField === 'start' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => handleSort('end')}
                >
                  <div className="flex items-center space-x-1">
                    <span>End Time</span>
                    {sortField === 'end' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {processedEvents.map((event, index) => {
                const duration = event.start && event.end
                  ? (() => {
                    try {
                      const startDate = new Date(event.start);
                      const endDate = new Date(event.end);
                      const diffMs = endDate - startDate;
                      const hours = Math.floor(diffMs / (1000 * 60 * 60));
                      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                      return `${hours}h ${minutes}m`;
                    } catch {
                      return 'N/A';
                    }
                  })()
                  : 'N/A';

                return (
                  <tr 
                  key={index} 
                  className={`hover:bg-white/5 transition-colors ${editingIndex === index ? 'bg-blue-900/30 ring-2 ring-blue-500/50' : ''}`}
                >
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                      {editingIndex === index ? (
                        <input
                          type="text"
                          value={editedEvent.event}
                          onChange={(e) => handleEditChange('event', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${getEventTypeColor(event.event)}
                          `}>
                            {event.event}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 text-white/60 mr-2" />
                        {formatDate(event.start)}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <input
                          type="datetime-local"
                          value={editedEvent.start ? new Date(editedEvent.start).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleEditChange('start', new Date(e.target.value))}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2" />
                          {formatDateTime(event.start)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      {editingIndex === index ? (
                        <input
                          type="datetime-local"
                          value={editedEvent.end ? new Date(editedEvent.end).toISOString().slice(0, 16) : ''}
                          onChange={(e) => handleEditChange('end', new Date(e.target.value))}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <div className="flex items-center">
                          <span className="mr-2" />
                          {formatDateTime(event.end)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-white/90">
                      <div className="flex items-center">
                        <span className="mr-2" />
                        {duration}
                      </div>
                    </td>
                    <td className="px-4 xl:px-6 py-4 text-sm text-white/90">
                      {editingIndex === index ? (
                        <textarea
                          value={editedEvent.description || ''}
                          onChange={(e) => handleEditChange('description', e.target.value)}
                          className="bg-white/10 border border-white/30 text-white rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                      ) : (
                        <div className="max-w-xs xl:max-w-sm truncate" title={event.description}>
                          {event.description || 'No description'}
                        </div>
                      )}
                    </td>
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-1">
                        {editingIndex === index ? (
                          <>
                            <button 
                              onClick={handleSaveEdit}
                              className="group p-2 rounded-full hover:bg-green-500/20 transition-colors"
                              title="Save changes"
                            >
                              <CheckIcon className="h-4 w-4 text-white/60 group-hover:text-green-500 transition-colors" />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="group p-2 rounded-full hover:bg-yellow-500/20 transition-colors"
                              title="Cancel editing"
                            >
                              <XMarkIcon className="h-4 w-4 text-white/60 group-hover:text-yellow-500 transition-colors" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleStartEdit(event, index)}
                              className="group p-2 rounded-full hover:bg-blue-500/20 transition-colors"
                              title="Edit event"
                            >
                              <PencilIcon className="h-4 w-4 text-white/60 group-hover:text-blue-500 transition-colors" />
                            </button>
                            <button 
                              onClick={() => onDeleteEvent && onDeleteEvent(index)}
                              className="group p-2 rounded-full hover:bg-red-500/20 transition-colors"
                              title="Delete event"
                            >
                              <TrashIcon className="h-4 w-4 text-white/60 group-hover:text-red-500 transition-colors" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="card text-center">
          <div className="text-xl sm:text-2xl font-bold text-maritime-navy">
            {processedEvents.length}
          </div>
          <div className="text-xs sm:text-sm text-maritime-gray-600">Total Events</div>
        </div>
        <div className="card text-center">
          <div className="text-xl sm:text-2xl font-bold text-maritime-navy">
            {processedEvents.filter(e => e.start && e.end).length}
          </div>
          <div className="text-xs sm:text-sm text-maritime-gray-600">With Duration</div>
        </div>
        <div className="card text-center">
          <div className="text-xl sm:text-2xl font-bold text-maritime-navy">
            {new Set(processedEvents.map(e => e.event.toLowerCase())).size}
          </div>
          <div className="text-xs sm:text-sm text-maritime-gray-600">Event Types</div>
        </div>
      </div>
    </div>
  );
};

export default ResultTable;
