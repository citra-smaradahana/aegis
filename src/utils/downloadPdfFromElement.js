import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Generate dan download PDF dari DOM element (untuk mobile - auto download)
 * @param {React.RefObject} elementRef - Ref ke element yang akan di-capture
 * @param {string} filename - Nama file PDF (tanpa .pdf)
 */
export async function downloadPdfFromElement(elementRef, filename = "laporan") {
  const element = elementRef?.current;
  if (!element) {
    console.warn("downloadPdfFromElement: element ref is null");
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (err) {
    console.error("Gagal generate PDF:", err);
    throw err;
  }
}
