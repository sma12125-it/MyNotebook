import React, { useState } from 'react';
import {
  FileText,
  Plus,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Calendar,
  Tag,
  Search,
  Download,
} from 'lucide-react';
import { DocumentItem, DocumentCategory } from '../../types';
import { StorageService } from '../../services/storage';
import { getTodayJalali, toFaDigits, formatJalaliReadable } from '../../utils/jalali';
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

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('lab');
  const [dateJalali, setDateJalali] = useState(getTodayJalali());
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  const categories = [
    { id: 'all', label: 'همه اسناد' },
    { id: 'lab', label: 'آزمایش‌ها' },
    { id: 'imaging', label: 'تصویربرداری و MRI' },
    { id: 'prescription', label: 'نسخه‌ها' },
    { id: 'car', label: 'خودرو و بیمه' },
    { id: 'home', label: 'خانه و ضمانت‌نامه' },
    { id: 'identity', label: 'هویتی و مدارک' },
    { id: 'contract', label: 'قراردادها' },
  ];

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  // Handle File Upload (Convert to Base64)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
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
      dateJalali: dateJalali.trim(),
      fileUrl: fileUrl || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=500&auto=format&fit=crop&q=60',
      fileType: fileUrl.startsWith('data:image') ? 'image/jpeg' : 'application/pdf',
      tags: tagsInput.split('،').map((s) => s.trim()).filter(Boolean),
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
    onRefreshData();
  };

  // Delete Document
  const handleDelete = (id: string) => {
    const all = StorageService.getDocuments().filter((d) => d.id !== id);
    StorageService.saveDocuments(all);
    onRefreshData();
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
            نگهداری امن عکس و فایل آزمایش‌ها، نسخه‌ها، بیمه‌نامه‌ها و مدارک
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مدرک جدید</span>
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
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
          description="تصویر آزمایش‌ها، دفترچه بیمه، مدارک خودرو یا قراردادهای خود را بارگذاری کنید."
          actionText="افزودن مدرک"
          onAction={() => setIsAddModalOpen(true)}
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
                  className="w-full h-36 rounded-2xl bg-muted overflow-hidden mb-3 cursor-pointer relative group-hover:opacity-95 transition-opacity"
                >
                  <img
                    src={doc.fileUrl}
                    alt={doc.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <Eye className="w-6 h-6 drop-shadow-md" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-foreground line-clamp-1">
                    {doc.title}
                  </h4>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-rose-600 flex-shrink-0"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatJalaliReadable(doc.dateJalali)}</span>
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

              {/* View Button */}
              <button
                onClick={() => setPreviewDoc(doc)}
                className="mt-3 pt-2.5 border-t border-border w-full text-center text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>مشاهده تصویر کامل</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-card rounded-3xl p-5 sm:p-6 shadow-2xl border border-border animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-foreground text-base">
                افزودن مدرک / فایل جدید
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-3.5 mt-4 text-xs">
              {/* File Upload Area */}
              <div>
                <label className="block text-muted-foreground mb-1.5">انتخاب یا تصویر مدرک *</label>
                <label className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-muted/30">
                  <UploadCloud className="w-8 h-8 text-primary mb-1.5" />
                  <span className="font-bold text-foreground">
                    {fileName || 'برای انتخاب عکس یا فایل کلیک کنید'}
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    پشتیبانی از عکس، PDF و اسکن مدارک
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">عنوان مدرک *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: بیمه‌نامه شخص ثالث، جواب آزمایش چکاپ"
                  required
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">دسته‌بندی</label>
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
                  <label className="block text-muted-foreground mb-1">تاریخ مدرک (شمسی)</label>
                  <input
                    type="text"
                    value={dateJalali}
                    onChange={(e) => setDateJalali(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-center"
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
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground text-xs font-semibold hover:bg-muted"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-[#687a5e] text-white font-bold text-xs shadow-md shadow-primary/25"
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
          <div className="w-full max-w-3xl bg-card rounded-3xl p-5 shadow-2xl border border-border max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {previewDoc.title}
                </h3>
                <p className="text-xs text-muted-foreground">{formatJalaliReadable(previewDoc.dateJalali)}</p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded-full text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto py-4 flex items-center justify-center">
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.title}
                referrerPolicy="no-referrer"
                className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-md"
              />
            </div>

            {previewDoc.notes && (
              <div className="p-3 rounded-xl bg-muted/40 text-xs text-foreground">
                {previewDoc.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
