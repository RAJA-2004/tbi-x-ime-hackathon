import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const UploadForm = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [useEnhancedProcessing, setUseEnhancedProcessing] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const navigate = useNavigate();
  const { token, demoLogin, user } = useAuth();

  // Auto demo login if no user is authenticated
  useEffect(() => {
    if (!user && !token) {
      const autoDemo = async () => {
        const result = await demoLogin();
        if (result.success) {
          console.log('Auto demo login successful');
        }
      };
      autoDemo();
    }
  }, [user, token, demoLogin]);

  const uploadFiles = useCallback(async (files) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    
    // Add files to form data
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('use_enhanced_processing', useEnhancedProcessing.toString());

    try {
      // Always use regular upload endpoint
      const endpoint = `${API_BASE_URL}/api/upload`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(Math.min(progress, 90)); // Cap at 90% during upload
        },
      });

      // Complete the progress bar
      setUploadProgress(100);

      const { job_id, total_files } = response.data;
      
      const fileText = total_files === 1 ? 'File' : `${total_files} files`;
      toast.success(`${fileText} uploaded successfully! Processing started.`);

      // Navigate to results page
      navigate(`/results/${job_id}`);

    } catch (error) {
      console.error('Upload failed:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please try demo login.';
        setAuthError(true);
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [useEnhancedProcessing, token, navigate]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    // Validate file sizes (10MB limit per file)
    const oversizedFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Max size is 10MB per file.`);
      return;
    }

    // Add to existing files (avoid duplicates)
    setSelectedFiles(prev => {
      const existingNames = prev.map(f => f.name);
      const newFiles = acceptedFiles.filter(f => !existingNames.includes(f.name));
      if (newFiles.length === 0) {
        toast.error('All selected files are already added');
        return prev;
      }
      const combined = [...prev, ...newFiles];
      if (combined.length > 10) {
        toast.error('Maximum 10 files allowed per batch');
        return prev;
      }
      return combined;
    });
  }, [uploadFiles]);

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const processSelectedFiles = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }
    await uploadFiles(selectedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'image/*': ['.png', '.jpg', '.jpeg', '.tiff']
    },
    multiple: true, // Always allow multiple files
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  return (
    <div className="w-full">
      <div className="relative">
        {/* Enhanced Processing Toggle */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
            <button
              onClick={() => setUseEnhancedProcessing(false)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                !useEnhancedProcessing
                  ? 'bg-white text-maritime-navy shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setUseEnhancedProcessing(true)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-300 ${
                useEnhancedProcessing
                  ? 'bg-white text-maritime-navy shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Enhanced (Beta)
              <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                AI+
              </span>
            </button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            relative cursor-pointer rounded-3xl border-2 border-dashed transition-all duration-300 overflow-hidden
            ${isDragActive 
              ? 'border-white bg-white/10 scale-105 shadow-2xl' 
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
            }
            ${uploading ? 'pointer-events-none' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <svg className="w-full h-full" viewBox="0 0 40 40" fill="none">
              <defs>
                <pattern id="upload-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="40" height="40" fill="url(#upload-grid)" className="text-white" />
            </svg>
          </div>

          <div className="relative z-10 p-12 text-center">
            {!uploading && selectedFiles.length === 0 && (
              <div className="space-y-6">
                <div className="mx-auto h-24 w-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all duration-300">
                  <CloudArrowUpIcon className="h-12 w-12 text-white" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Drop multiple documents here
                  </h3>
                  <p className="text-white/80 text-lg mb-4">
                    or <span className="text-blue-200 font-semibold underline">browse files</span> to upload
                  </p>
                  <p className="text-white/60 text-sm">
                    Supports PDF, Word documents, and images • Max 10 files, 10MB each
                  </p>
                </div>
              </div>
            )}

            {uploading && (
              <div className="space-y-6">
                <div className="mx-auto h-24 w-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white"></div>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Processing Document{selectedFiles.length > 1 ? 's' : ''}...
                  </h3>
                  <p className="text-white/80 text-lg mb-6">
                    Our AI is extracting maritime data from your document{selectedFiles.length > 1 ? 's' : ''}
                  </p>
                  
                  {/* Modern Progress Bar */}
                  <div className="max-w-md mx-auto">
                    <div className="flex justify-between text-sm text-white/60 mb-2">
                      <span>Progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2 backdrop-blur-sm">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-cyan-400 h-2 rounded-full transition-all duration-300 shadow-lg"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && !uploading && (
              <div className="space-y-6">
                <div className="mx-auto h-24 w-24 bg-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-green-500/30">
                  <CheckCircleIcon className="h-12 w-12 text-green-400" />
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''} Ready
                  </h3>
                  <p className="text-white/80 text-lg mb-2">
                    {selectedFiles.length} document{selectedFiles.length > 1 ? 's' : ''} selected for processing
                  </p>
                  <p className="text-white/60 text-sm">
                    Click process to extract maritime events from {selectedFiles.length > 1 ? 'all documents' : 'document'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="mt-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-white font-semibold text-lg">
                  Selected Files ({selectedFiles.length}/10)
                </h4>
                <button
                  onClick={clearAllFiles}
                  className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-5 w-5 text-blue-200" />
                      <div>
                        <p className="text-white font-medium text-sm">{file.name}</p>
                        <p className="text-white/60 text-xs">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-white/60 hover:text-red-400 transition-colors duration-200 p-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={clearAllFiles}
              className="px-6 py-3 text-white/80 font-medium rounded-full border border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300"
            >
              Clear Files
            </button>
            
            <button
              {...getRootProps()}
              className="px-6 py-3 text-white/80 font-medium rounded-full border border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300"
            >
              Add More Files
            </button>
                
                {authError && (
                  <button
                    onClick={async () => {
                      const result = await demoLogin();
                      if (result.success) {
                        setAuthError(false);
                        toast.success('Demo login successful! You can now process documents.');
                      }
                    }}
                    className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-full hover:bg-yellow-600 transition-all duration-300"
                  >
                    Try Demo Login
                  </button>
                )}
                
                <button
                  onClick={processSelectedFiles}
                  disabled={uploading}
                  className="px-8 py-3 bg-white text-maritime-navy font-semibold rounded-full hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  Process {selectedFiles.length} File{selectedFiles.length > 1 ? 's' : ''}
                </button>
              </div>
            )}

            {authError && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={async () => {
                    const result = await demoLogin();
                    if (result.success) {
                      setAuthError(false);
                      toast.success('Demo login successful! You can now process documents.');
                    }
                  }}
                  className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-full hover:bg-yellow-600 transition-all duration-300"
                >
                  Try Demo Login
                </button>
              </div>
            )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <DocumentIcon className="h-10 w-10 text-blue-200 mx-auto mb-4" />
            <h4 className="text-white font-semibold mb-2">Multiple Formats</h4>
            <p className="text-white/70 text-sm">PDF, Word, and image files • Single or batch processing</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <svg className="h-10 w-10 text-blue-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h4 className="text-white font-semibold mb-2">Lightning Fast</h4>
            <p className="text-white/70 text-sm">Results in under 30 seconds • Batch processing available</p>
          </div>
          
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <svg className="h-10 w-10 text-blue-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="text-white font-semibold mb-2">95% Accurate</h4>
            <p className="text-white/70 text-sm">Industry-leading precision • Combined results from multiple docs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadForm;
