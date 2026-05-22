import { useState } from "react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

interface Props {
  title: string;
}

export default function ExportButton({ title }: Props) {
  const [exporting, setExporting] = useState(false);

  const captureElement = async (): Promise<HTMLCanvasElement | null> => {
    const el = document.getElementById("roadmap-content");
    if (!el) return null;
    return html2canvas(el, {
      scale: 2,
      backgroundColor: "#f9fafb",
      useCORS: true,
    });
  };

  const handleExportPNG = async () => {
    setExporting(true);
    try {
      const canvas = await captureElement();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}_roadmap.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Export PNG failed:", e);
      alert("Export failed, please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const canvas = await captureElement();
      if (!canvas) return;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 dimensions in points
      const pdfWidth = 595.28;
      const pdfHeight = 841.89;
      const margin = 40;
      const contentWidth = pdfWidth - margin * 2;
      const ratio = contentWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      const pdf = new jsPDF({
        orientation: scaledHeight > pdfHeight ? "portrait" : "portrait",
        unit: "pt",
        format: "a4",
      });

      // If content is taller than one page, split across pages
      let y = 0;
      const pageContentHeight = (pdfHeight - margin * 2) / ratio;

      while (y < imgHeight) {
        if (y > 0) pdf.addPage();

        // Create a slice of the canvas for this page
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgWidth;
        const sliceHeight = Math.min(pageContentHeight, imgHeight - y);
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, -y);
          const sliceData = sliceCanvas.toDataURL("image/png");
          pdf.addImage(sliceData, "PNG", margin, margin, contentWidth, sliceHeight * ratio);
        }

        y += pageContentHeight;
      }

      pdf.save(`${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}_roadmap.pdf`);
    } catch (e) {
      console.error("Export PDF failed:", e);
      alert("Export failed, please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExportPNG}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        📷 {exporting ? "Exporting..." : "PNG"}
      </button>
      <button
        onClick={handleExportPDF}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        📄 {exporting ? "Exporting..." : "PDF"}
      </button>
    </div>
  );
}
