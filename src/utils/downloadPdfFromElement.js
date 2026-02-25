import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate dan download PDF dari DOM element (untuk mobile - auto download)
 * @param {React.RefObject} elementRef - Ref ke element yang akan di-capture
 * @param {string} filename - Nama file PDF (tanpa .pdf)
 * @param {{ orientation?: 'portrait'|'landscape' }} options - orientation: 'l' = landscape, 'p' = portrait
 */
export async function downloadPdfFromElement(elementRef, filename = "laporan", options = {}) {
  const element = elementRef?.current;
  if (!element) {
    console.warn("downloadPdfFromElement: element ref is null");
    return;
  }

  const orientation = options.orientation === "landscape" ? "l" : "p";

  try {
    const pdf = new jsPDF(orientation, "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Jika di dalam element ada beberapa halaman (.fc-print-page),
    // capture SATU PER SATU agar tidak terpotong di tengah.
    const pageNodes = element.querySelectorAll(".fc-print-page");

    if (pageNodes && pageNodes.length > 0) {
      for (let i = 0; i < pageNodes.length; i++) {
        const pageEl = pageNodes[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          scrollX: 0,
          scrollY: 0,
          windowWidth: pageEl.scrollWidth,
          windowHeight: pageEl.scrollHeight,
        });

        const imgData = canvas.toDataURL("image/png");

        // Skala gambar supaya SELURUH halaman muat di 1 halaman A4 (landscape)
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pdfWidth - imgWidth) / 2;
        const y = (pdfHeight - imgHeight) / 2;

        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      }
    } else {
      // Fallback: 1 halaman saja (capture seluruh element)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    }

    // Di Android/iOS, pdf.save() sering tidak berfungsi. Buka PDF di tab baru agar user bisa simpan/share manual.
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } else {
      pdf.save(`${filename}.pdf`);
    }
  } catch (err) {
    console.error("Gagal generate PDF:", err);
    throw err;
  }
}
