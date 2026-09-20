import React, { useState, useEffect } from 'react';
import { getAllApplications, updateApplicationStatus } from '../services/applicationService';
import { BookLoanApplication, AdditionalDoc } from '../types';
import { downloadBase64File, formatBase64Size } from '../utils/fileUtils';
import { 
  LogOut, 
  Search, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Download, 
  FileCheck, 
  RefreshCw,
  X,
  Lock,
  Paperclip,
  Check,
  Ban,
  School,
  Maximize2,
  Filter,
  ChevronRight,
  Printer
} from 'lucide-react';
import { ApplicationDocument } from './ApplicationDocument';
import { exportDocumentToPdf } from '../utils/pdfExport';
import { FileViewerModal } from './FileViewerModal';

interface AdminDashboardProps {
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [apps, setApps] = useState<BookLoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'has_signed_doc' | 'draft' | 'approved'>('all');
  const [selectedApp, setSelectedApp] = useState<BookLoanApplication | null>(null);
  const [detailTab, setDetailTab] = useState<'signed_docs' | 'form_preview' | 'notes'>('signed_docs');
  
  // Lightbox for previewing images or PDFs
  const [viewingFile, setViewingFile] = useState<{ url: string; title: string; isPdf?: boolean } | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchApps = async () => {
    try {
      setLoading(true);
      const data = await getAllApplications();
      setApps(data);
      if (selectedApp) {
        const found = data.find((a) => a.code === selectedApp.code);
        if (found) setSelectedApp(found);
      }
    } catch (err) {
      console.error('Error fetching admin apps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // When selectedApp changes, pre-fill admin note input
  useEffect(() => {
    if (selectedApp) {
      setAdminNoteInput(selectedApp.adminNotes || '');
      setDetailTab('signed_docs');
    }
  }, [selectedApp?.code]);

  const filteredApps = apps.filter((app) => {
    const matchSearch =
      app.code.toLowerCase().includes(search.toLowerCase()) ||
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.className.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter === 'submitted') return app.status === 'submitted';
    if (statusFilter === 'has_signed_doc') return Boolean(app.signedFile);
    if (statusFilter === 'draft') return app.status === 'draft';
    if (statusFilter === 'approved') return app.status === 'approved';
    return true;
  });

  const handleExportSingle = async (app: BookLoanApplication) => {
    setExportingId(app.code);
    try {
      await exportDocumentToPdf('admin-printable-doc', `Don_Xin_Muon_SGK_${app.code}_${app.fullName.replace(/\s+/g, '_')}`);
    } catch (err) {
      console.error(err);
    } finally {
      setExportingId(null);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'submitted' | 'has_signed_doc' | 'approved' | 'rejected') => {
    if (!selectedApp) return;
    try {
      setUpdatingStatus(true);
      setStatusError(null);
      await updateApplicationStatus(selectedApp.code, newStatus, adminNoteInput);
      const updated: BookLoanApplication = {
        ...selectedApp,
        status: newStatus,
        adminNotes: adminNoteInput,
        updatedAt: new Date().toISOString(),
      };
      setSelectedApp(updated);
      setApps((prev) => prev.map((a) => (a.code === updated.code ? updated : a)));
    } catch (err: any) {
      console.error(err);
      setStatusError('Không thể cập nhật trạng thái: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openSignedDocPreview = (app: BookLoanApplication) => {
    if (!app.signedFile) return;
    setViewingFile({
      url: app.signedFile,
      title: `Bản đơn có chữ ký - ${app.fullName} (${app.code})`,
    });
  };

  const openExtraDocPreview = (doc: AdditionalDoc, app: BookLoanApplication) => {
    setViewingFile({
      url: doc.fileData,
      title: `${doc.description} (${doc.name}) - ${app.fullName}`,
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 font-sans selection:bg-slate-200">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-800 text-white rounded-xl flex items-center justify-center border border-slate-700">
              <School className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight">
                Cổng Quản Trị Thư Viện • THPT Chuyên Trần Đại Nghĩa
              </h1>
              <p className="text-xs text-slate-400">Kiểm duyệt hồ sơ mượn SGK và xác thực bản ký tên của học sinh & CMHS</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              id="btn-admin-refresh"
              type="button"
              onClick={fetchApps}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            <button
              id="btn-admin-logout"
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Tổng số hồ sơ</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{apps.length}</p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Đã nộp chính thức</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {apps.filter((a) => a.status === 'submitted' || a.isLocked).length}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Có bản chụp chữ ký</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {apps.filter((a) => Boolean(a.signedFile)).length}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400">Đã phê duyệt</span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {apps.filter((a) => a.status === 'approved').length}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lớp, mã đơn..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-400 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({apps.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('submitted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'submitted'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đã nộp ({apps.filter((a) => a.status === 'submitted').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('has_signed_doc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'has_signed_doc'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Có ảnh chữ ký ({apps.filter((a) => Boolean(a.signedFile)).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Đã duyệt ({apps.filter((a) => a.status === 'approved').length})
            </button>
          </div>
        </div>

        {/* Applications List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-600" />
              <p className="text-xs">Đang tải danh sách hồ sơ từ máy chủ...</p>
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-medium">Không tìm thấy đơn nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Mã eForm</th>
                    <th className="px-5 py-3.5">Học sinh / Lớp</th>
                    <th className="px-5 py-3.5">Số sách mượn</th>
                    <th className="px-5 py-3.5">Trạng thái</th>
                    <th className="px-5 py-3.5">Tài liệu đã nộp</th>
                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredApps.map((app) => (
                    <tr key={app.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {app.code}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{app.fullName}</div>
                        <div className="text-xs text-slate-500">Lớp {app.className || '—'} • {app.email}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 whitespace-nowrap">
                        {app.bookQuantity ? `${app.bookQuantity} cuốn` : `${(app.bookItems || []).filter(Boolean).length} cuốn`}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {app.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã duyệt cấp sách
                          </span>
                        ) : app.status === 'submitted' || app.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                            <Lock className="w-3.5 h-3.5 text-slate-600" />
                            Đã nộp chính thức
                          </span>
                        ) : app.signedFile ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                            Có ảnh chữ ký
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Đang điền dở
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {app.signedFile ? (
                            <button
                              type="button"
                              onClick={() => openSignedDocPreview(app)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 cursor-pointer transition-colors"
                              title="Nhấn để xem trực tiếp bản đơn có chữ ký"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Xem bản ký
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Chưa nộp bản ký</span>
                          )}

                          {(app.additionalDocs || []).length > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              {app.additionalDocs!.length} tài liệu
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedApp(app)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Comprehensive Application Detail Modal for Librarians */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
          <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl my-6 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200 shrink-0 border border-slate-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm sm:text-base truncate">
                      {selectedApp.fullName}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {selectedApp.code}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Lớp {selectedApp.className}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Email: {selectedApp.email} • Tạo lúc: {new Date(selectedApp.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleExportSingle(selectedApp)}
                  disabled={exportingId === selectedApp.code}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportingId === selectedApp.code ? 'Đang xuất...' : 'Xuất PDF A4'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Status Control Ribbon */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-semibold">Trạng thái hiện tại:</span>
                <span className="font-bold text-xs px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-800">
                  {selectedApp.status === 'approved' && '✅ Đã duyệt cấp sách'}
                  {selectedApp.status === 'submitted' && '📩 Đã nộp chính thức (Chờ duyệt)'}
                  {selectedApp.status === 'has_signed_doc' && '📑 Có ảnh chữ ký'}
                  {selectedApp.status === 'draft' && '📝 Đang điền dở (Bản nháp)'}
                  {selectedApp.status === 'rejected' && '❌ Từ chối hồ sơ'}
                </span>
                {selectedApp.isLocked && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                    Đã khóa đơn
                  </span>
                )}
              </div>

              {/* Status change actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('approved')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Duyệt cấp sách
                </button>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('rejected')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Từ chối
                </button>
                <button
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('submitted')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  Đang chờ duyệt
                </button>
              </div>
            </div>

            {/* Modal Internal Navigation Tabs */}
            <div className="border-b border-slate-200 px-4 sm:px-6 flex gap-6 text-xs sm:text-sm bg-white">
              <button
                type="button"
                onClick={() => setDetailTab('signed_docs')}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  detailTab === 'signed_docs'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Bản quét chữ ký & Tài liệu nộp</span>
                {selectedApp.signedFile && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('form_preview')}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  detailTab === 'form_preview'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Nội dung đơn mượn (Bản in A4)</span>
              </button>

              <button
                type="button"
                onClick={() => setDetailTab('notes')}
                className={`py-3 font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  detailTab === 'notes'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Ghi chú xét duyệt</span>
                {selectedApp.adminNotes && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                )}
              </button>
            </div>

            {/* Modal Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60 text-xs sm:text-sm">
              {/* TAB A: SIGNED DOC & EXTRA DOCS */}
              {detailTab === 'signed_docs' && (
                <div className="space-y-6">
                  {/* 1. Signed Document Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          1. Bản đơn có chữ ký học sinh & xác nhận CMHS
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tệp ảnh chụp hoặc bản quét tờ đơn A4 đã ký để cán bộ thư viện đối chiếu
                        </p>
                      </div>

                      <div>
                        {selectedApp.signedFile ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Đã tải lên
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Chưa có bản ký
                          </span>
                        )}
                      </div>
                    </div>

                    {selectedApp.signedFile ? (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {selectedApp.signedFileName || `Don_da_ky_${selectedApp.code}.pdf`}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Dung lượng: {formatBase64Size(selectedApp.signedFile)} • Thời gian tải: {selectedApp.signedUploadedAt ? new Date(selectedApp.signedUploadedAt).toLocaleString('vi-VN') : 'Mới đây'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => openSignedDocPreview(selectedApp)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              Xem phóng to
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadBase64File(
                                selectedApp.signedFile!,
                                selectedApp.signedFileName || `Don_Ky_Ten_${selectedApp.code}.pdf`
                              )}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              Tải tệp gốc
                            </button>
                          </div>
                        </div>

                        {/* Direct visual preview inside the tab */}
                        <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex justify-center items-center min-h-[220px]">
                          {selectedApp.signedFile.startsWith('data:image/') ? (
                            <img
                              src={selectedApp.signedFile}
                              alt="Bản đơn đã ký tên"
                              className="max-h-[350px] w-auto object-contain rounded-lg shadow-xs cursor-pointer hover:opacity-95"
                              onClick={() => openSignedDocPreview(selectedApp)}
                            />
                          ) : (
                            <div className="text-center py-6">
                              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                              <p className="font-semibold text-slate-700 text-xs">Tệp tài liệu PDF</p>
                              <button
                                type="button"
                                onClick={() => openSignedDocPreview(selectedApp)}
                                className="mt-2 text-xs font-semibold text-sky-700 underline"
                              >
                                Nhấn để mở xem PDF
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Học sinh chưa chụp ảnh hoặc nộp tệp đơn có chữ ký.
                      </div>
                    )}
                  </div>

                  {/* 2. Additional Documents Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-slate-700" />
                          2. Các tài liệu nộp bổ sung (Thẻ HS, Giấy ưu tiên...)
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tài liệu đính kèm kèm theo hồ sơ của học sinh
                        </p>
                      </div>

                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {(selectedApp.additionalDocs || []).length} tệp
                      </span>
                    </div>

                    {(selectedApp.additionalDocs || []).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedApp.additionalDocs!.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between gap-3"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              {doc.fileData.startsWith('data:image/') ? (
                                <img
                                  src={doc.fileData}
                                  alt={doc.description}
                                  className="w-14 h-14 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer shadow-2xs"
                                  onClick={() => openExtraDocPreview(doc, selectedApp)}
                                />
                              ) : (
                                <div className="w-14 h-14 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                                  <FileText className="w-7 h-7 text-slate-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold text-slate-400">Tài liệu #{idx + 1}</span>
                                <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">
                                  {doc.description}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  {doc.name} • {formatBase64Size(doc.fileData)}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Tải lên: {new Date(doc.uploadedAt).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 justify-end">
                              <button
                                type="button"
                                onClick={() => openExtraDocPreview(doc, selectedApp)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Xem
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadBase64File(doc.fileData, doc.name)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Tải
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Học sinh không đính kèm thêm tài liệu nào.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB B: A4 FORM PREVIEW */}
              {detailTab === 'form_preview' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Văn bản Đơn mượn SGK theo mẫu chuẩn A4</h4>
                      <p className="text-xs text-slate-400">Đầy đủ thông tin người làm đơn, danh mục sách và mã eForm ở chân trang</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExportSingle(selectedApp)}
                      disabled={exportingId === selectedApp.code}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {exportingId === selectedApp.code ? 'Đang xuất...' : 'Tải file PDF A4'}
                    </button>
                  </div>

                  <div className="bg-slate-200/70 p-4 sm:p-6 rounded-2xl border border-slate-300 flex justify-center shadow-inner overflow-x-auto">
                    <div id="admin-printable-doc">
                      <ApplicationDocument appData={selectedApp} />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB C: ADMIN NOTES */}
              {detailTab === 'notes' && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 max-w-2xl mx-auto">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Ghi chú xét duyệt của Cán bộ thư viện</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ghi chú nội bộ hoặc lý do phê duyệt / từ chối hồ sơ này
                    </p>
                  </div>

                  <textarea
                    rows={4}
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="Nhập ghi chú xét duyệt (ví dụ: Thiếu chữ ký CMHS, Cần bổ sung thẻ học sinh bản mới...)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange(selectedApp.status)}
                      className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                    >
                      {updatingStatus ? 'Đang lưu...' : 'Lưu ghi chú'}
                    </button>
                  </div>
                  {statusError && (
                    <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2 rounded-lg mt-2">
                      {statusError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Canvas-based & Image File Viewer Modal (Zero iframes, cannot be blocked by Google) */}
      {viewingFile && (
        <FileViewerModal
          fileData={viewingFile.url}
          fileName={viewingFile.title}
          title={viewingFile.title}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
};
