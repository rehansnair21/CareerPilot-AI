import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  BookOpen,
  Layers,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';

export const StudentPDFViewerModal = ({ isOpen, onClose, pdfResource, courseTitle, moduleTitle, lessonTitle, courseId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [pageInput, setPageInput] = useState('1');

  const containerRef = useRef(null);
  const pagesContainerRef = useRef(null);

  // 1. Dynamic script loader for pdfjsLib
  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error('Failed to load in-app PDF rendering engine.'));
      document.head.appendChild(script);
    });
  };

  // 2. Fetch authenticated arraybuffer stream & load document
  useEffect(() => {
    if (!isOpen || !pdfResource || !courseId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setCurrentPage(1);
    setPageInput('1');

    const fetchAndRenderPdf = async () => {
      try {
        const pdfjs = await loadPdfJs();

        // Secure authenticated backend API call to fetch PDF binary
        const streamUrl = `/student/courses/${courseId}/pdf-resources/${pdfResource._id}/stream`;
        const response = await api.get(streamUrl, {
          responseType: 'arraybuffer',
        });

        if (!isMounted) return;

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(response.data) });
        const doc = await loadingTask.promise;

        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err) {
        console.error('Error loading PDF document:', err);
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Failed to load PDF document.');
          setLoading(false);
        }
      }
    };

    fetchAndRenderPdf();

    return () => {
      isMounted = false;
    };
  }, [isOpen, pdfResource, courseId]);

  // 3. Render all pages on canvas elements inside container
  const renderAllPages = useCallback(async () => {
    if (!pdfDoc || !pagesContainerRef.current) return;

    const container = pagesContainerRef.current;
    container.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        // Page wrapper
        const pageWrapper = document.createElement('div');
        pageWrapper.id = `pdf-page-${pageNum}`;
        pageWrapper.className =
          'pdf-page-canvas-wrapper my-6 shadow-md rounded-lg overflow-hidden bg-white border border-[#9FB2AC]/40 relative select-none';
        pageWrapper.style.width = `${viewport.width}px`;
        pageWrapper.style.margin = '0 auto 24px auto';

        // Canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.display = 'block';

        // Prevent right-click / save image as context menu
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        pageWrapper.appendChild(canvas);
        container.appendChild(pageWrapper);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    }
  }, [pdfDoc, scale]);

  useEffect(() => {
    if (pdfDoc) {
      renderAllPages();
    }
  }, [pdfDoc, scale, renderAllPages]);

  // Scroll listener to update active current page indicator
  const handleScroll = () => {
    if (!pagesContainerRef.current || !pdfDoc) return;
    const container = pagesContainerRef.current;
    const children = container.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const rect = child.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
        const pageNum = i + 1;
        setCurrentPage(pageNum);
        setPageInput(String(pageNum));
        break;
      }
    }
  };

  // Jump to specific page
  const scrollToPage = (pageNum) => {
    const targetPage = Math.max(1, Math.min(numPages, pageNum));
    setCurrentPage(targetPage);
    setPageInput(String(targetPage));
    const targetEl = document.getElementById(`pdf-page-${targetPage}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Keyboard controls override for extra security (disabling Print Ctrl+P and Save Ctrl+S)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1A0307]/80 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-fadeIn"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 1. Header Toolbar (PDF Context & Security Badge) */}
      <header className="bg-[#5D0D1A] text-[#FFF9EB] px-4 md:px-6 py-3.5 flex items-center justify-between shadow-lg border-b border-[#7A1424] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FFF9EB]/10 flex items-center justify-center border border-[#FFF9EB]/20 shrink-0 text-[#FFF9EB]">
            <FileText size={20} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base md:text-lg font-extrabold text-[#FFF9EB] truncate">
                {pdfResource?.title || 'Course PDF Resource'}
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFF9EB]/15 text-[#FFF9EB] text-[10px] font-bold border border-[#FFF9EB]/20">
                <Lock size={10} />
                In-App Reader Only
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#FFF9EB]/70 font-medium truncate mt-0.5">
              <span className="flex items-center gap-1">
                <BookOpen size={12} />
                {courseTitle}
              </span>
              {moduleTitle && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <Layers size={12} />
                    {moduleTitle}
                  </span>
                </>
              )}
              {lessonTitle && (
                <>
                  <span>•</span>
                  <span className="truncate">{lessonTitle}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Close Modal Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-[#FFF9EB]/10 hover:bg-[#FFF9EB]/20 text-[#FFF9EB] transition-all shrink-0 hover:scale-105"
          title="Close PDF Viewer"
        >
          <X size={20} />
        </button>
      </header>

      {/* 2. Secondary Interactive Navigation & Zoom Controls Bar */}
      <div className="bg-[#420912] text-[#FFF9EB] px-4 py-2.5 flex items-center justify-between border-b border-[#5D0D1A] shrink-0 text-xs font-semibold shadow-inner">
        {/* Page Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg bg-[#5D0D1A] hover:bg-[#7A1424] disabled:opacity-40 disabled:hover:bg-[#5D0D1A] text-[#FFF9EB] transition-all"
            title="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex items-center gap-1.5 bg-[#5D0D1A]/70 px-2.5 py-1 rounded-lg border border-[#7A1424]">
            <span>Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = parseInt(pageInput, 10);
                  if (!isNaN(p)) scrollToPage(p);
                }
              }}
              onBlur={() => {
                const p = parseInt(pageInput, 10);
                if (!isNaN(p)) scrollToPage(p);
              }}
              className="w-8 text-center bg-[#420912] text-[#FFF9EB] rounded py-0.5 text-xs font-bold outline-none border border-[#7A1424]"
            />
            <span>of {numPages || 1}</span>
          </div>

          <button
            onClick={() => scrollToPage(currentPage + 1)}
            disabled={currentPage >= numPages || loading}
            className="p-1.5 rounded-lg bg-[#5D0D1A] hover:bg-[#7A1424] disabled:opacity-40 disabled:hover:bg-[#5D0D1A] text-[#FFF9EB] transition-all"
            title="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((prev) => Math.max(0.6, prev - 0.2))}
            disabled={loading || scale <= 0.6}
            className="p-1.5 rounded-lg bg-[#5D0D1A] hover:bg-[#7A1424] disabled:opacity-40 text-[#FFF9EB] transition-all"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>

          <span className="w-14 text-center bg-[#5D0D1A]/70 py-1 rounded-lg border border-[#7A1424] font-bold">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={() => setScale((prev) => Math.min(2.5, prev + 0.2))}
            disabled={loading || scale >= 2.5}
            className="p-1.5 rounded-lg bg-[#5D0D1A] hover:bg-[#7A1424] disabled:opacity-40 text-[#FFF9EB] transition-all"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>

          <button
            onClick={() => setScale(1.2)}
            disabled={loading}
            className="p-1.5 rounded-lg bg-[#5D0D1A] hover:bg-[#7A1424] disabled:opacity-40 text-[#FFF9EB] transition-all hidden sm:flex items-center gap-1"
            title="Reset Zoom"
          >
            <Maximize2 size={14} />
            <span className="text-[11px]">Fit</span>
          </button>
        </div>
      </div>

      {/* 3. PDF Canvas Container (Scrollable Area) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#2A080E] flex flex-col items-center custom-scrollbar relative"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {loading ? (
          <div className="my-auto flex flex-col items-center gap-4 text-[#FFF9EB]">
            <Loader2 size={40} className="animate-spin text-[#FFF9EB]" />
            <div className="text-center space-y-1">
              <p className="text-base font-bold">Loading PDF Document...</p>
              <p className="text-xs text-[#FFF9EB]/70 font-medium">Securing in-app reading environment</p>
            </div>
          </div>
        ) : error ? (
          <div className="my-auto max-w-md bg-[#5D0D1A]/90 border border-red-400/30 p-6 rounded-2xl text-center text-[#FFF9EB] space-y-3">
            <AlertCircle size={36} className="mx-auto text-red-300" />
            <h3 className="text-lg font-bold">Unable to Display PDF</h3>
            <p className="text-xs text-red-100">{error}</p>
          </div>
        ) : (
          <div ref={pagesContainerRef} className="w-full flex flex-col items-center pb-12" />
        )}
      </div>

      {/* 4. Footer Information Banner */}
      <footer className="bg-[#5D0D1A] text-[#FFF9EB]/80 px-4 py-2 border-t border-[#7A1424] text-[11px] font-medium flex items-center justify-between shrink-0">
        <span className="truncate">
          CareerPilot AI Protected Document • Strictly In-App Viewing
        </span>
        <span className="shrink-0 font-bold text-[#FFF9EB]">
          {numPages} {numPages === 1 ? 'Page' : 'Pages'}
        </span>
      </footer>
    </div>
  );
};
