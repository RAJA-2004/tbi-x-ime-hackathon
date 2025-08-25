import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ClockPicker = ({ value, onChange, placeholder = "Select time" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isSelectingMinutes, setIsSelectingMinutes] = useState(false);
  const clockRef = useRef(null);
  const [position, setPosition] = useState({ bottom: '100%', right: 0 });

  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(minute)) {
        setSelectedHour(hour);
        setSelectedMinute(minute);
      } else {
        setSelectedHour(12);
        setSelectedMinute(0);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && clockRef.current && !clockRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsSelectingMinutes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleClock = () => {
    if (!isOpen) {
      // Hardcode to always open upwards (above the trigger)
      setPosition({ bottom: '100%', right: 0, marginBottom: '0.5rem' });
    }
    setIsOpen(!isOpen);
  };


  const handleDone = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onChange(timeString);
    setIsOpen(false);
    setIsSelectingMinutes(false);
  };

  const formatTime = (time) => {
    // Normalize and remove stray surrounding quotes that may come from parent values like '""'
    if (time === undefined || time === null) return placeholder;
    const str = typeof time === 'string' ? time.replace(/^['\"]+|['\"]+$/g, '').trim() : String(time);
    if (!str) return placeholder;
    return str;
  };

  const handleClockClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = event.clientX - rect.left - centerX;
    const y = event.clientY - rect.top - centerY;
    
    // Compute angle in degrees where 0 points to 12 o'clock
    let angle = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (angle < 0) angle += 360;

    if (isSelectingMinutes) {
      // Minutes (0-59) -> 6 degrees per minute
      const minute = Math.round(angle / 6) % 60;
      setSelectedMinute(minute === 60 ? 0 : minute);
    } else {
      // Hours: numbers are placed at 30 degree intervals (12 positions)
      // Determine whether user clicked the inner or outer ring by distance from center
      const distance = Math.sqrt(x * x + y * y);
      // Threshold chosen between the two radii used when rendering hours (60 and 85)
      const threshold = 72; // if distance > threshold -> pick the outer (0-11) ring, else the inner (12-23)

      const hour12 = Math.round(angle / 30) % 12; // 0..11 based on 30deg steps
      const hour = distance > threshold ? hour12 : (hour12 + 12) % 24;
      setSelectedHour(hour);
    }
  };

  const renderNumbers = () => {
    if (isSelectingMinutes) {
      // Minutes: 0, 5, 10, 15, ...55
      const minutes = [];
      for (let i = 0; i < 12; i++) {
        const minute = i * 5;
        const angle = (minute * 6) - 90; // 360/60 = 6 degrees per minute
        const radian = (angle * Math.PI) / 180;
        // Pull minute numbers slightly inward so they sit inside the clock face
        const minuteRadius = 70; // was 85
        const x = Math.cos(radian) * minuteRadius + 100;
        const y = Math.sin(radian) * minuteRadius + 100;
        
        const isSelected = minute === selectedMinute;
        const displayText = minute === 0 ? '00' : minute.toString();
        
        minutes.push(
          <div
            key={minute}
            className={`absolute w-8 h-8 flex items-center justify-center text-sm font-semibold cursor-pointer rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all ${
              isSelected 
                ? 'bg-blue-500 text-white scale-110 shadow-lg' 
                : 'text-gray-700 hover:bg-blue-100'
            }`}
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMinute(minute);
            }}
          >
            {displayText}
          </div>
        );
      }
      return minutes;
    } else {
      // Hours: 0-23 (outer ring 12-23, inner ring 0-11)
      const hours = [];
      // Inner ring (0-11)
      for (let i = 0; i < 12; i++) {
        const angle = (i * 30) - 90; // 360/12 = 30 degrees per hour
        const radian = (angle * Math.PI) / 180;
        const radius = 85;
        const x = Math.cos(radian) * radius + 100;
        const y = Math.sin(radian) * radius + 100;
        
        const isSelected = i === selectedHour;
        
        hours.push(
          <div
            key={`inner-${i}`}
            className={`absolute w-7 h-7 flex items-center justify-center text-xs font-semibold cursor-pointer rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all ${
              isSelected 
                ? 'bg-blue-500 text-white scale-110 shadow-lg' 
                : 'text-gray-700 hover:bg-blue-100'
            }`}
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={() => setSelectedHour(i)}
          >
            {i === 0 ? '00' : i}
          </div>
        );
      }
      // Outer ring (12-23)
      for (let i = 12; i < 24; i++) {
        const angle = ((i-12) * 30) - 90; // 360/12 = 30 degrees per hour
        const radian = (angle * Math.PI) / 180;
        const radius = 60;
        const x = Math.cos(radian) * radius + 100;
        const y = Math.sin(radian) * radius + 100;
        
        const isSelected = i === selectedHour;
        
        hours.push(
          <div
            key={`outer-${i}`}
            className={`absolute w-7 h-7 flex items-center justify-center text-xs font-semibold cursor-pointer rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all ${
              isSelected 
                ? 'bg-blue-500 text-white scale-110 shadow-lg' 
                : 'text-gray-700 hover:bg-blue-100'
            }`}
            style={{ left: `${x}px`, top: `${y}px` }}
            onClick={() => setSelectedHour(i)}
          >
            {i}
          </div>
        );
      }
      return hours;
    }
  };

  const renderClockHand = () => {
    if (isSelectingMinutes) {
      const angle = (selectedMinute * 6) - 90;
  // Shorten minute hand a bit so it doesn't overlap the outer numbers
  const handLength = 65; // was 75
      const radian = (angle * Math.PI) / 180;
      const endX = Math.cos(radian) * handLength + 100;
      const endY = Math.sin(radian) * handLength + 100;
      
      return (
        <>
          <line
            x1="100"
            y1="100"
            x2={endX}
            y2={endY}
            stroke="#3b82f6"
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          <circle cx={endX} cy={endY} r="3" fill="#3b82f6" />
        </>
      );
    } else {
      const angle = selectedHour < 12 ? (selectedHour * 30) - 90 : ((selectedHour - 12) * 30) - 90;
      const handLength = selectedHour < 12 ? 75 : 50;
      const radian = (angle * Math.PI) / 180;
      const endX = Math.cos(radian) * handLength + 100;
      const endY = Math.sin(radian) * handLength + 100;
      
      return (
        <>
          <line
            x1="100"
            y1="100"
            x2={endX}
            y2={endY}
            stroke="#1e40af"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          <circle cx={endX} cy={endY} r="4" fill="#1e40af" />
        </>
      );
    }
  };

  return (
    <div className="relative" ref={clockRef}>
      <button
        type="button"
        onClick={toggleClock}
        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-full text-white focus:border-blue-300 focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 focus:outline-none backdrop-blur-sm text-left flex items-center justify-between hover:bg-white/20 transition-colors"
      >
  <span className="w-full">{formatTime(value)}</span>
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 w-80"
          style={position}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {isSelectingMinutes ? 'Select Minutes' : 'Select Hour'}
            </h3>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsSelectingMinutes(false);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Selected Time Display */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-gray-800">
              {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
            </div>
            <div className="text-sm text-gray-600">
              {isSelectingMinutes ? 'Click on the minutes' : 'Click on the hour'}
            </div>
          </div>

          {/* Analog Clock */}
          <div className="relative mx-auto mb-6" style={{ width: '200px', height: '200px' }}>
            {/* Clock Face */}
            <div 
              className="absolute inset-0 border-2 border-gray-300 rounded-full bg-gradient-to-br from-blue-50 to-white cursor-pointer"
              onClick={handleClockClick}
            >
              {/* Hour markers */}
              <svg className="absolute inset-0 w-full h-full">
                {Array.from({ length: 12 }, (_, i) => {
                  const angle = (i * 30) - 90;
                  const radian = (angle * Math.PI) / 180;
                  const x1 = Math.cos(radian) * 90 + 100;
                  const y1 = Math.sin(radian) * 90 + 100;
                  const x2 = Math.cos(radian) * 95 + 100;
                  const y2 = Math.sin(radian) * 95 + 100;
                  
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#9ca3af"
                      strokeWidth="2"
                    />
                  );
                })}
                
                {/* Clock Hand */}
                {renderClockHand()}
                
                {/* Center circle */}
                <circle cx="100" cy="100" r="5" fill="#3b82f6" />
              </svg>
              
              {/* Numbers */}
              {renderNumbers()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isSelectingMinutes && (
              <button
                onClick={() => setIsSelectingMinutes(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Hours
              </button>
            )}
            <button
              onClick={() => {
                if (!isSelectingMinutes) {
                  setIsSelectingMinutes(true);
                } else {
                  handleDone();
                }
              }}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              {isSelectingMinutes ? 'Done' : 'Select Minutes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClockPicker;
