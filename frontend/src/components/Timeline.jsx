import React, { useMemo } from 'react';
import { format, parseISO, isValid } from 'date-fns';

const TimelineVisualization = ({ events, onClose }) => {
  const timelineData = useMemo(() => {
    if (!events || events.length === 0) return [];

    // Process events for timeline visualization
    const processedEvents = events
      .filter(event => {
        // Check for various date fields that might exist
        const startTime = event.start || event.start_time_iso || event.date || event.Date;
        return startTime && startTime !== null && startTime !== '';
      })
      .map((event, index) => {
        let startDate;
        let endDate;
        
        // Try multiple date field variations
        const startTime = event.start || event.start_time_iso || event.date || event.Date;
        const endTime = event.end || event.end_time_iso;
        
        try {
          // Handle various date formats
          if (typeof startTime === 'string') {
            // Try parsing ISO format first, then fallback to Date constructor
            startDate = startTime.includes('T') ? parseISO(startTime) : new Date(startTime);
          } else {
            startDate = new Date(startTime);
          }
          
          if (!isValid(startDate)) throw new Error('Invalid start date');
        } catch (error) {
          console.warn('Failed to parse start date:', startTime, error);
          return null;
        }

        try {
          if (endTime) {
            endDate = typeof endTime === 'string' && endTime.includes('T') ? parseISO(endTime) : new Date(endTime);
            if (!isValid(endDate)) endDate = startDate;
          } else {
            endDate = startDate;
          }
        } catch {
          endDate = startDate;
        }

        const duration = endDate > startDate ? (endDate - startDate) / (1000 * 60 * 60) : 0; // hours

        return {
          id: index,
          event: event.event || event.Event || 'Unknown Event',
          start: startDate,
          end: endDate,
          startTime: startDate.getTime(),
          endTime: endDate.getTime(),
          duration: Math.max(duration, 0.5), // Minimum 30 minutes for visualization
          location: event.location || event.Location || event.port || event.Port || event.place || event.Place || 'Port Location',
          description: event.description || event.Description || event.event || event.Event || '',
          formattedStart: format(startDate, 'MMM dd, yyyy HH:mm'),
          formattedEnd: format(endDate, 'MMM dd, yyyy HH:mm'),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.startTime - b.startTime);

    return processedEvents;
  }, [events]);

  const getEventColor = (eventType) => {
    const type = eventType.toLowerCase();
    if (type.includes('arrival') || type.includes('arrived') || type.includes('arrive')) {
      return { bg: '#10B981', border: '#059669', label: 'Arrival' }; // emerald
    }
    if (type.includes('departure') || type.includes('departed') || type.includes('depart') || type.includes('sail')) {
      return { bg: '#3B82F6', border: '#2563EB', label: 'Departure' }; // blue
    }
    if (type.includes('loading') || type.includes('discharge') || type.includes('cargo') || type.includes('berth')) {
      return { bg: '#8B5CF6', border: '#7C3AED', label: 'Cargo Ops' }; // violet
    }
    if (type.includes('anchor') || type.includes('anchorage')) {
      return { bg: '#F59E0B', border: '#D97706', label: 'Anchoring' }; // amber
    }
    if (type.includes('pilot') || type.includes('tug') || type.includes('assist')) {
      return { bg: '#EC4899', border: '#DB2777', label: 'Pilot/Tug' }; // pink
    }
    if (type.includes('bunker') || type.includes('fuel')) {
      return { bg: '#06B6D4', border: '#0891B2', label: 'Bunkering' }; // cyan
    }
    if (type.includes('repair') || type.includes('maintenance') || type.includes('service')) {
      return { bg: '#F97316', border: '#EA580C', label: 'Service' }; // orange
    }
    if (type.includes('wait') || type.includes('delay') || type.includes('standby')) {
      return { bg: '#84CC16', border: '#65A30D', label: 'Waiting' }; // lime
    }
    return { bg: '#6B7280', border: '#4B5563', label: 'Other' }; // gray
  };

  if (!timelineData.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl max-w-2xl w-full p-8 text-center">
          <h3 className="text-xl font-semibold text-maritime-navy mb-4">
            No Timeline Data Available
          </h3>
          <p className="text-maritime-gray-600 mb-6">
            No events with valid timestamps were found for timeline visualization.
          </p>
          <button onClick={onClose} className="btn-primary">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-maritime-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-maritime-navy">
              Event Timeline Visualization
            </h3>
            <button
              onClick={onClose}
              className="text-maritime-gray-500 hover:text-maritime-gray-700"
            >
              <span className="sr-only">Close</span>
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Timeline Chart */}
          {/* <div>
            <h4 className="text-lg font-medium text-maritime-navy mb-4">
              Events Timeline
            </h4>
            <div className="bg-maritime-gray-50 rounded-lg p-4">
              <div className="space-y-4">
                {timelineData.map((event, index) => (
                  <div
                    key={event.id}
                    className="flex items-center space-x-4 p-3 bg-white rounded-lg shadow-sm border-l-4"
                    style={{ borderLeftColor: getEventColor(event.event).bg }}
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                      style={{ 
                        backgroundColor: getEventColor(event.event).bg,
                        borderColor: getEventColor(event.event).border,
                        borderWidth: '2px'
                      }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-maritime-navy truncate">
                            {event.event}
                          </h5>
                          <span 
                            className="px-2 py-1 text-xs font-medium rounded-full text-white"
                            style={{ backgroundColor: getEventColor(event.event).bg }}
                          >
                            {getEventColor(event.event).label}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-maritime-gray-700">
                          {event.duration > 0 ? `${event.duration.toFixed(1)}h` : 'Instant'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-maritime-gray-600">
                        <span>{event.formattedStart}</span>
                        {event.duration > 0 && (
                          <>
                            <span>→</span>
                            <span>{event.formattedEnd}</span>
                          </>
                        )}
                        {event.location && 
                         !['Unknown', 'Port Location', 'unknown', 'port location', ''].includes(event.location) && (
                          <>
                            <span>•</span>
                            <span>{event.location}</span>
                          </>
                        )}
                      </div>
                      {event.description && (
                        <p className="text-sm text-maritime-gray-500 mt-1 truncate">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div> */}

          {/* Event Timeline Chart - Better Visualization */}
          <div>
            {/* <h4 className="text-lg font-medium text-maritime-navy mb-2">
              📊 Daily Maritime Operations Bar Chart
            </h4> */}
            {/* <p className="text-sm text-maritime-gray-600 mb-4">
              Interactive timeline showing when each maritime operation occurred throughout the day. Each colored bar represents a different type of event with its precise timing and duration.
            </p> */}
            <div className="h-96 overflow-y-auto border border-maritime-gray-200 rounded-lg bg-white">
              <div className="space-y-3 p-4">
                {timelineData.map((event, index) => {
                  const startHour = event.start.getHours();
                  const startMinute = event.start.getMinutes();
                  const eventColor = getEventColor(event.event);
                  
                  // Calculate position as percentage of the day (24 hours = 100%)
                  const startPosition = ((startHour * 60 + startMinute) / (24 * 60)) * 100;
                  
                  // Handle events with durations longer than 24 hours
                  let displayDuration = event.duration;
                  let durationLabel = `${event.duration.toFixed(1)} hrs`;
                  let isMultiDay = false;
                  let dayCount = 0;
                  let multiDayStyle = {};
                  
                  // If duration exceeds 24 hours, cap the display width but show the real duration in the label
                  if (displayDuration > 24) {
                    isMultiDay = true;
                    dayCount = Math.floor(displayDuration / 24);
                    const remainingHours = (displayDuration % 24).toFixed(1);
                    durationLabel = `${dayCount}d ${remainingHours}h`;
                    
                    // Create a special visual appearance for multi-day events
                    multiDayStyle = {
                      backgroundImage: `repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.2) 10px, rgba(239, 68, 68, 0.4) 10px, rgba(239, 68, 68, 0.4) 20px)`,
                      borderRight: '4px solid #ef4444'
                    };
                    
                    // Cap the visual display at 24 hours (100%) minus a small gap to show it extends beyond
                    displayDuration = 23.95; 
                  }
                  
                  // Calculate width as percentage (minimum 3% for visibility)
                  const duration = Math.max(displayDuration * (100 / 24), 3);
                  
                  return (
                    <div 
                      key={index} 
                      className={`relative ${
                        isMultiDay 
                          ? 'bg-gradient-to-r from-red-50 to-maritime-gray-100 border-l-4 border-red-500' 
                          : 'bg-gradient-to-r from-maritime-gray-50 to-maritime-gray-100 border-l-4'
                      } rounded-lg p-5 hover:shadow-lg transition-all mb-6 shadow-md`}
                      style={!isMultiDay ? { borderLeftColor: eventColor.bg } : {}}
                    >
                      {isMultiDay && (
                        <div className="absolute -top-3 -left-3 bg-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg flex items-center space-x-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Multi-Day Event</span>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className={`w-4 h-4 rounded-full ring-2 ring-white shadow-md flex items-center justify-center ${isMultiDay ? 'animate-pulse' : ''}`}
                            style={{ 
                              backgroundColor: eventColor.bg,
                              borderColor: eventColor.border,
                              borderWidth: '1px'
                            }}
                          >
                            {isMultiDay && (
                              <span className="text-white text-[8px] font-bold">!</span>
                            )}
                          </div>
                          <h5 className="font-semibold text-maritime-navy text-base">
                            {event.event}
                          </h5>
                          <span 
                            className="px-3 py-1 text-xs font-bold rounded-md text-white shadow-md"
                            style={{ backgroundColor: eventColor.bg }}
                          >
                            {eventColor.label}
                          </span>
                        </div>
                        <div className={`text-sm text-right ${isMultiDay ? 'bg-red-50 px-3 py-2 rounded-lg border border-red-200 shadow-md' : ''}`}>
                          {isMultiDay ? (
                            <div className="flex flex-col">
                              <div className="flex items-center justify-end gap-1 mb-1">
                                <span className="text-maritime-gray-600 text-xs">From:</span>
                                <span className="text-lg font-bold text-maritime-navy">{format(event.start, 'dd MMM, HH:mm')}</span>
                              </div>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-maritime-gray-600 text-xs">To:</span>
                                <span className="text-lg font-bold text-maritime-navy">{format(event.end, 'dd MMM, HH:mm')}</span>
                              </div>
                              <div className="text-red-600 font-bold text-xs mt-1 flex items-center justify-end gap-1 border-t border-red-200 pt-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Total:</span>
                                <span className="bg-red-100 px-2 py-1 rounded-md font-bold">{durationLabel}</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-end gap-1">
                                <span className="text-maritime-gray-600 text-xs">Start:</span>
                                <span className="text-lg font-bold text-maritime-navy">{format(event.start, 'HH:mm')}</span>
                              </div>
                              {event.duration > 0 && (
                                <div className="text-maritime-gray-500 text-xs mt-1 flex items-center justify-end gap-1">
                                  <span>Duration:</span>
                                  <span>{durationLabel}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isMultiDay ? (
                        /* Single line multi-day timeline visualization */
                        <div className="space-y-2">
                          {/* Date marker bar for multi-day event */}
                          <div className="relative h-6 bg-red-50 rounded-lg overflow-hidden shadow-inner border border-red-300">
                            {/* Display date markers for the days this event spans */}
                            <div className="flex w-full h-full">
                              {Array.from({ length: Math.min(dayCount + 1, 14) }, (_, i) => (
                                <div 
                                  key={i} 
                                  className="flex-1 border-r border-red-200 flex items-center justify-center relative"
                                >
                                  <span className="text-[9px] font-bold text-red-700">
                                    {format(new Date(event.start.getTime() + i*24*60*60*1000), 'dd MMM yyyy')}
                                  </span>
                                </div>
                              ))}
                              {dayCount > 13 && (
                                <div className="h-full border-l border-red-300 px-2 flex items-center justify-center text-red-600 font-bold text-[9px]">
                                  +{dayCount - 13} more
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Single continuous timeline bar */}
                          <div className="relative h-16 bg-gradient-to-r from-maritime-gray-100 to-maritime-gray-200 rounded-lg overflow-hidden shadow-inner border border-maritime-gray-300">
                            {/* Day separators - faint divider lines */}
                            <div className="absolute inset-0 flex">
                              {Array.from({ length: Math.min(dayCount, 13) + 1 }, (_, i) => (
                                <div 
                                  key={i} 
                                  className="flex-1 border-r border-maritime-gray-400 opacity-20 flex items-center justify-center relative"
                                >
                                  {/* Day label inside each division */}
                                  <span className="absolute bottom-1 text-[8px] text-red-700 font-medium bg-white px-1 py-0.5 rounded-sm opacity-80">
                                    {format(new Date(event.start.getTime() + i*24*60*60*1000), 'dd MMM yyyy')}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Continuous event bar */}
                            <div
                              className="absolute top-2 h-10 transition-all duration-500 shadow-lg rounded-lg z-10"
                              style={{
                                left: `${(startPosition / 100) * (100 / (dayCount + 1))}%`,
                                width: `${((100 - startPosition) / 100 + dayCount - 1 + ((event.end.getHours() * 60 + event.end.getMinutes()) / (24 * 60))) * (100 / (dayCount + 1))}%`,
                                background: `linear-gradient(90deg, ${eventColor.bg}, rgba(239, 68, 68, 0.8), ${eventColor.border})`,
                                boxShadow: '0 3px 10px rgba(239, 68, 68, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                                backgroundImage: 'repeating-linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.2) 10px, rgba(239, 68, 68, 0.4) 10px, rgba(239, 68, 68, 0.4) 20px)'
                              }}
                            >
                              {/* Event span text */}
                              <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-4">
                                <span className="text-white text-xs font-bold truncate drop-shadow-md">
                                  {`${event.event} (${format(event.start, 'dd MMM yyyy')} → ${format(event.end, 'dd MMM yyyy')})`}
                                </span>
                              </div>
                              
                              {/* Start time marker with date */}
                              <div className="absolute left-0 bottom-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-t-sm">
                                {format(event.start, 'dd MMM yyyy, HH:mm')}
                              </div>
                              
                              {/* End time marker with date */}
                              <div className="absolute right-0 bottom-0 bg-red-600 text-white text-[8px] font-bold px-1 rounded-t-sm">
                                {format(event.end, 'dd MMM yyyy, HH:mm')}
                              </div>
                              
                              {/* Duration badge */}
                              <div className="absolute top-[-8px] left-[calc(50%-20px)] px-2 py-0.5 bg-red-600 text-white text-[8px] font-bold rounded-sm shadow-md">
                                {durationLabel}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Regular 24-hour timeline bar for normal events */
                        <div className="relative h-10 bg-gradient-to-r from-maritime-gray-100 to-maritime-gray-200 rounded-lg overflow-hidden shadow-inner border border-maritime-gray-300">
                          {/* 24-hour background grid with improved visibility */}
                          <div className="absolute inset-0 flex">
                            {Array.from({ length: 24 }, (_, i) => (
                              <div 
                                key={i} 
                                className="flex-1 border-r border-maritime-gray-400 opacity-30 flex items-center justify-center"
                                style={{ width: '4.166%' }}
                              >
                                {i % 6 === 0 && (
                                  <span className="text-[8px] text-maritime-gray-500 bg-white px-1 rounded-full opacity-80">
                                    {i}h
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Event bar with improved styling */}
                          <div
                            className="absolute top-1 h-8 transition-all duration-500 shadow-lg rounded-lg"
                            style={{
                              left: `${startPosition}%`,
                              width: `${duration}%`,
                              background: `linear-gradient(90deg, ${eventColor.bg}, ${eventColor.border})`,
                              boxShadow: `0 3px 6px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)`,
                            }}
                            title={`${event.event}: ${event.formattedStart} - ${event.formattedEnd} (Duration: ${durationLabel})`}
                          >
                            {/* Event label directly on the bar for better visibility */}
                            <div className="absolute inset-0 flex items-center justify-center overflow-hidden px-2">
                              <span className="text-white text-xs font-bold truncate drop-shadow-md">
                                {event.duration > 3 ? event.event : ''}
                              </span>
                            </div>
                            
                            {/* Inner highlight for 3D effect */}
                            <div 
                              className="absolute top-0 left-0 h-full w-full rounded-lg"
                              style={{
                                background: `linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)`
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {/* Enhanced Time labels with improved styling and date for multi-day events */}
                      <div className="flex justify-between text-xs font-medium text-maritime-gray-600 mt-3 px-1">
                        {isMultiDay ? (
                          <>
                            {/* For multi-day events, we use event summary instead of time labels */}
                            <div className="w-full bg-red-50 px-3 py-2 rounded-md shadow-sm border border-red-200">
                              <div className="flex justify-between items-center">
                                <div className="text-red-700 font-semibold text-xs">
                                  Start: {format(event.start, 'dd MMM yyyy, HH:mm')}
                                </div>
                                <div className="text-red-700 font-semibold text-xs">
                                  End: {format(event.end, 'dd MMM yyyy, HH:mm')}
                                </div>
                              </div>
                              <div className="text-maritime-navy text-center text-xs font-medium mt-1">
                                Total Duration: {durationLabel}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-maritime-gray-200 text-maritime-navy">00:00</span>
                            <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-maritime-gray-200 text-maritime-navy">06:00</span>
                            <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-maritime-gray-200 text-maritime-navy font-bold">12:00</span>
                            <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-maritime-gray-200 text-maritime-navy">18:00</span>
                            <span className="bg-white px-2 py-1 rounded-md shadow-sm border border-maritime-gray-200 text-maritime-navy">24:00</span>
                          </>
                        )}
                      </div>
                      
                      {/* Location and description with better formatting */}
                      <div className="mt-3 space-y-1">
                        {event.location && 
                         !['Unknown', 'Port Location', 'unknown', 'port location', ''].includes(event.location) && (
                          <div className="flex items-center space-x-2 text-sm">
                            <span className="text-maritime-gray-500">📍</span>
                            <span className="font-medium text-maritime-navy">{event.location}</span>
                          </div>
                        )}
                        {event.description && (
                          <p className="text-sm text-maritime-gray-600 bg-white bg-opacity-70 rounded px-2 py-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Enhanced Legend with better styling */}
            {/* <div className="mt-6 p-4 bg-gradient-to-r from-maritime-gray-50 to-white rounded-lg border border-maritime-gray-200">
              <h6 className="font-bold text-maritime-navy text-base mb-3 flex items-center">
                <span className="mr-2">🏷️</span>
                Event Types Legend & Color Coding:
              </h6>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-green-500 ring-2 ring-green-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Arrivals</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-blue-500 ring-2 ring-blue-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Departures</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-purple-500 ring-2 ring-purple-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Cargo Operations</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 ring-2 ring-yellow-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Anchoring</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-pink-500 ring-2 ring-pink-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Pilot/Tug Services</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-cyan-500 ring-2 ring-cyan-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Bunkering</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-orange-500 ring-2 ring-orange-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Service/Repair</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-lime-500 ring-2 ring-lime-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Waiting/Delays</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-gray-500 ring-2 ring-gray-200"></div>
                  <span className="text-sm font-medium text-maritime-gray-700">Other Operations</span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-maritime-gray-600">
                  💡 <strong>How to read the chart:</strong> Each horizontal bar represents one maritime event. 
                  The bar's position shows when it started (time of day), its width shows duration, 
                  and the color indicates the type of operation performed.
                </p>
              </div>
            </div> */}
          </div>

          {/* Summary Statistics */}
          <div>
            <h4 className="text-lg font-medium text-maritime-navy mb-2">
              Timeline Summary
            </h4>
            <p className="text-sm text-maritime-gray-600 mb-4">
              Key statistics from your maritime document analysis
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-maritime-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-maritime-navy">
                  {timelineData.length}
                </div>
                <div className="text-sm text-maritime-gray-600">Total Events</div>
                <div className="text-xs text-maritime-gray-500 mt-1">All maritime activities</div>
              </div>
              <div className="bg-maritime-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-maritime-navy">
                  {timelineData.filter(e => e.duration > 0).length}
                </div>
                <div className="text-sm text-maritime-gray-600">With Duration</div>
                <div className="text-xs text-maritime-gray-500 mt-1">Events with time span</div>
              </div>
              <div className="bg-maritime-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-maritime-navy">
                  {(() => {
                    const totalHours = timelineData.reduce((sum, e) => sum + e.duration, 0);
                    if (totalHours >= 24) {
                      const days = Math.floor(totalHours / 24);
                      const hours = Math.round(totalHours % 24);
                      return `${days}d ${hours}h`;
                    }
                    return `${Math.round(totalHours)}h`;
                  })()}
                </div>
                <div className="text-sm text-maritime-gray-600">Total Duration</div>
                <div className="text-xs text-maritime-gray-500 mt-1">Cumulative time</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center border-2 border-red-400 shadow-md relative overflow-hidden">
                <div className="absolute -right-5 -top-5 w-20 h-20 bg-red-400 opacity-20 rounded-full"></div>
                <div className="absolute -left-5 -bottom-5 w-16 h-16 bg-red-400 opacity-20 rounded-full"></div>
                
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {timelineData.filter(e => e.duration > 24).length}
                </div>
                <div className="text-sm font-bold text-red-700 flex justify-center items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Multi-day Events
                </div>
                <div className="text-xs text-red-500 mt-2 bg-white py-1 px-2 rounded-full inline-block">
                  Spans across multiple days
                </div>
              </div>
              <div className="bg-maritime-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-maritime-navy">
                  {new Set(timelineData.map(e => e.location).filter(loc => loc !== 'Port Location' && loc !== 'Unknown')).size || 1}
                </div>
                <div className="text-sm text-maritime-gray-600">Locations</div>
                <div className="text-xs text-maritime-gray-500 mt-1">Unique places</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-maritime-gray-200">
          <div className="flex justify-end">
            <button onClick={onClose} className="btn-primary">
              Close Timeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineVisualization;
