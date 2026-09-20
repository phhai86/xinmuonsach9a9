import React, { useRef, useState } from 'react';
import { updateSignedFile, updateAdditionalDocs, lockApplication } from '../services/applicationService';
import { BookLoanApplication, AdditionalDoc } from '../types';
import { downloadBase64File, formatBase64Size, formatBytes, processAndOptimizeUploadFile } from '../utils/fileUtils';
import { FileViewerModal } from './FileViewerModal';
import { 
  Upload, 
  Camera, 
  CheckCircle2, 
  FileCheck, 
  Loader2, 
  Eye, 
  Trash2, 
  Plus, 
  FileText, 
  Lock, 
  Send, 
  Download, 
  X, 
  Clock, 
  Paperclip,
  Maximize2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface SignedDocUploaderProps {
  appData: BookLoanApplication;
  onUpdated: (updatedApp: BookLoanApplication) => void;
  onBackToPreview?: () => void;
}

export const SignedDocUploader: React.FC<SignedDocUploaderProps> = ({ 
  appData, 
  onUpdated,
  onBackToPreview 
}) => {
  const [uploadingSigned, setUploadingSigned] = useState(false);
  const [uploadingExtra, setUploadingExtra] = useState(false);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [previewItem, setPreviewItem] = useState<{ url: string; title: string; fileName?: string } | null>(null);

  // In-app modal confirmation states (replaces window.confirm/alert which are blocked in iframes)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showRemoveSignedModal, setShowRemoveSignedModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<AdditionalDoc | null>(null);

  // Extra document upload form state
  const [extraDesc, setExtraDesc] = useState('');
  const [extraDescError, setExtraDescError] = useState('');
  const [showAddDocForm, setShowAddDocForm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const extraFileInputRef = useRef<HTMLInputElement>(null);

  // Locked if explicitly locked or submitted or approved
  const isLocked = Boolean(appData.isLocked || appData.status === 'submitted' || appData.status === 'approved');

  // Handle main signed document upload
  const handleSignedFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Kích thước tệp vượt quá 15MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    try {
      setUploadingSigned(true);
      setError('');
      setSuccessMsg('');

      // Automatically optimize & compress photo to ensure < 220KB for Firestore
      const optimized = await processAndOptimizeUploadFile(file, {
        maxDimension: 1280,
        targetSizeBytes: 220 * 1024,
        maxNonImageSizeBytes: 400 * 1024,
      });

      await updateSignedFile(appData.code, optimized.base64, optimized.fileName);

      const updated: BookLoanApplication = {
        ...appData,
        signedFile: optimized.base64,
        signedFileName: optimized.fileName,
        signedUploadedAt: new Date().toISOString(),
        status: 'has_signed_doc',
        updatedAt: new Date().toISOString(),
      };

      onUpdated(updated);
      setSuccessMsg(`Đã tải lên và tối ưu hóa tệp chữ ký thành công (${formatBytes(optimized.sizeBytes)}).`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi tải lên tệp');
    } finally {
      setUploadingSigned(false);
      if (e.target) e.target.value = '';
    }
  };

  // Remove signed document (trigger in-app modal)
  const handleRemoveSignedFile = () => {
    if (isLocked) return;
    setShowRemoveSignedModal(true);
  };

  const executeRemoveSignedFile = async () => {
    if (isLocked) return;
    setShowRemoveSignedModal(false);
    try {
      setUploadingSigned(true);
      setError('');
      setSuccessMsg('');
      await updateSignedFile(appData.code, null, null);
      const updated: BookLoanApplication = {
        ...appData,
        signedFile: undefined,
        signedFileName: undefined,
        signedUploadedAt: undefined,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      onUpdated(updated);
      setSuccessMsg('Đã xóa bản chữ ký cũ. Bạn có thể tải lên bản mới.');
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi xóa tệp: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setUploadingSigned(false);
    }
  };

  // Handle uploading additional document
  const handleExtraDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!extraDesc.trim()) {
      setExtraDescError('Vui lòng nhập mô tả tên tài liệu (ví dụ: Bản sao thẻ học sinh, Giấy tờ ưu tiên...)');
      if (e.target) e.target.value = '';
      return;
    }
    setExtraDescError('');

    if (file.size > 15 * 1024 * 1024) {
      setError('Kích thước tệp vượt quá 15MB.');
      return;
    }

    try {
      setUploadingExtra(true);
      setError('');
      setSuccessMsg('');

      // Automatically optimize & compress photo to ensure < 120KB for Firestore
      const optimized = await processAndOptimizeUploadFile(file, {
        maxDimension: 1000,
        targetSizeBytes: 120 * 1024,
        maxNonImageSizeBytes: 300 * 1024,
      });

      const newDoc: AdditionalDoc = {
        id: 'doc_' + Date.now(),
        name: optimized.fileName,
        fileData: optimized.base64,
        description: extraDesc.trim(),
        uploadedAt: new Date().toISOString(),
      };

      const updatedDocs = [...(appData.additionalDocs || []), newDoc];
      await updateAdditionalDocs(appData.code, updatedDocs);

      const updated: BookLoanApplication = {
        ...appData,
        additionalDocs: updatedDocs,
        updatedAt: new Date().toISOString(),
      };

      onUpdated(updated);
      setExtraDesc('');
      setExtraDescError('');
      setShowAddDocForm(false);
      setSuccessMsg(`Đã tải lên tài liệu bổ sung thành công (${formatBytes(optimized.sizeBytes)}).`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi khi thêm tài liệu');
    } finally {
      setUploadingExtra(false);
      if (e.target) e.target.value = '';
    }
  };

  // Delete additional document (trigger in-app modal)
  const handleDeleteExtraDoc = (doc: AdditionalDoc) => {
    if (isLocked) return;
    setDocToDelete(doc);
  };

  const executeDeleteExtraDoc = async () => {
    if (isLocked || !docToDelete) return;
    const targetDoc = docToDelete;
    setDocToDelete(null);

    try {
      setError('');
      setSuccessMsg('');
      const updatedDocs = (appData.additionalDocs || []).filter((d) => d.id !== targetDoc.id);
      await updateAdditionalDocs(appData.code, updatedDocs);
      const updated: BookLoanApplication = {
        ...appData,
        additionalDocs: updatedDocs,
        updatedAt: new Date().toISOString(),
      };
      onUpdated(updated);
      setSuccessMsg(`Đã xóa tài liệu "${targetDoc.name}".`);
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi xóa tài liệu: ' + (err.message || 'Lỗi mạng'));
    }
  };

  // Final formal submission handler - Opens in-app modal (never blocked by window.confirm)
  const handleFinalSubmitClick = () => {
    if (isLocked || locking) return;
    setError('');
    setShowSubmitModal(true);
  };

  const doFinalSubmit = async () => {
    if (isLocked) return;

    try {
      setLocking(true);
      setError('');
      setSuccessMsg('');
      setShowSubmitModal(false);

      await lockApplication(appData.code);

      const updated: BookLoanApplication = {
        ...appData,
        isLocked: true,
        status: 'submitted',
        updatedAt: new Date().toISOString(),
      };

      onUpdated(updated);
      setSuccessMsg('Nộp hồ sơ thành công! Đơn đã được chuyển sang Ban Thư viện trường THPT Chuyên Trần Đại Nghĩa để xử lý.');
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi nộp đơn lên hệ thống: ' + (err.message || 'Lỗi kết nối'));
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleSignedFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleSignedFileChange}
        className="hidden"
      />
      <input
        ref={extraFileInputRef}
        type="file"
        accept="image/*,application/pdf,.doc,.docx"
        onChange={handleExtraDocUpload}
        className="hidden"
      />

      {/* Status banner when locked */}
      {isLocked && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">Hồ sơ đã nộp chính thức thành công</h4>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {appData.status === 'approved' ? 'Đã phê duyệt' : 'Đang chờ duyệt'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Đơn mượn sách giáo khoa đã được chuyển đến Ban Thư viện trường THPT Chuyên Trần Đại Nghĩa. 
                Hồ sơ đang ở chế độ <strong>Khóa (Chỉ xem)</strong> để bảo đảm tính toàn vẹn chữ ký.
              </p>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-emerald-200 sm:pl-4 shrink-0">
            <span className="text-[11px] text-slate-500 block">Mã tra cứu:</span>
            <span className="font-mono font-bold text-sm text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
              {appData.code}
            </span>
          </div>
        </div>
      )}

      {/* Notifications */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-800 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </span>
          <button type="button" onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section 1: Signed Document Upload Card */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-700" />
              1. Bản đơn có đầy đủ chữ ký học sinh & xác nhận CMHS
              <span className="text-rose-500">*</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chụp ảnh hoặc quét (scan) tờ đơn A4 sau khi phụ huynh và học sinh đã ký tên
            </p>
          </div>
          <div>
            {appData.signedFile ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã có tệp chữ ký
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Chưa nộp bản ký
              </span>
            )}
          </div>
        </div>

        {/* Existing Signed File Display */}
        {appData.signedFile ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {appData.signedFile.startsWith('data:image/') ? (
                <div 
                  className="relative group cursor-pointer shrink-0"
                  onClick={() => setPreviewItem({ 
                    url: appData.signedFile!, 
                    title: 'Ảnh bản đơn có chữ ký', 
                    fileName: appData.signedFileName || 'Don_da_ky.jpg' 
                  })}
                >
                  <img
                    src={appData.signedFile}
                    alt="Bản đơn đã ký"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs group-hover:opacity-90"
                  />
                  <div 
                    className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 bg-white text-slate-700 rounded-xl border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">
                  {appData.signedFileName || 'Don_da_ky_xac_nhan.pdf'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dung lượng: {formatBase64Size(appData.signedFile)} • Tải lên: {appData.signedUploadedAt ? new Date(appData.signedUploadedAt).toLocaleString('vi-VN') : 'Mới đây'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPreviewItem({
                  url: appData.signedFile!,
                  title: 'Bản đơn có chữ ký: ' + (appData.signedFileName || appData.code),
                  fileName: appData.signedFileName || `Don_da_ky_${appData.code}.jpg`
                })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Xem tệp
              </button>

              <button
                type="button"
                onClick={() => downloadBase64File(appData.signedFile!, appData.signedFileName || `Don_Ky_Ten_${appData.code}.pdf`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Tải tệp
              </button>

              {!isLocked && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingSigned}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Thay tệp khác
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveSignedFile}
                    disabled={uploadingSigned}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                    title="Xóa tệp chữ ký này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          /* Upload dropzone when no file */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              id="btn-upload-signed-file"
              type="button"
              disabled={isLocked || uploadingSigned}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-white flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                {uploadingSigned ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
              <span className="font-semibold text-xs text-slate-800">Chọn tệp từ máy tính / điện thoại</span>
              <span className="text-[11px] text-slate-400">Định dạng JPG, PNG hoặc PDF (Tự động nén tối ưu dung lượng)</span>
            </button>

            <button
              id="btn-camera-signed-file"
              type="button"
              disabled={isLocked || uploadingSigned}
              onClick={() => cameraInputRef.current?.click()}
              className="p-6 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50/60 hover:bg-white flex flex-col items-center justify-center gap-2 transition-all group cursor-pointer text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                {uploadingSigned ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </div>
              <span className="font-semibold text-xs text-slate-800">Chụp ảnh trực tiếp bằng máy ảnh</span>
              <span className="text-[11px] text-slate-400">Căn góc đủ sáng, phẳng tờ giấy A4 (Tự động tối ưu ảnh)</span>
            </button>
          </div>
        )}
      </section>

      {/* Section 2: Additional Documents */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-slate-700" />
              2. Tài liệu nộp bổ sung (Không bắt buộc)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đính kèm bản sao thẻ học sinh, xác nhận chính sách ưu tiên hoặc minh chứng liên quan (tối đa 5 tệp)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {(appData.additionalDocs || []).length}/5 tệp
          </span>
        </div>

        {/* Existing Additional Docs List */}
        <div className="space-y-2.5">
          {(appData.additionalDocs || []).map((doc, idx) => (
            <div
              key={doc.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {doc.fileData.startsWith('data:image/') ? (
                  <img
                    src={doc.fileData}
                    alt={doc.description}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                    onClick={() => setPreviewItem({ url: doc.fileData, title: doc.description, fileName: doc.name })}
                  />
                ) : (
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    <FileText className="w-6 h-6 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-500">#{idx + 1}</span>
                    <p className="font-semibold text-slate-900 text-xs sm:text-sm truncate">{doc.description}</p>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {doc.name} • {formatBase64Size(doc.fileData)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setPreviewItem({
                    url: doc.fileData,
                    title: doc.description,
                    fileName: doc.name
                  })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Xem
                </button>
                <button
                  type="button"
                  onClick={() => downloadBase64File(doc.fileData, doc.name)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải
                </button>
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => handleDeleteExtraDoc(doc)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 cursor-pointer"
                    title="Xóa tài liệu này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {(appData.additionalDocs || []).length === 0 && !showAddDocForm && (
            <div className="text-center py-5 text-slate-400 text-xs italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Chưa có tài liệu bổ sung nào được tải lên.
            </div>
          )}
        </div>

        {/* Add extra doc form */}
        {!isLocked && (appData.additionalDocs || []).length < 5 && (
          <div>
            {!showAddDocForm ? (
              <button
                type="button"
                onClick={() => setShowAddDocForm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Đính kèm thêm tài liệu
              </button>
            ) : (
              <div className="p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800">Thêm tài liệu đính kèm mới</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDocForm(false);
                      setExtraDescError('');
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 font-medium mb-1">
                    Tên/Mô tả tài liệu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bản chụp thẻ học sinh, Giấy tờ ưu tiên..."
                    value={extraDesc}
                    onChange={(e) => {
                      setExtraDesc(e.target.value);
                      if (extraDescError) setExtraDescError('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-400"
                  />
                  {extraDescError && (
                    <p className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {extraDescError}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={uploadingExtra || !extraDesc.trim()}
                    onClick={() => extraFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploadingExtra ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Chọn tệp và tải lên
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddDocForm(false);
                      setExtraDescError('');
                    }}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Section 3: Prominent Bottom Navigation and Submission Bar */}
      <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          {onBackToPreview && (
            <button
              type="button"
              onClick={onBackToPreview}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
            >
              &larr; Quay lại mẫu in PDF
            </button>
          )}
        </div>

        <div>
          {isLocked ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hồ sơ đã được gửi thành công • Trạng thái: {appData.status === 'approved' ? 'Đã duyệt' : 'Đang xử lý'}</span>
            </div>
          ) : (
            <button
              id="btn-final-submit-signed"
              type="button"
              disabled={locking}
              onClick={handleFinalSubmitClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {locking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang nộp hồ sơ...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-white" />
                  Nộp hồ sơ chính thức cho Thư viện
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Modal 1: In-App Final Submission Confirmation (Solves unresponsive button in iframe) */}
      {showSubmitModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Xác nhận nộp hồ sơ chính thức</h3>
                  <p className="text-xs text-slate-500">Trường THPT Chuyên Trần Đại Nghĩa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile check */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mã hồ sơ:</span>
                <span className="font-mono font-bold text-slate-800">{appData.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Học sinh:</span>
                <span className="font-semibold text-slate-800">{appData.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lớp đăng ký:</span>
                <span className="font-semibold text-slate-800">{appData.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số lượng sách đăng ký mượn:</span>
                <span className="font-bold text-emerald-700">{(appData.bookItems || []).filter(b => b && b.trim() !== '').length} mục</span>
              </div>
            </div>

            {/* Signed status condition */}
            {appData.signedFile ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Đã đính kèm tệp bản đơn có chữ ký:</p>
                  <p className="text-emerald-700 mt-0.5 truncate">{appData.signedFileName} ({formatBase64Size(appData.signedFile)})</p>
                  <p className="text-emerald-600 text-[11px] mt-1">Đính kèm bổ sung: {(appData.additionalDocs || []).length} tệp</p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Lưu ý: Bạn chưa tải lên ảnh chụp/tệp đơn có chữ ký</p>
                    <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                      Bạn vẫn có thể nộp đơn trực tuyến ngay bây giờ. Tuy nhiên, bạn cần in đơn ra giấy A4, ký tên và nộp trực tiếp tại phòng Thư viện trường sau.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSubmitModal(false);
                    fileInputRef.current?.click();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Chụp ảnh / Tải lên bản chữ ký trước
                </button>
              </div>
            )}

            <div className="p-3 bg-slate-100/70 rounded-xl border border-slate-200 text-[11px] text-slate-600 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Sau khi nộp, hồ sơ sẽ được khóa cố định để chuyển cho Ban Thư viện xét duyệt. Bạn sẽ không thể sửa đổi nội dung đơn nữa.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Kiểm tra lại
              </button>
              <button
                id="btn-confirm-final-submit"
                type="button"
                disabled={locking}
                onClick={doFinalSubmit}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-[0.99] text-white text-xs font-bold shadow-md inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {locking ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    {appData.signedFile ? 'Xác nhận nộp đơn ngay' : 'Xác nhận nộp (nộp bản giấy sau)'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Confirm Delete Signed File */}
      {showRemoveSignedModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Xóa tệp bản đơn đã ký?</h4>
                <p className="text-xs text-slate-500">Bạn có thể tải lên lại bản khác sau khi xóa.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Tệp <strong>{appData.signedFileName}</strong> sẽ bị gỡ khỏi hồ sơ của bạn.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRemoveSignedModal(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeRemoveSignedFile}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Xóa và tải lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Confirm Delete Extra Document */}
      {docToDelete && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Xóa tài liệu bổ sung?</h4>
                <p className="text-xs text-slate-500">Xác nhận xóa tài liệu đính kèm này</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              Bạn có chắc chắn muốn xóa tài liệu <strong>"{docToDelete.description}"</strong> ({docToDelete.name}) không?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={executeDeleteExtraDoc}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Canvas Viewer Modal for Image and PDF files (Zero iframes, cannot be blocked by Google) */}
      {previewItem && (
        <FileViewerModal
          fileData={previewItem.url}
          fileName={previewItem.fileName || previewItem.title}
          title={previewItem.title}
          onClose={() => setPreviewItem(null)}
        />
      )}
    </div>
  );
};
