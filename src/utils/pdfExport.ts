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

  // Create an off-screen container clone with exact A4 dimensions in pixels (794 x 1123 px for 96 DPI)
  // to avoid parent CSS transforms like scale(0.45) affecting html2canvas capture
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'pdf-export-temp-clone';
  clone.style.transform = 'none';
  clone.style.position = 'fixed';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '794px';
  clone.style.minHeight = '1123px';
  clone.style.margin = '0';
  clone.style.zIndex = '-99999';
  clone.style.backgroundColor = '#ffffff';
  clone.style.boxShadow = 'none';

  document.body.appendChild(clone);

  try {
    // Wait for fonts to be ready
    if (document.fonts) {
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

    pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
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
