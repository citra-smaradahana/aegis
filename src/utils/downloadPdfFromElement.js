import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

/**
 * Generate dan download PDF dari DOM element (untuk mobile - auto download)
 * Di Android native: simpan ke cache lalu buka dialog Share agar user bisa simpan ke folder/Drive.
 * @param {React.RefObject} elementRef - Ref ke element yang akan di-capture
 * @param {string} filename - Nama file PDF (tanpa .pdf)
 * @param {{ orientation?: 'portrait'|'landscape' }} options - orientation untuk format halaman PDF
 */
export async function downloadPdfFromElement(elementRef, filename = "laporan", options = {}) {
  const element = elementRef?.current;
  if (!element) {
    console.warn("downloadPdfFromElement: element ref is null");
    return;
  }

  const isLandscape = options.orientation === "landscape";
  console.log(`Generating PDF: ${filename}, Orientation: ${isLandscape ? "landscape" : "portrait"}`);

  try {
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Jika di dalam element ada beberapa halaman (.fc-print-page atau .print-page),
    // capture SATU PER SATU agar tidak terpotong di tengah.
    const pageNodes = element.querySelectorAll(".fc-print-page, .print-page");

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
          imageTimeout: 15000,
        });

        const imgData = canvas.toDataURL("image/png");

        // Skala gambar supaya SELURUH halaman muat di 1 halaman A4
        const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
        const imgWidth = canvas.width * ratio;
        const imgHeight = canvas.height * ratio;
        const x = (pdfWidth - imgWidth) / 2;
        const y = 0; /* top-aligned, bukan center */

        if (i > 0) {
          pdf.addPage("a4", isLandscape ? "landscape" : "portrait");
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
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL("image/png");
      const ratio = Math.min(pdfWidth / canvas.width, pdfHeight / canvas.height);
      const imgWidth = canvas.width * ratio;
      const imgHeight = canvas.height * ratio;
      const x = (pdfWidth - imgWidth) / 2;
      const y = 0; /* top-aligned, bukan center */

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    }

    const isNativeAndroid = Capacitor.getPlatform() === "android";
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isNativeAndroid) {
      // Android native: tulis ke cache lalu share. getUri bisa return file:// atau content://.
      const safeName = `${(filename || "laporan").replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      const base64 = pdf.output("datauristring").split(",")[1];
      if (!base64) throw new Error("Gagal membuat data PDF");
      await Filesystem.writeFile({
        path: safeName,
        data: base64,
        directory: Directory.Cache,
      });
      const { uri } = await Filesystem.getUri({ directory: Directory.Cache, path: safeName });
      // Share plugin mendukung url file://. Jika content://, fallback ke blob di browser.
      if (uri.startsWith("file://")) {
        await Share.share({
          title: filename || "Laporan",
          text: "PDF dari AEGIS KMB",
          url: uri,
          dialogTitle: "Simpan PDF",
        });
      } else {
        const blob = pdf.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }
    } else if (isMobile) {
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
