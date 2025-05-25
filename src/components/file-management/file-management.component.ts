import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface MyFile {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  status: number;
  clientName: string;
}

// Enum מעודכן לפי הדרישות
enum FileStatus {
  UPLOADED_BY_USER = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  RETURNED_TO_USER = 3,
  SOFT_DELETED = 4
}

@Component({
  selector: 'app-file-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css'],
})
export class FileManagementComponent implements OnInit {
  API_URL = 'https://server-type-practicom.onrender.com';
  files: MyFile[] = [];
  filteredFiles: MyFile[] = [];
  loading = false;
  name = null;
  viewMode: 'table' | 'cards' = 'table';
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  selectedFileForDetails: MyFile | null = null;
  // חיפוש
  searchName = '';
  searchClient = '';
  searchDate = '';
  searchSize = '';
  searchStatus: string = '';
  // Pagination variables
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  paginatedFiles: MyFile[] = [];
  
  // Page size options
  pageSizeOptions = [5, 10, 20, 50];
  // העלאה
  selectedFile: File | null = null;

  // Enum לגישה מהטמפלט
  FileStatus = FileStatus;

  statusLabels: Record<number, string> = {
    [FileStatus.UPLOADED_BY_USER]: 'הועלה על ידי המשתמש',
    [FileStatus.IN_PROGRESS]: 'בעיבוד',
    [FileStatus.COMPLETED]: 'הושלם - מוכן להורדה',
    [FileStatus.RETURNED_TO_USER]: 'הוחזר למשתמש',
    [FileStatus.SOFT_DELETED]: 'נמחק זמנית',
  };
  
  statusColors: Record<number, string> = {
    [FileStatus.UPLOADED_BY_USER]: '#6366f1', // אינדיגו
    [FileStatus.IN_PROGRESS]: '#f59e0b',       // צהוב כתום
    [FileStatus.COMPLETED]: '#10b981',         // ירוק
    [FileStatus.RETURNED_TO_USER]: '#8b5cf6',  // סגול
    [FileStatus.SOFT_DELETED]: '#ef4444',      // אדום
  };

  // הודעות מפורטות לכל סטטוס
  statusMessages: Record<number, string> = {
    [FileStatus.UPLOADED_BY_USER]: 'הקובץ הועלה בהצלחה ונמצא בתור לעיבוד',
    [FileStatus.IN_PROGRESS]: 'הקובץ נמצא כעת בתהליך עיבוד ועריכה',
    [FileStatus.COMPLETED]: 'הקובץ עובד ומוכן להורדה וצפייה!',
    [FileStatus.RETURNED_TO_USER]: 'הקובץ הוחזר בהצלחה למשתמש',
    [FileStatus.SOFT_DELETED]: 'קובץ זה נמחק זמנית ונמצא בסל המחזור',
  };

  // אייקונים לכל סטטוס
  statusIcons: Record<number, string> = {
    [FileStatus.UPLOADED_BY_USER]: '📤',
    [FileStatus.IN_PROGRESS]: '⚙️',
    [FileStatus.COMPLETED]: '✅',
    [FileStatus.RETURNED_TO_USER]: '↩️',
    [FileStatus.SOFT_DELETED]: '🗑️',
  };
  
  constructor(private http: HttpClient) {
    
      this.itemsPerPage = 2; // או ערך ברירת מחדל אחר
    
  }

  ngOnInit(): void {
    this.fetchFiles();
  }
  fetchFiles(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.name = user.username;
    if (!token) return;
     
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<MyFile[]>(`${this.API_URL}/user-files/${user?.id}`, { headers }).subscribe({
      next: (data) => {
        console.log(data);
        this.files = data;
        console.log(this.files);
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('שגיאה:', err);
        this.loading = false;
        this.showNotification('❌ שגיאה בטעינת הקבצים', 'error');
      },
    });
  }

  applyFilters(): void {
    this.filteredFiles = this.files.filter((file) => {
      const matchesName = !this.searchName || 
        file.name?.toLowerCase().includes(this.searchName.toLowerCase());
      
      const matchesClient = !this.searchClient || 
        file.clientName?.toLowerCase().includes(this.searchClient.toLowerCase());
      
      const matchesDate = !this.searchDate || 
        file.createdAt.includes(this.searchDate);
      
      const matchesSize = !this.searchSize || 
        file.size <= parseInt(this.searchSize) * 1024 * 1024; // המרה ל-MB
      
      const matchesStatus = !this.searchStatus || 
        file.status.toString() === this.searchStatus;
  
      // שימוש ב-AND במקום OR לסינון מדויק יותר
      return matchesName && matchesClient && matchesDate && matchesSize && matchesStatus;
    });

    // עדכון pagination אחרי הסינון
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalItems = this.filteredFiles.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    
    // וידוא שהעמוד הנוכחי תקין
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // חישוב הפריטים לעמוד הנוכחי
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedFiles = this.filteredFiles.slice(startIndex, endIndex);
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  onItemsPerPageChange(event: any): void {
    this.itemsPerPage = +event.target.value?.toString();
    this.currentPage = 1; // חזרה לעמוד הראשון
    this.updatePagination();
  }

  // Helper methods for pagination display
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 7;
    
    if (this.totalPages <= maxVisiblePages) {
      // אם יש פחות מ-7 דפים, הצג את כולם
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // אם יש יותר מ-7 דפים, הצג חכם
      if (this.currentPage <= 4) {
        // התחלת הרשימה
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 3) {
        // סוף הרשימה
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        // אמצע הרשימה
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-2); // ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }

  getCurrentPageInfo(): string {
    if (this.totalItems === 0) {
      return 'אין פריטים להצגה';
    }
    
    const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    
    return `מציג ${startItem}-${endItem} מתוך ${this.totalItems} פריטים`;
  }

  isFirstPage(): boolean {
    return this.currentPage === 1;
  }

  isLastPage(): boolean {
    return this.currentPage === this.totalPages || this.totalPages === 0;
  }
  // fetchFiles(): void {
  //   this.loading = true;
  //   const token = localStorage.getItem('token');
  //   const user = JSON.parse(localStorage.getItem('user') || '{}');
  //   this.name = user.username;
  //   if (!token) return;
     
  //   const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
  //   this.http.get<MyFile[]>(`${this.API_URL}/user-files/${user?.id}`, { headers }).subscribe({
  //     next: (data) => {
  //       console.log(data);
  //       this.files = data;
  //       console.log(this.files);
  //       this.applyFilters();
  //       this.loading = false;
  //     },
  //     error: (err) => {
  //       console.error('שגיאה:', err);
  //       this.loading = false;
  //       this.showNotification('❌ שגיאה בטעינת הקבצים', 'error');
  //     },
  //   });
  // }

  // applyFilters(): void {
  //   this.filteredFiles = this.files.filter((file) => {
  //     const matchesName = file.fileName?.toLowerCase().includes(this.searchName.toLowerCase());
  //     const matchesClient = file.clientName?.toLowerCase().includes(this.searchClient.toLowerCase());
  //     const matchesDate = this.searchDate ? file.date.includes(this.searchDate) : true;
  //     const matchesSize = this.searchSize ? file.size <= parseInt(this.searchSize) : true;
  //     const matchesStatus = this.searchStatus ? file.status.toString() === this.searchStatus : true;

  //     return matchesName || matchesClient || matchesDate || matchesSize || matchesStatus;
  //   });
  // }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
    if (this.selectedFile) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (this.selectedFile.size > maxSize) {
        this.showNotification('❌ הקובץ גדול מדי. מקסימום 10MB', 'error');
        this.selectedFile = null;
        return;
      }
      
      this.showNotification(`✅ נבחר קובץ: ${this.selectedFile.name}`, 'success');
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.showNotification('❌ אנא בחר קובץ להעלאה', 'error');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.showNotification('❌ נדרשת התחברות מחדש', 'error');
      return;
    }

    this.loading = true;
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('deadline', new Date().toISOString());

    this.http.post(`${this.API_URL}/upload-client`, formData, { headers }).subscribe({
      next: () => {
        this.showNotification('✅ קובץ הועלה בהצלחה', 'success');
        this.selectedFile = null;
        this.fetchFiles();
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => {
        console.error('Upload error:', err);
        this.showNotification('❌ העלאה נכשלה', 'error');
        this.loading = false;
      },
    });
  }

  // הורדת הקובץ המקורי
  downloadOriginalFile(id: string, fileName: string): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${this.API_URL}/download/${id}`, { headers }).subscribe({
      next: (res) => {
        this.performDownload(res.url, `original_${fileName}`, 'הקובץ המקורי הורד בהצלחה');
      },
      error: () => {
        this.showNotification('❌ שגיאה בהורדת הקובץ המקורי', 'error');
      },
    });
  }

  // הורדת הקובץ המעובד
  downloadProcessedFile(id: string, fileName: string): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${this.API_URL}/download-type/${id}`, { headers }).subscribe({
      next: (res) => {
        this.performDownload(res.url, `processed_${fileName}`, 'הקובץ המעובד הורד בהצלחה');
      },
      error: () => {
        this.showNotification('❌ שגיאה בהורדת הקובץ המעובד', 'error');
      },
    });
  }

  // צפייה בקובץ
  viewFile(id: string, type: 'original' | 'processed' = 'processed'): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${this.API_URL}/download/${type}/${id}`, { headers }).subscribe({
      next: (res) => {
        window.open(res.viewUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
        this.showNotification('📄 פותח קובץ לצפייה', 'info');
      },
      error: () => {
        this.showNotification('❌ שגיאה בפתיחת הקובץ לצפייה', 'error');
      },
    });
  }

  // מחיקת קובץ (מחיקה רכה)
  deleteFile(id: string, fileName: string): void {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הקובץ "${fileName}"?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete(`${this.API_URL}/files/${id}`, { headers }).subscribe({
      next: () => {
        this.showNotification('🗑️ קובץ נמחק בהצלחה', 'success');
        this.fetchFiles(); // רענון הרשימה
      },
      error: () => {
        this.showNotification('❌ מחיקה נכשלה', 'error');
      },
    });
  }

  // שחזור קובץ ממחיקה רכה
  restoreFile(id: string, fileName: string): void {
    if (!confirm(`האם ברצונך לשחזר את הקובץ "${fileName}"?`)) {
      return;
    }

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.patch(`${this.API_URL}/files/${id}/restore`, {}, { headers }).subscribe({
      next: () => {
        this.showNotification('♻️ קובץ שוחזר בהצלחה', 'success');
        this.fetchFiles();
      },
      error: () => {
        this.showNotification('❌ שחזור נכשל', 'error');
      },
    });
  }

  // בדיקות זמינות פעולות לפי סטטוס
  canDownloadOriginal(status: number): boolean {
    return status !== FileStatus.SOFT_DELETED;
  }

  canDownloadProcessed(status: number): boolean {
    return [FileStatus.COMPLETED, FileStatus.RETURNED_TO_USER].includes(status);
  }

  canViewOriginal(status: number): boolean {
    return status !== FileStatus.SOFT_DELETED;
  }

  canViewProcessed(status: number): boolean {
    return [FileStatus.COMPLETED, FileStatus.RETURNED_TO_USER].includes(status);
  }

  canDelete(status: number): boolean {
    return status !== FileStatus.SOFT_DELETED;
  }

  canRestore(status: number): boolean {
    return status === FileStatus.SOFT_DELETED;
  }

  // פונקציה מתקדמת להורדה
  private performDownload(url: string, filename: string, successMessage: string): void {
    fetch(url)
      .then((r) => r.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
        this.showNotification(successMessage, 'success');
      })
      .catch(() => {
        this.showNotification('❌ שגיאה בהורדת הקובץ', 'error');
      });
  }

  // פונקציות עזר לעיצוב
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // פונקציה מתקדמת להצגת התראות
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="
          width: 32px; 
          height: 32px; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
          color: white;
          font-size: 16px;
        ">
          ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ⓘ'}
        </div>
        <span style="font-weight: 500;">${message}</span>
      </div>
    `;
    
    notification.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: white;
      color: #1f2937;
      border: none;
      border-radius: 12px;
      padding: 16px 20px;
      z-index: 10000;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      min-width: 300px;
      animation: slideInFromRight 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOutToRight 0.3s ease-out forwards';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }
  resetFilters(): void {
    this.searchName = '';
    this.searchClient = '';
    this.searchDate = '';
    this.searchSize = '';
    this.searchStatus = '';
    this.currentPage = 1;
    this.applyFilters();
  }
  
  // החלפת מצב תצוגה
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'table' ? 'cards' : 'table';
  }
  
  // מיון נתונים
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
  
    this.filteredFiles.sort((a: any, b: any) => {
      let aValue = a[field];
      let bValue = b[field];
  
      // טיפול בתאריכים
      if (field === 'date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
  
      // טיפול במספרים
      if (field === 'size') {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
  
      // טיפול בטקסט
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
  
      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }
  
      return this.sortDirection === 'desc' ? comparison * -1 : comparison;
    });
  
    this.updatePagination();
  }
  
  // קבלת אייקון מיון
  getSortIcon(field: string): string {
    if (this.sortField !== field) {
      return '↕️';
    }
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }
  
  // פתיחת פרטי קובץ במודל
  openFileDetails(file: MyFile): void {
    this.selectedFileForDetails = file;
  }
  
  // סגירת מודל פרטי קובץ
  closeFileDetails(): void {
    this.selectedFileForDetails = null;
  }
}