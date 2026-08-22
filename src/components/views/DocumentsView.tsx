import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  UploadCloud,
  Camera,
  FolderOpen,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Calendar,
  Clock,
  Tag,
  Search,
  Download,
} from 'lucide-react';
import { DocumentItem, DocumentCategory } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, getCurrentTime, toFaDigits, formatJalaliReadable, formatDateTimeFa } from '../../utils/jalali';
import { EmptyState } from '../common/EmptyState';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onRefreshData: () => void;
  onOpenQuickCapture: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onRefreshData,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('lab');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());
  const [timeStr, setTimeStr] = useState(getCurrentTime());
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');

  const categories = [
    { id: 'all', label: 'همه اسناد' },
    { id: 'lab', label: 'آزمایش‌ها' },
    { id: 'imaging', label: 'تصویربرداری و سونو' },
    { id: 'prescription', label: 'نسخه‌ها' },
    { id: 'car', label: 'خودرو و بیمه' },
    { id: 'home', label: 'خانه و ضمانت‌نامه' },
    { id: 'identity', label: 'هویتی و شناسنامه' },
    { id: 'contract', label: 'قراردادها و فاکتور' },
  ];

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Handle File Upload from Gallery/File Manager or Camera
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    // Format size
    const sizeInKb = (file.size / 1024).toFixed(0);
    setFileSize(`${toFaDigits(sizeInKb)} کیلوبایت`);

    if (!title) {
      setTitle(file.name.split('.')[0]);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save Document
  const handleSaveDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newDoc: DocumentItem = {
      id: 'doc-' + Math.random().toString(36).substring(2, 9),
      title: title.trim(),
      category,
      dateJalali: dateJalali.trim() || getTodayJalali(),
      time: timeStr.trim() || getCurrentTime(),
      timeJalali: timeStr.trim() || getCurrentTime(),
      fileName: fileName || title.trim(),
      fileSize: fileSize || '',
      fileUrl: fileUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60',
      fileType: fileUrl.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
      tags: tagsInput.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      notes: notes.trim(),
    };

    const all = StorageService.getDocuments();
    all.unshift(newDoc);
    StorageService.saveDocuments(all);

    setIsAddModalOpen(false);
    setTitle('');
    setTagsInput('');
    setNotes('');
    setFileUrl('');
    setFileName('');
    setFileSize('');
    setTimeStr(getCurrentTime());
    onRefreshData();
  };

  // Delete Document
  const handleDelete = (id: string) => {
    const all = StorageService.getDocuments().filter((d) => d.id !== id);
    StorageService.saveDocuments(all);
    onRefreshData();
  };

  // Download Document File to Mobile / Desktop
  const handleDownloadDocument = (doc: DocumentItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!doc.fileUrl) return;

    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = `${doc.title || 'document'}.${doc.fileType?.includes('image') ? 'jpg' : 'pdf'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground">
            گاوصندوق اسناد و مدارک
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            نگهداری، عکس‌برداری مستقیم، آپلود و دانلود فایل آزمایش‌ها، نسخه‌ها، بیمه‌نامه‌ها و مدارک
          </p>
        </div>

        <button
          onClick={() => {
            setTimeStr(getCurrentTime());
            setDateJalali(getTodayJalali());
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مدرک / عکس با دوربین</span>
        </button>
      </div>

      {/* Search & Categories Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان مدارک و برچسب‌ها..."
            className="w-full pl-4 pr-10 py-2.5 rounded-2xl border border-border bg-card text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="مدرکی یافت نشد"
          description="با دوربین گوشی عکس بگیرید یا فایل آزمایش‌ها، بیمه، مدارک خودرو یا قراردادهای خود را ذخیره کنید."
          actionText="افزودن مدرک"
          onAction={() => {
            setTimeStr(getCurrentTime());
            setDateJalali(getTodayJalali());
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between group hover:border-primary/50 transition-all"
            >
              <div>
                {/* Thumbnail / Image Preview */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="w-full h-40 rounded-2xl bg-muted overflow-hidden mb-3 cursor-pointer relative group-hover:opacity-95 transition-opacity"
                >
                  <img
                    src={doc.fileUrl}
                    alt={doc.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                    <span className="px-2.5 py-1 bg-black/60 rounded-xl text-xs font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> مشاهده
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">
                    {doc.title}
                  </h4>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => handleDownloadDocument(doc, e)}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      title="دانلود مدرک در گوشی/کامپیوتر"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {formatJalaliReadable(doc.dateJalali)}
                  </span>
                  {doc.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      ساعت {toFaDigits(doc.time)}
                    </span>
                  )}
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {doc.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-3.5 pt-2.5 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewDoc(doc)}
                  className="flex-1 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>مشاهده</span>
                </button>
                <button
                  onClick={(e) => handleDownloadDocument(doc, e)}
                  className="flex-1 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود فایل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-border animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                افزودن مدرک / فایل جدید
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3.5 mt-4 text-xs">
              {/* Dual Mobile File & Camera Options */}
              <div>
                <label className="block text-muted-foreground mb-1.5 font-bold">
                  انتخاب فایل یا عکس‌برداری مستقیم با دوربین گوشی *
                </label>

                <div className="grid grid-cols-2 gap-2.5 mb-2">
                  {/* Camera Button */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-3 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  >
                    <Camera className="w-6 h-6 text-primary mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-foreground text-xs">عکس با دوربین گوشی</span>
                    <span className="text-[10px] text-muted-foreground">گرفتن مستقیم عکس سند</span>
                  </button>

                  {/* Gallery / File Manager Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-muted/40 hover:bg-muted/70 flex flex-col items-center justify-center text-center transition-all cursor-pointer group"
                  >
                    <FolderOpen className="w-6 h-6 text-primary mb-1 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-foreground text-xs">گالری و فایل‌ها</span>
                    <span className="text-[10px] text-muted-foreground">انتخاب از حافظه گوشی</span>
                  </button>
                </div>

                {/* Hidden Real Inputs */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Status Card */}
                {fileUrl && (
                  <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-background flex-shrink-0 border border-border">
                        <img src={fileUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-foreground text-xs truncate">{fileName || 'تصویر مدرک آماده ذخیره'}</p>
                        {fileSize && <p className="text-[10px] text-muted-foreground">{fileSize}</p>}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                      انتخاب شد ✓
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-muted-foreground mb-1 font-bold">عنوان مدرک *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: بیمه‌نامه شخص ثالث، جواب آزمایش خون، فاکتور سرویس"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-muted-foreground mb-1 font-semibold">دسته‌بندی</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="lab">آزمایش‌ها</option>
                    <option value="imaging">سونوگرافی و MRI</option>
                    <option value="prescription">نسخه‌های پزشکی</option>
                    <option value="car">خودرو و بیمه</option>
                    <option value="home">خانه و ضمانت‌نامه</option>
                    <option value="identity">مدارک شناسایی</option>
                    <option value="contract">قرارداد و فاکتور</option>
                    <option value="general">عمومی</option>
                  </select>
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-semibold">تاریخ مدرک (شمسی)</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1 font-semibold">ساعت و دقیقه</label>
                  <input
                    type="text"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    placeholder="مثال: 14:35"
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">برچسب‌ها (با «،» جدا کنید)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="بیمه، پژو ۲۰۶، سلامت، ..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">توضیحات و نکات</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات مهم مربوط به مدرک..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25 cursor-pointer"
                >
                  ذخیره در گاوصندوق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Full Document Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl bg-card rounded-3xl p-5 shadow-2xl border border-border max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDateTimeFa(previewDoc.dateJalali, previewDoc.time)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocument(previewDoc)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#687a5e] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود در گوشی</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto py-4 flex items-center justify-center">
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.title}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-md"
              />
            </div>

            {previewDoc.notes && (
              <div className="p-3 rounded-2xl bg-muted/50 text-xs text-foreground mt-2">
                {previewDoc.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
