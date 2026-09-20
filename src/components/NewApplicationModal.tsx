import React, { useState } from 'react';
import { BookLoanApplication } from '../types';
import { generateApplicationCode, saveApplication } from '../services/applicationService';
import { FileText, ArrowRight, Loader2, Sparkles, X } from 'lucide-react';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (app: BookLoanApplication) => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('9A9');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentYear = new Date().getFullYear();
  const schoolYearStr = `${currentYear} - ${currentYear + 1}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !className.trim() || !email.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, lớp và email');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Email không đúng định dạng');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const code = generateApplicationCode();
      const today = new Date();

      const newApp: BookLoanApplication = {
        code,
        fullName: fullName.trim(),
        className: className.trim(),
        email: email.trim(),
        homeroomTeacherClass: className.trim(),
        schoolYear: schoolYearStr,
        bookGrade: className.trim().replace(/\D/g, '') || '9',
        bookQuantity: '',
        bookItems: Array(10).fill(''),
        city: 'TP. Hồ Chí Minh',
        dateDay: String(today.getDate()).padStart(2, '0'),
        dateMonth: String(today.getMonth() + 1).padStart(2, '0'),
        dateYear: String(today.getFullYear()),
        status: 'draft',
        additionalDocs: [],
        createdAt: today.toISOString(),
        updatedAt: today.toISOString(),
      };

      await saveApplication(newApp);
      onCreated(newApp);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Không thể khởi tạo đơn trên hệ thống: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
      <div 
        id="new-application-modal" 
        className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="bg-slate-900 text-white p-6 sm:p-7 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500/20 text-sky-400 rounded-xl flex items-center justify-center border border-sky-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Khởi tạo Đơn Mới</h2>
              <p className="text-slate-400 text-xs mt-0.5">Nhập thông tin cơ bản để nhận mã đơn eForm</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="input-full-name" className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-full-name"
              type="text"
              required
              placeholder="VD: Nguyễn Văn An"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-class-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Lớp <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-class-name"
                type="text"
                required
                placeholder="VD: 9A9"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
              />
            </div>

            <div>
              <label htmlFor="input-school-year" className="block text-xs font-semibold text-slate-700 mb-1">
                Năm học
              </label>
              <input
                id="input-school-year"
                type="text"
                disabled
                value={schoolYearStr}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="input-email" className="block text-xs font-semibold text-slate-700 mb-1">
              Email nhận thông báo & mã đơn <span className="text-rose-500">*</span>
            </label>
            <input
              id="input-email"
              type="email"
              required
              placeholder="VD: phuhuynh@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ cấp Mã đơn điện tử để lưu tiến độ và tra cứu kết quả duyệt từ Ban Thư viện.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              id="btn-cancel-new-modal"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              id="btn-create-new-app"
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                <>
                  Tạo mã đơn & Tiếp tục
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
