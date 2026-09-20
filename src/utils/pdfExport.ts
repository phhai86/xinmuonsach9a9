import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

/**
 * Exports an HTML document element to a high-fidelity PDF file.
 * Clones element to an off-screen container if needed to avoid CSS transform/scaling issues
 * and ensures fonts and Vietnamese diacritics render sharply.
 */
export async function exportDocumentToPdf(elementId: string, fileName: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Target element not found for PDF export:', elementId);
    alert('Không tìm thấy mẫu đơn để xuất PDF. Vui lòng thử lại.');
    return false;
  }

  // Ensure Google Font Tinos is loaded even in environments like v0.dev or Next.js where index.html is ignored
  if (typeof document !== 'undefined' && !document.querySelector('link[href*="family=Tinos"]')) {
    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap';
    document.head.appendChild(fontLink);
  }

  // Create an off-screen container clone with exact A4 dimensions in pixels (794 x 1123 px for 96 DPI)
  // to avoid parent CSS transforms like scale(0.45) affecting html2canvas capture
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'pdf-export-temp-clone';
  clone.style.transform = 'none';
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '794px';
  clone.style.maxWidth = '794px';
  clone.style.minHeight = '1123px';
  clone.style.boxSizing = 'border-box';
  clone.style.margin = '0';
  clone.style.zIndex = '-99999';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';

  document.body.appendChild(clone);

  try {
    // Wait for fonts to be completely ready and loaded
    if (document.fonts) {
      try {
        await document.fonts.load('14pt Tinos');
        await document.fonts.load('bold 14pt Tinos');
      } catch {
        // Fallback gracefully if offline
      }
      await document.fonts.ready;
    }

    const canvas = await html2canvas(clone, {
      scale: 2.5, // Crisp rendering without blowing up canvas memory
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.96);

    // Standard A4 portrait: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= 297) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    } else {
      // Scale down proportionally to fit exactly in one A4 page without distortion
      const scaledWidth = (297 * canvas.width) / canvas.height;
      const xOffset = (210 - scaledWidth) / 2;
      pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, 297, undefined, 'FAST');
    }

    const safeFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    pdf.save(safeFileName);

    return true;
  } catch (err: any) {
    console.error('PDF export execution failed:', err);
    // Fallback: direct window print
    const confirmPrint = window.confirm(
      'Có sự cố khi tạo file tải xuống trực tiếp. Bạn có muốn sử dụng hộp thoại In (Ctrl+P / Save as PDF) của trình duyệt không?'
    );
    if (confirmPrint) {
      window.print();
      return true;
    }
    return false;
  } finally {
    if (document.body.contains(clone)) {
      document.body.removeChild(clone);
    }
  }
}
