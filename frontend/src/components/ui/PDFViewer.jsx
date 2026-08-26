import { useState, useRef, useMemo } from "react";

import {
    ChevronLeft, ChevronRight, Download, Maximize2, Minimize2,
    Printer, ZoomIn, ZoomOut, Loader2, Bot, FileText
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


export default function PDFViewer({ item, showHeader = true, initialProgress = 0, onPageChange }) {
    const PDF_OPTIONS = useMemo(() => ({ cMapUrl: "cmaps/", cMapPacked: true }), []);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [isRendering, setIsRendering] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const viewerRef = useRef(null);
    const pdfUrl = item?.file ?? null;

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        const startPage = (initialProgress > 0 && initialProgress < 100)
            ? Math.max(1, Math.round((initialProgress / 100) * numPages))
            : 1;
        setPageNumber(startPage);
        onPageChange?.(startPage, numPages);
    };

    const changePage = (offset) => {
        setPageNumber((prev) => {
            const next = Math.min(Math.max(prev + offset, 1), numPages);
            onPageChange?.(next, numPages);
            return next;
        });
    };

    const zoomIn = () => setScale((prev) => Math.min(+(prev + 0.2).toFixed(1), 2.0));
    const zoomOut = () => setScale((prev) => Math.max(+(prev - 0.2).toFixed(1), 0.5));

    const handleDownload = () => {
        if (!pdfUrl) return;
        const a = document.createElement("a");
        a.href = pdfUrl;
        a.download = item?.title ? `${item.title}.pdf` : "document.pdf";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
    };

    const handlePrint = () => {
        window.open(pdfUrl, '_blank');
    };

    const handleFullscreen = () => {
        if (!viewerRef.current) return;
        if (!document.fullscreenElement) {
            viewerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 font-sans">
            {/* Toolbar */}
            {showHeader && <div className="md:flex justify-end items-center mb-6 gap-4">

                <div className="flex flex-wrap gap-2 items-center mt-4 md:mt-0">
                    {/* Zoom controls */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <button onClick={zoomOut} disabled={scale <= 0.5} className="btn btn-ghost btn-xs disabled:opacity-30">
                            <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-xs px-2 font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
                        <button onClick={zoomIn} disabled={scale >= 2.0} className="btn btn-ghost btn-xs disabled:opacity-30">
                            <ZoomIn className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Page controls */}
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                        <button
                            onClick={() => changePage(-1)}
                            disabled={pageNumber <= 1}
                            className="btn btn-ghost btn-xs disabled:opacity-30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs px-3 font-semibold tabular-nums">
                            {pageNumber} <span className="text-slate-300 mx-1">/</span> {numPages ?? "--"}
                        </span>
                        <button
                            onClick={() => changePage(1)}
                            disabled={!numPages || pageNumber >= numPages}
                            className="btn btn-ghost btn-xs disabled:opacity-30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Action buttons */}
                    <button
                        onClick={handlePrint}
                        disabled={!pdfUrl}
                        className="btn btn-sm bg-white border-slate-200 disabled:opacity-40"
                        title="Print"
                    >
                        <Printer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={!pdfUrl}
                        className="btn btn-sm bg-white border-slate-200 disabled:opacity-40"
                        title="Download"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className="btn btn-sm bg-white border-slate-200"
                        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>}

            <div className="max-w-6xl mx-auto space-y-6">     
                {/* PDF Viewer */}
                <div
                    ref={viewerRef}
                    className="bg-slate-200 rounded-2xl p-4 md:p-8 min-h-[80vh] flex flex-col items-center overflow-auto shadow-inner relative"
                >
                    {isRendering && (
                        <div className="absolute top-4 right-4 z-10">
                            <Loader2 className="w-5 h-5 animate-spin text-info" />
                        </div> 
                    )}

                    {!pdfUrl ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
                            <FileText className="w-16 h-16 mb-4 opacity-30" />
                            <p className="font-medium">No document available</p>
                        </div>
                    ) : (
                        <Document
                            file={pdfUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            options={PDF_OPTIONS}
                            loading={
                                <div className="flex flex-col items-center justify-center h-[60vh]">
                                    <Loader2 className="w-10 h-10 animate-spin text-slate-400 mb-4" />
                                    <p className="text-slate-500 font-medium">Preparing Document...</p>
                                </div>
                            }
                            error={
                                <div className="flex flex-col items-center justify-center h-[60vh] text-red-400">
                                    <FileText className="w-12 h-12 mb-3 opacity-40" />
                                    <p className="font-medium">Failed to load document</p>
                                </div>
                            }
                        >
                            <Page
                                key={`page_${pageNumber}_${scale}`}
                                pageNumber={pageNumber}
                                scale={scale}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-2xl rounded-sm overflow-hidden"
                                onRenderSuccess={() => setIsRendering(false)}
                                onRenderStart={() => setIsRendering(true)}
                            />
                        </Document>
                    )}
                </div>

                {/* Info Card */}
                {/* <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold mb-3 text-slate-800 tracking-tight">{item?.title}</h2>
                    <p className="text-slate-600 leading-relaxed  text-justify">
                        {item?.description || "No description provided."}
                    </p>
                </div> */}
            </div>
        </div>
    );
}
