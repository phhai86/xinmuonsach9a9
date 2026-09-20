import React, { forwardRef } from 'react';
import { BookLoanApplication } from '../types';

interface ApplicationDocumentProps {
  appData: BookLoanApplication;
  showFooterCode?: boolean;
}

export const ApplicationDocument = forwardRef<HTMLDivElement, ApplicationDocumentProps>(
  ({ appData, showFooterCode = true }, ref) => {
    // Fill up to 10 items
    const items = [...(appData.bookItems || [])];
    while (items.length < 10) {
      items.push('');
    }

    return (
      <div
        ref={ref}
        id="printable-application-doc"
        className="w-[210mm] min-h-[297mm] p-[20mm] mx-auto box-border flex flex-col justify-between print:m-0 print:p-[15mm]"
        style={{
          backgroundColor: '#ffffff',
          fontFamily: "'Tinos', 'Times New Roman', Times, serif",
          fontSize: '14pt',
          lineHeight: '1.45',
          color: '#000000',
        }}
      >
        {/* Main Content Area */}
        <div className="space-y-4">
          {/* Header Quốc hiệu - Tiêu ngữ */}
          <div className="text-center font-bold">
            <p className="text-[14.5pt] tracking-wide uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-[13.5pt] underline underline-offset-4 mt-0.5">Độc lập - Tự do - Hạnh phúc</p>
          </div>

          {/* Title */}
          <div className="text-center pt-3 pb-1">
            <h1 className="text-[17pt] font-bold tracking-normal uppercase">
              ĐƠN XIN MƯỢN SÁCH GIÁO KHOA
            </h1>
          </div>

          {/* Kính gửi */}
          <div className="space-y-1 pt-1 text-[13.5pt]">
            <div className="flex items-baseline">
              <span className="font-bold italic w-24 shrink-0">Kính gửi:</span>
              <span className="font-semibold">- Giáo viên chủ nhiệm lớp:</span>
              <span
                className="ml-2 font-normal flex-1 pl-2 min-h-[1.5em] inline-block"
                style={{ borderBottom: '1px dotted #000000' }}
              >
                {appData.homeroomTeacherClass || appData.className || ''}
              </span>
            </div>
            <div className="flex items-baseline pl-24">
              <span className="font-semibold">- Thư viện nhà trường</span>
            </div>
          </div>

          {/* Em tên là */}
          <div className="flex items-baseline pt-1 text-[13.5pt]">
            <span className="shrink-0 font-normal">Em tên là :</span>
            <span
              className="ml-2 font-semibold flex-1 pl-2 min-h-[1.5em] inline-block uppercase text-[14pt]"
              style={{ borderBottom: '1px dotted #000000' }}
            >
              {appData.fullName || ''}
            </span>
          </div>

          {/* Lớp & Năm học */}
          <div className="flex items-baseline text-[13.5pt]">
            <div className="flex items-baseline w-1/2 pr-3">
              <span className="shrink-0 font-normal">Lớp:</span>
              <span
                className="ml-2 font-medium flex-1 pl-2 min-h-[1.5em] inline-block"
                style={{ borderBottom: '1px dotted #000000' }}
              >
                {appData.className || ''}
              </span>
            </div>
            <div className="flex items-baseline w-1/2 pl-3">
              <span className="shrink-0 font-normal">Năm học:</span>
              <span
                className="ml-2 font-medium flex-1 pl-2 min-h-[1.5em] inline-block"
                style={{ borderBottom: '1px dotted #000000' }}
              >
                {appData.schoolYear || `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`}
              </span>
            </div>
          </div>

          {/* Lý do mượn sách */}
          <div className="flex items-baseline text-[13.5pt] pl-8">
            <span className="shrink-0 font-normal">Hôm nay em làm đơn này để mượn Sách giáo khoa lớp:</span>
            <span
              className="ml-2 font-medium flex-1 pl-2 min-h-[1.5em] inline-block"
              style={{ borderBottom: '1px dotted #000000' }}
            >
              {appData.bookGrade || ''}
            </span>
          </div>

          {/* Số lượng */}
          <div className="flex items-baseline text-[13.5pt]">
            <span className="shrink-0 font-normal">Số lượng:</span>
            <span
              className="mx-2 font-medium w-24 text-center min-h-[1.5em] inline-block"
              style={{ borderBottom: '1px dotted #000000' }}
            >
              {appData.bookQuantity || ''}
            </span>
            <span className="shrink-0 font-normal">cuốn. Cụ thể:</span>
          </div>

          {/* Danh sách 10 mục */}
          <div className="space-y-1.5 text-[13pt] pt-0.5">
            {items.map((book, idx) => (
              <div key={idx} className="flex items-baseline">
                <span className="w-8 shrink-0 font-medium">{idx + 1}/</span>
                <span
                  className="flex-1 pl-2 min-h-[1.4em] inline-block"
                  style={{ borderBottom: '1px dotted #000000' }}
                >
                  {book || ''}
                </span>
              </div>
            ))}
          </div>

          {/* Lời cam kết */}
          <div className="text-[12.5pt] leading-relaxed text-justify pt-1 indent-8">
            Em cam kết sẽ giữ gìn cẩn thận (<span className="italic">Không viết, vẽ, ghi chú, tô màu, làm quăn góc, rách, xé trang…</span>) và hoàn trả đầy đủ sách đã mượn vào cuối năm học theo qui định.
          </div>

          {/* Ngày tháng địa điểm */}
          <div className="text-right text-[13pt] italic pt-1">
            {appData.city || 'TP. Hồ Chí Minh'}, ngày {appData.dateDay || '.....'} tháng {appData.dateMonth || '.....'} năm {appData.dateYear || '202...'}
          </div>

          {/* Ký tên */}
          <div className="grid grid-cols-2 gap-4 pt-2 text-center text-[13.5pt]">
            <div>
              <p className="font-bold">Xác nhận của CMHS</p>
              <p className="text-[11pt] italic mt-0.5" style={{ color: '#525252' }}>(Ký và ghi rõ họ tên)</p>
              <div className="h-24"></div>
            </div>
            <div>
              <p className="font-bold">Người làm đơn</p>
              <p className="text-[11pt] italic mt-0.5" style={{ color: '#525252' }}>(Ký và ghi rõ họ tên)</p>
              <div className="h-24 flex items-end justify-center">
                {appData.fullName && (
                  <p className="font-semibold text-[13pt] uppercase">{appData.fullName}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer với mã số eForm nhỏ xíu */}
        {showFooterCode && (
          <div
            className="pt-3 mt-4 flex justify-end items-center text-[8pt] font-mono tracking-tight select-none"
            style={{ borderTop: '1px solid #d4d4d4', color: '#737373' }}
          >
            <span>{appData.code}</span>
          </div>
        )}
      </div>
    );
  }
);

ApplicationDocument.displayName = 'ApplicationDocument';
