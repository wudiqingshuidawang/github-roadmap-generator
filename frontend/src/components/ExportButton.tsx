import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  title: string;
}

export default function ExportButton({ title }: Props) {
  const [exporting, setExporting] = useState(false);

  const handleExportPNG = async () => {
    setExporting(true);
    const loading = toast.loading("正在导出 PNG...");
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const el = document.getElementById("roadmap-content");
      if (!el) throw new Error("找不到路线图内容");
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#f9fafb",
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${title.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_")}_roadmap.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG 导出成功！", { id: loading });
    } catch (e) {
      console.error("Export PNG failed:", e);
      toast.error("导出失败，请重试", { id: loading });
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    const loading = toast.loading("正在导出 PDF...");
    try {
      const [html2canvasMod, jsPDFMod] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const html2canvas = html2canvasMod.default;
      const { jsPDF } = jsPDFMod;

      const el = document.getElementById("roadmap-content");
      if (!el) throw new Error("找不到路线图内容");
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#f9fafb",
        useCORS: true,
      });

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
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

      let y = 0;
      const pageContentHeight = (pdfHeight - margin * 2) / ratio;

      while (y < imgHeight) {
        if (y > 0) pdf.addPage();
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
      toast.success("PDF 导出成功！", { id: loading });
    } catch (e) {
      console.error("Export PDF failed:", e);
      toast.error("导出失败，请重试", { id: loading });
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
        📷 {exporting ? "导出中..." : "PNG"}
      </button>
      <button
        onClick={handleExportPDF}
        disabled={exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        📄 {exporting ? "导出中..." : "PDF"}
      </button>
    </div>
  );
}
