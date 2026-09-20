export interface AdditionalDoc {
  id: string;
  name: string;
  fileData: string; // base64 representation
  description: string;
  uploadedAt: string;
}

export interface BookLoanApplication {
  id?: string;
  code: string; // Mã đơn eForm, e.g. SGK-2026-AB12
  fullName: string;
  className: string;
  email: string;
  homeroomTeacherClass: string; // "Giáo viên chủ nhiệm lớp: ..."
  schoolYear: string; // "Năm học: ..."
  bookGrade: string; // "để mượn Sách giáo khoa lớp: ..."
  bookQuantity: string; // "Số lượng: ... cuốn"
  bookItems: string[]; // 10 mục sách
  city: string; // TP. Hồ Chí Minh
  dateDay: string;
  dateMonth: string;
  dateYear: string;
  status: 'draft' | 'submitted' | 'has_signed_doc' | 'approved' | 'rejected';
  isLocked?: boolean; // Khóa đơn không cho sửa sau khi nộp đơn chính thức
  signedFile?: string; // base64 representation of uploaded scan/photo
  signedFileName?: string;
  signedUploadedAt?: string;
  additionalDocs?: AdditionalDoc[]; // Tối đa 5 tài liệu bổ sung kèm mô tả
  createdAt: string;
  updatedAt: string;
  adminNotes?: string;
}

// Sách lớp 9 chuẩn theo danh mục THPT Chuyên Trần Đại Nghĩa
export const GRADE_9_BOOK_OPTIONS = [
  'Ngữ văn (Tập 1 và Tập 2)',
  'Toán (Tập 1 và Tập 2)',
  'Tiếng Anh (Tập 1 và Tập 2)',
  'Khoa học tự nhiên (Tích hợp Vật lí, Hóa học, Sinh học)',
  'Lịch sử và Địa lí (Tích hợp Lịch sử và Địa lí)',
  'Giáo dục công dân',
  'Tin học',
  'Công nghệ (Nông nghiệp)',
  'Công nghệ (Công nghiệp)',
  'Công nghệ (Định hướng nghề nghiệp)',
  'Công nghệ (Lắp đặt mạng điện)',
  'Âm nhạc',
  'Mĩ thuật',
  'Hoạt động trải nghiệm, hướng nghiệp',
  'Giáo dục thể chất',
];

export const DEFAULT_BOOKS = [
  'Ngữ văn (Tập 1 và Tập 2)',
  'Toán (Tập 1 và Tập 2)',
  'Tiếng Anh (Tập 1 và Tập 2)',
  'Khoa học tự nhiên (Tích hợp Vật lí, Hóa học, Sinh học)',
  'Lịch sử và Địa lí (Tích hợp Lịch sử và Địa lí)',
  'Giáo dục công dân',
  'Tin học',
  'Công nghệ (Định hướng nghề nghiệp)',
  'Âm nhạc & Mĩ thuật',
  'Hoạt động trải nghiệm, hướng nghiệp',
];

