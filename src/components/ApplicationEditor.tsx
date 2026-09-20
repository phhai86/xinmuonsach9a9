import React, { useState } from 'react';
import { BookLoanApplication, GRADE_9_BOOK_OPTIONS, DEFAULT_BOOKS } from '../types';
import { saveApplication } from '../services/applicationService';
import { exportDocumentToPdf } from '../utils/pdfExport';
import { ApplicationDocument } from './ApplicationDocument';
import { SignedDocUploader } from './SignedDocUploader';
import { 
  Save, 
  Download, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  FileText, 
  Printer, 
  Copy, 
  Sparkles,
  Loader2,
  Calendar,
  Lock,
  Trash2,
  BookOpen,
  Info,
  Check,
  AlertCircle,
  X
} from 'lucide-react';

interface ApplicationEditorProps {
  app: BookLoanApplication;
  onBack: () => void;
  onUpdateApp: (updated: BookLoanApplication) => void;
}

export const ApplicationEditor: React.FC<ApplicationEditorProps> = ({ app, onBack, onUpdateApp }) => {
  const [formData, setFormData] = useState<BookLoanApplication>(() => {
    // Ensure bookItems has 10 slots
    const items = [...(app.bookItems || [])];
    while (items.length < 10) items.push('');
    return {
      ...app,
      bookItems: items,
      homeroomTeacherClass: app.homeroomTeacherClass || app.className || '',
      schoolYear: app.schoolYear || `${new Date().getFullYear()} - ${new Date().getFullYear() + 1}`,
      city: app.city || 'TP. Hồ Chí Minh',
      dateDay: app.dateDay || String(new Date().getDate()).padStart(2, '0'),
      dateMonth: app.dateMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
      dateYear: app.dateYear || String(new Date().getFullYear()),
      bookGrade: app.bookGrade || (app.className ? app.className.replace(/\D/g, '') : '9'),
    };
  });

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'upload_signed'>('edit');

  // Strictly locked when submitted, approved, or isLocked is true
  const isLocked = Boolean(formData.isLocked || formData.status === 'submitted' || formData.status === 'approved');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookChange = (index: number, val: string) => {
    if (isLocked) return;
    const updatedBooks = [...formData.bookItems];
    updatedBooks[index] = val;
    
    // Auto count non-empty
    const filledCount = updatedBooks.filter((b) => b.trim() !== '').length;
    setFormData((prev) => ({
      ...prev,
      bookItems: updatedBooks,
      bookQuantity: filledCount > 0 ? String(filledCount) : prev.bookQuantity,
    }));
  };

  const handleSelectGrade9Book = (bookName: string) => {
    if (isLocked) return;
    if (formData.bookItems.includes(bookName)) return;

    // Find first empty slot
    const firstEmptyIndex = formData.bookItems.findIndex((b) => !b || b.trim() === '');
    if (firstEmptyIndex !== -1) {
      handleBookChange(firstEmptyIndex, bookName);
    } else {
      setToastMessage('Đã điền đủ 10 mục sách trong đơn. Bạn có thể xóa bớt một mục để thêm sách này.');
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleApplyDefaults = () => {
    if (isLocked) return;
    const newItems = [...DEFAULT_BOOKS];
    while (newItems.length < 10) newItems.push('');
    setFormData((prev) => ({
      ...prev,
      bookItems: newItems,
      bookQuantity: String(DEFAULT_BOOKS.length),
    }));
  };

  const handleSave = async (showNotification = true): Promise<void> => {
    if (isLocked) return;
    try {
      setSaving(true);
      setSaveErrorMsg(null);
      await saveApplication(formData);
      onUpdateApp(formData);
      if (showNotification) {
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 3500);
      }
    } catch (err: any) {
      console.error(err);
      setSaveErrorMsg('Không thể lưu đơn: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setSaving(false);
    }
  };

  const handleGoToPreview = async () => {
    if (!isLocked) {
      await handleSave(false);
    }
    setActiveTab('preview');
    scrollToTop();
  };

  const handleGoToUpload = () => {
    setActiveTab('upload_signed');
    scrollToTop();
  };

  const handleExportPdf = async () => {
    if (!isLocked) {
      await handleSave(false);
    }
    setExporting(true);
    try {
      const fileName = `Don_Xin_Muon_SGK_${formData.code}_${formData.fullName.replace(/\s+/g, '_')}`;
      await exportDocumentToPdf('printable-application-doc', fileName);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(formData.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-24 font-sans selection:bg-slate-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-home"
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Quay lại trang chính"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-900">
                  {formData.fullName || 'Đơn mượn sách giáo khoa'}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  Lớp {formData.className || '—'}
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                  {formData.code}
                </span>
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    Đã khóa (Chỉ xem)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Bản nháp
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Thư viện THPT Chuyên Trần Đại Nghĩa • Đơn Mượn Sách Lớp 9A9
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Copy code button */}
            <button
              id="btn-copy-eform-code"
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
              title="Sao chép mã đơn tra cứu"
            >
              {copiedCode ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chép mã</span>
                </>
              )}
            </button>

            {/* Save Button (Only if not locked) */}
            {!isLocked && (
              <button
                id="btn-save-application"
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-600" />}
                <span>{saving ? 'Đang lưu...' : 'Lưu nháp'}</span>
              </button>
            )}

            {/* Export PDF Button */}
            <button
              id="btn-export-pdf-action"
              type="button"
              onClick={handleExportPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang xuất...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Xuất PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 3-Step Navigation Stepper */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex border-t border-slate-100 overflow-x-auto text-xs sm:text-sm">
          <button
            id="tab-btn-edit"
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'edit'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'edit' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              1
            </span>
            <span>Điền thông tin & Chọn sách</span>
            {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
          </button>

          <button
            id="tab-btn-preview"
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'preview'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'preview' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              2
            </span>
            <span>Mẫu in đơn & Tải file PDF</span>
          </button>

          <button
            id="tab-btn-upload-signed"
            type="button"
            onClick={() => setActiveTab('upload_signed')}
            className={`py-3 px-3 font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'upload_signed'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
              activeTab === 'upload_signed' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              3
            </span>
            <span>Nộp bản ký & Hoàn tất</span>
            {formData.signedFile && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </header>

      {/* Save Notification Toast */}
      {saveSuccessMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Đã lưu tiến độ đơn thành công!</strong> Mã tra cứu của bạn: <strong className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded">{formData.code}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2 py-0.5 bg-white border border-emerald-300 text-emerald-800 font-semibold rounded text-[11px]"
            >
              Chép mã
            </button>
          </div>
        </div>
      )}

      {/* Save Error Banner */}
      {saveErrorMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{saveErrorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* General Toast Message */}
      {toastMessage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-amber-500 hover:text-amber-800 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        {/* TAB 1: FORM EDITING */}
        {activeTab === 'edit' && (
          <div className="space-y-6">
            {/* Locked Warning Banner */}
            {isLocked && (
              <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 flex items-start sm:items-center justify-between gap-3 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <Lock className="w-5 h-5 text-slate-600 shrink-0" />
                  <div>
                    <strong className="text-slate-900 block text-sm">Hồ sơ đã được gửi đến Ban Thư viện (Chế độ Chỉ Xem)</strong>
                    <span>Đơn hiện đã khóa để cán bộ thư viện xét duyệt. Bạn không thể chỉnh sửa thông tin đơn nữa.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleGoToPreview}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
                >
                  Xem mẫu in PDF &rarr;
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fields */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Student Info Section */}
                <section className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-700" />
                      Thông tin học sinh
                    </h2>
                    <span className="text-xs text-slate-400 font-mono">Mã: {formData.code}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Họ và tên học sinh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Lớp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={formData.className}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          className: e.target.value,
                          bookGrade: e.target.value.replace(/\D/g, '') || formData.bookGrade,
                        })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Kính gửi Giáo viên chủ nhiệm lớp
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        placeholder="VD: 9/1 hoặc tên giáo viên..."
                        value={formData.homeroomTeacherClass}
                        onChange={(e) => setFormData({ ...formData, homeroomTeacherClass: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Năm học
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={formData.schoolYear}
                        onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                  </div>
                </section>

                {/* 2. Book Selection Section */}
                <section className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-slate-700" />
                        Danh mục sách giáo khoa cần mượn
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chọn các đầu sách cần mượn theo nhu cầu thực tế (tối đa 10 mục)
                      </p>
                    </div>

                    {!isLocked && (
                      <button
                        id="btn-apply-default-books"
                        type="button"
                        onClick={handleApplyDefaults}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors self-start sm:self-auto cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                        Điền nhanh bộ chuẩn Lớp 9
                      </button>
                    )}
                  </div>

                  {/* Grade & Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Khối lớp SGK
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={formData.bookGrade}
                        onChange={(e) => setFormData({ ...formData, bookGrade: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Tổng số lượng sách (cuốn)
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={formData.bookQuantity}
                        onChange={(e) => setFormData({ ...formData, bookQuantity: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Fast Grade 9 Chips */}
                  {!isLocked && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          Nhấn để thêm nhanh vào danh mục:
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Đã chọn: {formData.bookItems.filter((b) => b.trim() !== '').length}/10
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {GRADE_9_BOOK_OPTIONS.map((opt) => {
                          const isSelected = formData.bookItems.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleSelectGrade9Book(opt)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-slate-900 text-white shadow-2xs cursor-default'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {isSelected ? '✓ ' : '+ '}
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 10 Book Items List */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Cụ thể 10 dòng sách trên mẫu đơn:
                    </label>
                    <div className="space-y-2">
                      {formData.bookItems.map((book, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-6 text-center text-xs font-bold text-slate-400 shrink-0 font-mono">
                            {idx + 1}/
                          </span>
                          <input
                            id={`input-book-item-${idx + 1}`}
                            type="text"
                            disabled={isLocked}
                            placeholder={`Tên đầu sách số ${idx + 1}`}
                            value={book}
                            onChange={(e) => handleBookChange(idx, e.target.value)}
                            className="flex-1 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-400 text-slate-900 disabled:bg-slate-100 disabled:text-slate-500"
                          />
                          {!isLocked && book && (
                            <button
                              type="button"
                              onClick={() => handleBookChange(idx, '')}
                              className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                              title="Xóa dòng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* 3. Location & Date */}
                <section className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                    <Calendar className="w-4 h-4 text-slate-700" />
                    Địa điểm & Ngày làm đơn
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nơi làm đơn
                      </label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 sm:col-span-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Ngày
                        </label>
                        <input
                          type="text"
                          disabled={isLocked}
                          value={formData.dateDay}
                          onChange={(e) => setFormData({ ...formData, dateDay: e.target.value })}
                          className="w-full px-2 py-2 text-center rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Tháng
                        </label>
                        <input
                          type="text"
                          disabled={isLocked}
                          value={formData.dateMonth}
                          onChange={(e) => setFormData({ ...formData, dateMonth: e.target.value })}
                          className="w-full px-2 py-2 text-center rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Năm
                        </label>
                        <input
                          type="text"
                          disabled={isLocked}
                          value={formData.dateYear}
                          onChange={(e) => setFormData({ ...formData, dateYear: e.target.value })}
                          className="w-full px-2 py-2 text-center rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400 disabled:bg-slate-100"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Live Mini Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-900">Bản xem trước trực tiếp</h3>
                    <p className="text-[11px] text-slate-400">Tự động cập nhật theo thông tin bạn điền</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoToPreview}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Xem khổ A4 &rarr;
                  </button>
                </div>

                {/* Scaled preview frame */}
                <div className="bg-slate-200/70 p-3 sm:p-4 rounded-2xl border border-slate-300/80 overflow-hidden flex justify-center shadow-inner">
                  <div className="w-[210mm] origin-top scale-[0.44] sm:scale-[0.5] md:scale-[0.55] lg:scale-[0.42] xl:scale-[0.5] -mb-[125mm] sm:-mb-[100mm]">
                    <ApplicationDocument appData={formData} />
                  </div>
                </div>
              </div>
            </div>

            {/* Prominent Bottom Navigation Bar for Step 1 */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {!isLocked ? (
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-slate-500" />}
                    <span>Lưu tạm tiến độ</span>
                  </button>
                ) : (
                  <span className="text-xs text-slate-500">
                    Đơn đã được gửi thành công • Chế độ chỉ xem
                  </span>
                )}
              </div>

              <div>
                <button
                  id="btn-next-to-preview"
                  type="button"
                  onClick={handleGoToPreview}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer group"
                >
                  <span>{isLocked ? 'Tiếp tục: Xem mẫu in PDF' : 'Lưu & Sang bước 2: Xem mẫu in PDF'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL PREVIEW & EXPORT PDF */}
        {activeTab === 'preview' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Mẫu Đơn Hoàn Chỉnh (Chuẩn Khổ Giấy A4)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đảm bảo không lỗi font tiếng Việt, footer góc dưới chỉ chứa duy nhất mã đơn eForm: <strong className="font-mono text-slate-800">{formData.code}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  id="btn-print-browser"
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-500" />
                  In ngay
                </button>

                <button
                  id="btn-export-pdf-full"
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang tạo PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Tải file PDF về máy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Document Render on A4 */}
            <div className="bg-slate-200/70 p-4 sm:p-8 rounded-2xl border border-slate-300/80 flex justify-center shadow-inner overflow-x-auto">
              <ApplicationDocument appData={formData} />
            </div>

            {/* Next Steps Guide */}
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex items-start gap-3.5 text-xs text-slate-700">
              <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-900">Hướng dẫn sau khi tải file PDF:</h4>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600 mt-1">
                  <li>In file PDF ra một tờ giấy A4 (không chỉnh sửa lề để giữ chuẩn bố cục).</li>
                  <li>Học sinh và Phụ huynh ký và ghi rõ họ tên vào 2 mục chữ ký phía dưới.</li>
                  <li>Dùng điện thoại chụp ảnh phẳng, rõ nét tờ đơn đã ký hoặc quét file PDF.</li>
                  <li>Bấm nút <strong>"Tiếp tục: Nộp bản ký & Hoàn tất"</strong> ở thanh bên dưới để tải ảnh lên nộp cho thư viện.</li>
                </ol>
              </div>
            </div>

            {/* Prominent Bottom Navigation Bar for Step 2 */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('edit');
                  scrollToTop();
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay lại thông tin đơn
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exporting}
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Tải PDF
                </button>

                <button
                  id="btn-next-to-upload"
                  type="button"
                  onClick={handleGoToUpload}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer group"
                >
                  <span>Tiếp tục: Nộp bản ký & Hoàn tất</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UPLOAD SIGNED DOCUMENT & ADDITIONAL DOCS */}
        {activeTab === 'upload_signed' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <SignedDocUploader
              appData={formData}
              onUpdated={(updated) => {
                setFormData(updated);
                onUpdateApp(updated);
              }}
              onBackToPreview={() => {
                setActiveTab('preview');
                scrollToTop();
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
};
