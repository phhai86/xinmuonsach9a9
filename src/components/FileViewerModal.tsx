import React, { useEffect, useRef, useState } from 'react';
import { 
  X, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Maximize2,
  AlertCircle
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { base64ToUint8Array, downloadBase64File, formatBase64Size } from '../utils/fileUtils';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface FileViewerModalProps {
  fileData: string;
  fileName?: string;
  title?: string;
  onClose: () => void;
}

export const FileViewerModal: React.FC<FileViewerModalProps> = ({
  fileData,
  fileName = 'Tai_lieu.pdf',
  title,
  onClose,
}) => {
  const isImage = fileData.startsWith('data:image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(fileName);
  const isPdf = fileData.startsWith('data:application/pdf') || /\.pdf$/i.test(fileName);

  // View state
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // PDF specific state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Initialize PDF
  useEffect(() => {
    if (!isPdf) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    async function loadPdf() {
      try {
        const uint8Data = base64ToUint8Array(fileData);
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Data,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF with PDF.js:', err);
        if (isMounted) {
          setError(
            'Không thể giải mã trực tiếp tệp PDF trên trình duyệt. Bạn có thể nhấn nút "Tải tệp về máy" bên trên để mở xem bình thường.'
          );
          setLoading(false);
        }
      }
    }

    loadPdf();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel?.();
      }
    };
  }, [fileData, isPdf]);

  // Render current PDF page to canvas
  useEffect(() => {
    if (!isPdf || !pdfDoc || !canvasRef.current) return;

    let isCancelled = false;

    async function renderPage() {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDoc!.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Base viewport with rotation
        const baseViewport = page.getViewport({ scale: 1, rotation });
        // Target high-DPI rendering for crisp text
        const pixelRatio = window.devicePixelRatio || 1;
        const targetScale = Math.max(1, Math.min(scale, 3));
        const viewport = page.getViewport({ scale: targetScale, rotation });

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, isPdf]);

  // Handlers
  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setScale(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < numPages) setCurrentPage((prev) => prev + 1);
  };

  return (
    <div 
      className="fixed inset-0 z-60 bg-black/85 backdrop-blur-xs flex flex-col justify-between"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between gap-3 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            {isImage ? (
              <Maximize2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <FileText className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
              {title || fileName}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {fileName} • Dung lượng: {formatBase64Size(fileData)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white"
              title="Khôi phục kích thước 100%"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition-colors"
              title="Phóng to"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate control */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
            title="Xoay 90 độ"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={() => downloadBase64File(fileData, fileName)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Tải tệp về máy tính / điện thoại"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải về máy</span>
          </button>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors ml-1"
            title="Đóng cửa sổ xem"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Stage */}
      <div 
        className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-950 relative select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {loading && (
          <div className="flex flex-col items-center gap-3 text-slate-300">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-xs font-medium">Đang tải và dựng hình tệp...</span>
          </div>
        )}

        {error && (
          <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
            <div>
              <h5 className="font-bold text-sm text-slate-200">Không thể xem trực tiếp</h5>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => downloadBase64File(fileData, fileName)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải tệp về máy để mở
            </button>
          </div>
        )}

        {/* Case 1: Image Viewer */}
        {isImage && !loading && !error && (
          <div 
            className="transition-transform duration-150 flex items-center justify-center"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={fileData}
              alt={title || fileName}
              referrerPolicy="no-referrer"
              className="max-h-[82vh] max-w-[90vw] object-contain rounded-lg shadow-2xl bg-white"
            />
          </div>
        )}

        {/* Case 2: PDF Canvas Viewer */}
        {isPdf && !error && (
          <div 
            className={`transition-all duration-150 flex flex-col items-center justify-center ${loading ? 'hidden' : 'block'}`}
          >
            <div className="bg-white rounded-lg shadow-2xl p-1 overflow-hidden">
              <canvas ref={canvasRef} className="block max-w-full h-auto" />
            </div>
          </div>
        )}

        {/* Case 3: Other document types */}
        {!isImage && !isPdf && !loading && !error && (
          <div className="max-w-md p-6 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-4 shadow-xl">
            <FileText className="w-12 h-12 text-sky-400 mx-auto" />
            <div>
              <h5 className="font-bold text-sm text-slate-200">{fileName}</h5>
              <p className="text-xs text-slate-400 mt-1.5">
                Định dạng tệp này không hỗ trợ xem trước trực tiếp. Bạn có thể tải tệp về máy để mở bằng ứng dụng tương thích.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadBase64File(fileData, fileName)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải tệp về máy
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer / PDF Pagination */}
      {isPdf && numPages > 1 && !error && (
        <div className="bg-slate-900/90 border-t border-slate-800 text-white px-4 py-2.5 flex items-center justify-center gap-4 shrink-0 shadow-md">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={handlePrevPage}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Trang trước
          </button>

          <span className="text-xs font-semibold text-slate-300">
            Trang {currentPage} / {numPages}
          </span>

          <button
            type="button"
            disabled={currentPage >= numPages}
            onClick={handleNextPage}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            Trang sau
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
