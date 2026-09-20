import React, { useState } from 'react';
import { BookLoanApplication } from './types';
import { NewApplicationModal } from './components/NewApplicationModal';
import { ResumeApplicationModal } from './components/ResumeApplicationModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ApplicationEditor } from './components/ApplicationEditor';
import { 
  FilePlus2, 
  FileSearch, 
  ShieldCheck, 
  CheckCircle2, 
  School, 
  ArrowRight
} from 'lucide-react';

export default function App() {
  const [currentApp, setCurrentApp] = useState<BookLoanApplication | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // If Admin is logged in, show Admin Dashboard
  if (isAdminLoggedIn) {
    return <AdminDashboard onLogout={() => setIsAdminLoggedIn(false)} />;
  }

  // If currently editing an application, render Editor
  if (currentApp) {
    return (
      <ApplicationEditor
        app={currentApp}
        onBack={() => setCurrentApp(null)}
        onUpdateApp={(updated) => setCurrentApp(updated)}
      />
    );
  }

  // Main Portal Landing Page - Corporate, Minimalist, Editorial Aesthetics
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between font-sans selection:bg-slate-200">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200/90 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <School className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight leading-tight">
                  THPT Chuyên Trần Đại Nghĩa
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Lớp 9A9
                </span>
              </div>
              <p className="text-xs text-slate-500">Đơn xin mượn sách giáo khoa Thư viện - Lớp 9A9</p>
            </div>
          </div>

          <button
            id="btn-open-admin-login"
            type="button"
            onClick={() => setShowAdminLoginModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>Cán bộ Thư viện</span>
          </button>
        </div>
      </nav>

      {/* Main Hero & Portals */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col justify-center">
        {/* Minimalist Corporate Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Đăng Ký Mượn Sách Giáo Khoa Lớp 9A9
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mt-3 leading-relaxed max-w-xl mx-auto">
            Học sinh và phụ huynh có thể lập đơn mới, lưu tạm tiến độ bất cứ lúc nào, xuất file PDF A4 chuẩn mẫu để ký tên và nộp ảnh đơn đã ký trực tuyến cho nhà trường.
          </p>
        </div>

        {/* 2 Primary Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          {/* Choice 1: Điền Đơn Mới */}
          <div
            id="card-new-application"
            className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all flex flex-col justify-between cursor-pointer"
            onClick={() => setShowNewModal(true)}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <FilePlus2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Điền Đơn Mới</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Nhập họ tên, lớp và email để hệ thống tự động cấp một <strong>mã đơn eForm</strong>. Hỗ trợ chọn nhanh bộ SGK Lớp 9 chuẩn theo danh mục nhà trường.
              </p>

              <div className="mt-6 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Cấp mã tra cứu eForm tức thì</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Chọn nhanh danh mục SGK Lớp 9</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lưu tạm và tiếp tục bất cứ lúc nào</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Bắt đầu làm đơn mới
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Khởi tạo
              </span>
            </div>
          </div>

          {/* Choice 2: Tiếp Tục Đơn Cũ & Tra Cứu */}
          <div
            id="card-resume-application"
            className="group relative bg-white rounded-3xl p-7 sm:p-8 border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all flex flex-col justify-between cursor-pointer"
            onClick={() => setShowResumeModal(true)}
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center mb-6 group-hover:bg-slate-900 group-hover:text-white transition-all">
                <FileSearch className="w-6 h-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Tiếp Tục Điền Đơn Cũ & Tra Cứu</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Đã có mã đơn? Nhập mã để điền tiếp các mục dở dang hoặc chụp ảnh/tải lên tệp đơn có chữ ký kèm tài liệu bổ sung để nộp chính thức.
              </p>

              <div className="mt-6 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tiếp tục điền khi đang làm dở</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Chụp ảnh hoặc upload bản giấy có chữ ký</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Đính kèm tối đa 5 tài liệu bổ sung</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tra cứu tiến độ & kết quả xét duyệt</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Nhập mã để tiếp tục / Tra cứu
                <ArrowRight className="w-4 h-4" />
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Tra cứu
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Process Overview */}
        <div className="mt-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Quy trình mượn sách giáo khoa tại Thư viện THPT Chuyên Trần Đại Nghĩa
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">4 bước hoàn thiện hồ sơ nhanh chóng và chính xác</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 mx-auto rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center mb-2">
                1
              </span>
              <h4 className="font-semibold text-xs text-slate-800">Điền đơn & chọn sách</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Nhập họ tên, lớp và chọn các sách từ danh mục Lớp 9.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 mx-auto rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center mb-2">
                2
              </span>
              <h4 className="font-semibold text-xs text-slate-800">Lưu nháp & Xuất PDF</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Lưu tạm bất cứ lúc nào, xuất file PDF chuẩn có mã eForm ở chân trang.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 mx-auto rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center mb-2">
                3
              </span>
              <h4 className="font-semibold text-xs text-slate-800">In & Ký xác nhận</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                In ra giấy A4 để phụ huynh (CMHS) và học sinh ký tên.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="w-6 h-6 mx-auto rounded-full bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center mb-2">
                4
              </span>
              <h4 className="font-semibold text-xs text-slate-800">Nộp đơn có chữ ký</h4>
              <p className="text-[11px] text-slate-500 mt-1">
                Chụp ảnh tờ đơn đã ký tải lên, nộp thêm tài liệu và khóa hồ sơ.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Corporate Minimalist Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Thư viện Trường THPT Chuyên Trần Đại Nghĩa • Đơn Mượn Sách Lớp 9A9</span>
          <span className="text-slate-400">Cổng tiếp nhận hồ sơ trực tuyến dành cho Học sinh & Phụ huynh</span>
        </div>
      </footer>

      {/* Modals */}
      <NewApplicationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(app) => setCurrentApp(app)}
      />

      <ResumeApplicationModal
        isOpen={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onFound={(app) => setCurrentApp(app)}
      />

      <AdminLoginModal
        isOpen={showAdminLoginModal}
        onClose={() => setShowAdminLoginModal(false)}
        onSuccess={() => setIsAdminLoggedIn(true)}
      />
    </div>
  );
}
