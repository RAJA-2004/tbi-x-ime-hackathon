import React, { useState } from 'react';
import UploadForm from '../components/UploadForm';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const [isScrolling, setIsScrolling] = useState(false);

  // Smooth scroll to upload section
  const scrollToUpload = () => {
    const uploadContainer = document.getElementById('upload-form-container');
    if (uploadContainer) {
      setIsScrolling(true);
      
      // Calculate position to center the drag-and-drop area perfectly
      const rect = uploadContainer.getBoundingClientRect();
      const elementTop = rect.top + window.pageYOffset;
      const elementHeight = rect.height;
      const windowHeight = window.innerHeight;
      
      // Position the upload container in the center of viewport
      const targetPosition = elementTop - (windowHeight / 2) + (elementHeight / 2);

      window.scrollTo({
        top: Math.max(0, targetPosition),
        behavior: 'smooth'
      });

      // Reset scrolling state after animation completes
      setTimeout(() => {
        setIsScrolling(false);
      }, 1000);
    }
  };
  return (
    <div className="w-full">
      {/* Hero Section - Full Width Seamless */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" className="text-cyan-300" />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          {/* Main Hero Content */}
          <div className="mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-slate-800/60 rounded-full text-cyan-200 text-sm font-medium mb-8 backdrop-blur-sm border border-cyan-500/30">
              <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse mr-2"></span>
              AI-Powered Maritime Document Processing
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Transform Maritime
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Documentation
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-cyan-100 mb-12 max-w-3xl mx-auto leading-relaxed">
              Extract structured data from Statement of Facts documents using advanced AI.
              Turn complex maritime paperwork into actionable insights in seconds.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={scrollToUpload}
                className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg rounded-full hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-300/50"
                aria-label="Scroll to upload section to start processing documents"
              >
                <CloudArrowUpIcon className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Processing
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>

              <button className="group inline-flex items-center px-8 py-4 text-white font-semibold text-lg rounded-full border-2 border-cyan-400/50 hover:border-cyan-300 hover:bg-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <PlayIcon className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                Watch Demo
              </button>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
              {[
                { icon: DocumentTextIcon, label: 'PDF & DOCX Support', desc: 'Multiple formats' },
                { icon: ChartBarIcon, label: 'AI Extraction', desc: '95% accuracy' },
                { icon: CloudArrowUpIcon, label: 'OCR Processing', desc: 'Image text recognition' },
                { icon: ArrowDownTrayIcon, label: 'Export Ready', desc: 'CSV & JSON formats' }
              ].map((feature, index) => (
                <div key={index} className="group p-6 rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-cyan-500/20 hover:bg-slate-700/40 hover:border-cyan-400/30 transition-all duration-300 shadow-lg">
                  <feature.icon className="h-8 w-8 text-cyan-300 mb-4 group-hover:scale-110 transition-transform mx-auto" />
                  <h3 className="text-white font-semibold text-sm mb-2">{feature.label}</h3>
                  <p className="text-cyan-200 text-xs">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <button
          onClick={scrollToUpload}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-300/50 rounded-full p-2 hover:bg-cyan-500/20 transition-all duration-300"
          aria-label="Scroll to upload section"
        >
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </button>
      </section>

      {/* Upload Section - Maritime Integration */}
      <section id="upload-section" className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-cyan-100 max-w-2xl mx-auto">
              Upload your Statement of Facts document and watch our AI extract valuable insights in real-time
            </p>
          </div>

          <div 
            id="upload-form-container" 
            className={`bg-slate-800/60 backdrop-blur-lg rounded-3xl p-8 border border-cyan-500/20 shadow-2xl transition-all duration-1000 ${
              isScrolling ? 'ring-4 ring-cyan-400/30 scale-[1.02]' : ''
            }`}
          >
            <UploadForm />
          </div>
        </div>
      </section>

      {/* Features Section - Maritime Grid */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful AI Features
            </h2>
            <p className="text-xl text-cyan-100 max-w-3xl mx-auto">
              Our advanced processing pipeline handles every aspect of maritime document analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: DocumentTextIcon,
                title: 'Smart Document Processing',
                description: 'Advanced OCR and text extraction from PDFs, Word documents, and scanned images with industry-leading accuracy.',
                features: ['Multi-format support', 'OCR technology', 'Text preprocessing', 'Quality validation']
              },
              {
                icon: ChartBarIcon,
                title: 'AI-Powered Extraction',
                description: 'Machine learning models trained on maritime documents to identify and extract port events, timestamps, and locations.',
                features: ['NLP processing', 'Pattern recognition', 'Data validation', 'Smart categorization']
              },
              {
                icon: ArrowDownTrayIcon,
                title: 'Flexible Export Options',
                description: 'Export structured data in multiple formats for seamless integration with existing maritime management systems.',
                features: ['CSV export', 'JSON format', 'API integration', 'Real-time updates']
              }
            ].map((feature, index) => (
              <div key={index} className="group p-8 rounded-3xl bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 hover:bg-slate-700/50 hover:border-cyan-400/30 transition-all duration-500 hover:transform hover:-translate-y-2 shadow-2xl">
                <div className="h-16 w-16 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:from-cyan-400/30 group-hover:to-blue-500/30 transition-colors border border-cyan-500/20">
                  <feature.icon className="h-8 w-8 text-cyan-300 group-hover:scale-110 transition-transform" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>

                <p className="text-cyan-100 mb-6 leading-relaxed">
                  {feature.description}
                </p>

                <ul className="space-y-2">
                  {feature.features.map((item, idx) => (
                    <li key={idx} className="flex items-center text-cyan-200 text-sm">
                      <CheckIcon className="h-4 w-4 text-emerald-400 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Maritime Cards */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '95%', label: 'Accuracy Rate', desc: 'Industry-leading precision' },
              { number: '<30s', label: 'Processing Time', desc: 'Lightning-fast results' },
              { number: '5+', label: 'File Formats', desc: 'Comprehensive support' },
              { number: '24/7', label: 'Availability', desc: 'Always ready to process' }
            ].map((stat, index) => (
              <div key={index} className="group p-6 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 text-center hover:bg-slate-700/50 hover:border-cyan-400/30 transition-all duration-300 shadow-xl">
                <div className="text-3xl md:text-4xl font-bold text-cyan-300 mb-2 group-hover:scale-110 transition-transform">
                  {stat.number}
                </div>
                <div className="text-white font-semibold text-sm mb-1">{stat.label}</div>
                <div className="text-cyan-200 text-xs">{stat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your
            <br />
            Maritime Operations?
          </h2>
          <p className="text-xl text-cyan-100 mb-12 max-w-2xl mx-auto">
            Join leading maritime companies using AI to streamline their document processing workflows
          </p>

          <button
            onClick={scrollToUpload}
            className="group inline-flex items-center px-12 py-5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xl rounded-full hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 cursor-pointer focus:outline-none focus:ring-4 focus:ring-cyan-300/50"
            aria-label="Scroll to upload section to get started with document processing"
          >
            Get Started Today
            <svg className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
