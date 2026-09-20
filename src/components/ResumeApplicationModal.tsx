import React, { useState } from 'react';
import { getApplicationByCode } from '../services/applicationService';
import { BookLoanApplication } from '../types';
import { Search, ArrowRight, Loader2, KeyRound, X } from 'lucide-react';

interface ResumeApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFound: (app: BookLoanApplication) => void;
}

export const ResumeApplicationModal: React.FC<ResumeApplicationModalProps> = ({ isOpen, onClose, onFound }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Vui lòng nhập mã đơn eForm');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const app = await getApplicationByCode(cleanCode);
      if (!app) {
        setError(`Không tìm thấy đơn với mã "${cleanCode}". Vui lòng kiểm tra lại mã trên file PDF hoặc email.`);
        return;
      }
      onFound(app);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi tra cứu: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200 font-sans">
      <div 
        id="resume-application-modal" 
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-800 text-white rounded-xl flex items-center justify-center border border-slate-700">
              <KeyRound className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tiếp tục Điền Đơn Cũ & Tra cứu</h2>
              <p className="text-slate-400 text-xs mt-0.5">Nhập mã đơn eForm để điền tiếp hoặc tra cứu kết quả xét duyệt</p>
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

        <form onSubmit={handleSearch} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="input-search-code" className="block text-xs font-semibold text-slate-700 mb-1">
              Mã đơn eForm
            </label>
            <div className="relative">
              <input
                id="input-search-code"
                type="text"
                required
                autoFocus
                placeholder="VD: TDN-2026-X7K9 hoặc SGK-..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-mono tracking-wider focus:outline-hidden focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 uppercase text-sm"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              Mã số nằm ở góc dưới bên phải (footer) của file PDF đã xuất hoặc trong thông tin lúc khởi tạo đơn.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              id="btn-cancel-resume-modal"
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              id="btn-submit-resume-code"
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tra cứu...
                </>
              ) : (
                <>
                  Tiếp tục / Tra cứu
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
