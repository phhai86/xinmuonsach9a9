import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { BookLoanApplication, AdditionalDoc } from '../types';

const COLLECTION_NAME = 'loan_applications';
const MAX_FIRESTORE_DOC_BYTES = 900 * 1024; // 900 KB safe ceiling (Firestore hard limit is 1,048,576 bytes)

// Estimate document byte size
export function estimateDocSizeBytes(data: any): number {
  try {
    return new Blob([JSON.stringify(data)]).size;
  } catch {
    return JSON.stringify(data).length;
  }
}

// Generate unique recognizable application code (eForm code)
export function generateApplicationCode(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TDN-${year}-${randomPart}`;
}

// Save or create application
export async function saveApplication(data: BookLoanApplication): Promise<string> {
  const now = new Date().toISOString();
  const id = data.id || data.code;

  const docData: BookLoanApplication = {
    ...data,
    updatedAt: now,
    createdAt: data.createdAt || now,
  };

  const estimatedSize = estimateDocSizeBytes(docData);
  if (estimatedSize > MAX_FIRESTORE_DOC_BYTES) {
    throw new Error(
      `Dung lượng dữ liệu hồ sơ (${Math.round(estimatedSize / 1024)} KB) vượt quá giới hạn an toàn (${Math.round(MAX_FIRESTORE_DOC_BYTES / 1024)} KB). ` +
      `Vui lòng tối ưu hóa hoặc xóa bớt tài liệu đính kèm để tiếp tục.`
    );
  }

  const docRef = doc(db, COLLECTION_NAME, id);
  await setDoc(docRef, docData, { merge: true });
  return id;
}

// Find application by eForm code
export async function getApplicationByCode(code: string): Promise<BookLoanApplication | null> {
  const cleanCode = code.trim().toUpperCase();
  
  // Try direct doc id lookup first
  const docRef = doc(db, COLLECTION_NAME, cleanCode);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { ...snap.data(), id: snap.id } as BookLoanApplication;
  }

  // Query by code field
  const q = query(collection(db, COLLECTION_NAME), where('code', '==', cleanCode));
  const querySnap = await getDocs(q);
  if (!querySnap.empty) {
    const d = querySnap.docs[0];
    return { ...d.data(), id: d.id } as BookLoanApplication;
  }

  return null;
}

// Update signed file for application
export async function updateSignedFile(
  code: string, 
  fileBase64: string | null, 
  fileName: string | null
): Promise<void> {
  const app = await getApplicationByCode(code);
  if (!app) {
    throw new Error('Không tìm thấy đơn với mã: ' + code);
  }

  const docId = app.id || app.code;
  const docRef = doc(db, COLLECTION_NAME, docId);
  
  if (fileBase64) {
    if (fileBase64.length > 500 * 1024) {
      throw new Error(
        `Tệp ảnh/PDF có dung lượng quá lớn (${Math.round(fileBase64.length / 1024)} KB sau mã hóa). ` +
        `Dung lượng tối đa cho phép là 350 KB để đảm bảo lưu trữ an toàn trên cơ sở dữ liệu.`
      );
    }

    await updateDoc(docRef, {
      signedFile: fileBase64,
      signedFileName: fileName,
      signedUploadedAt: new Date().toISOString(),
      status: 'has_signed_doc',
      updatedAt: new Date().toISOString(),
    });
  } else {
    // Removal
    await updateDoc(docRef, {
      signedFile: null,
      signedFileName: null,
      signedUploadedAt: null,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    });
  }
}

// Update additional documents list
export async function updateAdditionalDocs(
  code: string,
  additionalDocs: AdditionalDoc[]
): Promise<void> {
  const app = await getApplicationByCode(code);
  if (!app) {
    throw new Error('Không tìm thấy đơn với mã: ' + code);
  }

  // Check total size of additional docs
  const totalExtraBytes = additionalDocs.reduce((sum, d) => sum + (d.fileData?.length || 0), 0);
  if (totalExtraBytes > 500 * 1024) {
    throw new Error(
      `Tổng dung lượng các tài liệu bổ sung (${Math.round(totalExtraBytes / 1024)} KB) vượt mức cho phép (500 KB). ` +
      `Vui lòng nén ảnh hoặc giảm bớt số lượng tài liệu.`
    );
  }

  const docId = app.id || app.code;
  const docRef = doc(db, COLLECTION_NAME, docId);
  await updateDoc(docRef, {
    additionalDocs,
    updatedAt: new Date().toISOString(),
  });
}

// Lock application upon formal submission
export async function lockApplication(code: string): Promise<void> {
  const app = await getApplicationByCode(code);
  if (!app) {
    throw new Error('Không tìm thấy đơn với mã: ' + code);
  }

  const docId = app.id || app.code;
  const docRef = doc(db, COLLECTION_NAME, docId);
  await updateDoc(docRef, {
    isLocked: true,
    status: 'submitted',
    updatedAt: new Date().toISOString(),
  });
}

// Admin: update application status
export async function updateApplicationStatus(
  code: string,
  status: 'draft' | 'submitted' | 'has_signed_doc' | 'approved' | 'rejected',
  adminNotes?: string
): Promise<void> {
  const app = await getApplicationByCode(code);
  if (!app) {
    throw new Error('Không tìm thấy đơn với mã: ' + code);
  }

  const docId = app.id || app.code;
  const docRef = doc(db, COLLECTION_NAME, docId);
  await updateDoc(docRef, {
    status,
    adminNotes: adminNotes ?? app.adminNotes ?? '',
    updatedAt: new Date().toISOString(),
  });
}

// Admin: fetch all applications
export async function getAllApplications(): Promise<BookLoanApplication[]> {
  const colRef = collection(db, COLLECTION_NAME);
  const querySnap = await getDocs(colRef);
  const results: BookLoanApplication[] = [];
  querySnap.forEach((docSnap) => {
    results.push({ ...docSnap.data(), id: docSnap.id } as BookLoanApplication);
  });

  // Sort latest updated first
  return results.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}
