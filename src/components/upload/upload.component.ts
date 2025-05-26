import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface UploadedFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  preview?: string;
  errorMessage?: string;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class FileUploadComponent {
  @Input() maxFiles: number = 5;
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB
  @Input() acceptedTypes: string[] = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.png', '.gif'];
  @Input() multiple: boolean = true;
  @Input() allowedMimeTypes: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];
  @Input() apiUrl: string = 'https://server-type-practicom.onrender.com';

  @Output() filesSelected = new EventEmitter<UploadedFile[]>();
  @Output() fileRemoved = new EventEmitter<string>();
  @Output() uploadProgress = new EventEmitter<{fileId: string, progress: number}>();
  @Output() uploadComplete = new EventEmitter<UploadedFile[]>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  uploadedFiles: UploadedFile[] = [];
  isDragging = false;
  isUploading = false;
  errorMessages: string[] = [];

  constructor(private http: HttpClient) {}

  // Drag and Drop Events
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  // File Input Change
  onFileInputChange(event: any): void {
    const files = event.target.files;
    if (files) {
      this.handleFiles(Array.from(files));
    }
  }

  // Handle selected files
  handleFiles(files: File[]): void {
    this.clearErrors();

    if (!this.multiple && files.length > 1) {
      this.showError('ניתן לבחור קובץ אחד בלבד');
      return;
    }

    if (this.uploadedFiles.length + files.length > this.maxFiles) {
      this.showError(`ניתן להעלות עד ${this.maxFiles} קבצים`);
      return;
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!this.validateFile(file)) {
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      this.processFiles(validFiles);
    }
  }

  // Validate file
  validateFile(file: File): boolean {
    // Check file size
    if (file.size > this.maxFileSize) {
      this.showError(`הקובץ ${file.name} גדול מדי. גודל מקסימלי: ${this.formatFileSize(this.maxFileSize)}`);
      return false;
    }

    // Check file type
    if (this.allowedMimeTypes.length > 0 && !this.allowedMimeTypes.includes(file.type)) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!this.acceptedTypes.includes(extension)) {
        this.showError(`סוג קובץ ${file.name} אינו נתמך`);
        return false;
      }
    }

    return true;
  }

  // Process valid files
  processFiles(files: File[]): void {
    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      id: this.generateId(),
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending'
    }));

    // Generate preview for images
    newFiles.forEach(uploadedFile => {
      if (uploadedFile.file.type.startsWith('image/')) {
        this.generatePreview(uploadedFile);
      }
    });

    this.uploadedFiles = [...this.uploadedFiles, ...newFiles];
    this.filesSelected.emit(this.uploadedFiles);
  }

  // Generate image preview
  generatePreview(uploadedFile: UploadedFile): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFile.preview = e.target?.result as string;
    };
    reader.readAsDataURL(uploadedFile.file);
  }

  // Remove file
  removeFile(fileId: string): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== fileId);
    this.fileRemoved.emit(fileId);
  }

  // Clear all files
  clearAllFiles(): void {
    this.uploadedFiles = [];
    this.clearErrors();
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Upload all pending files
  async uploadAllFiles(): Promise<void> {
    const pendingFiles = this.uploadedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    this.isUploading = true;
    this.clearErrors();

    try {
      for (const file of pendingFiles) {
        await this.uploadSingleFile(file);
      }
      this.uploadComplete.emit(this.uploadedFiles);
    } catch (error) {
      this.showError('שגיאה בהעלאת הקבצים');
    } finally {
      this.isUploading = false;
    }
  }

  // Upload single file (with real HTTP request)
  private async uploadSingleFile(uploadedFile: UploadedFile): Promise<void> {
    uploadedFile.status = 'uploading';
    uploadedFile.progress = 0;

    const token = localStorage.getItem('token');
    if (!token) {
      uploadedFile.status = 'error';
      uploadedFile.errorMessage = 'אין אישור גישה';
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
    formData.append('file', uploadedFile.file);
    formData.append('deadline', new Date().toISOString());

    try {
      // Simulate progress for demo - replace with real progress tracking
      const progressInterval = setInterval(() => {
        if (uploadedFile.progress < 90) {
          uploadedFile.progress += Math.random() * 10;
          this.uploadProgress.emit({ 
            fileId: uploadedFile.id, 
            progress: uploadedFile.progress 
          });
        }
      }, 200);

      await this.http.post(`${this.apiUrl}/upload-client`, formData, { headers }).toPromise();
      
      clearInterval(progressInterval);
      uploadedFile.progress = 100;
      uploadedFile.status = 'completed';
      this.uploadProgress.emit({ 
        fileId: uploadedFile.id, 
        progress: 100 
      });

    } catch (error: any) {
      uploadedFile.status = 'error';
      uploadedFile.errorMessage = error.message || 'שגיאה בהעלאת הקובץ';
    }
  }

  // Open file selector
  openFileSelector(): void {
    this.fileInput.nativeElement.click();
  }

  // Utility functions
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📁';
  }

  getStatusText(status: string): string {
    const statusTexts: { [key: string]: string } = {
      'pending': 'ממתין',
      'uploading': 'מעלה',
      'completed': 'הועלה',
      'error': 'שגיאה'
    };
    return statusTexts[status] || status;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private showError(message: string): void {
    this.errorMessages.push(message);
    // Auto-remove error after 5 seconds
    setTimeout(() => {
      this.errorMessages = this.errorMessages.filter(err => err !== message);
    }, 5000);
  }

  private clearErrors(): void {
    this.errorMessages = [];
  }

  // Track function for ngFor
  trackByFileId(index: number, file: UploadedFile): string {
    return file.id;
  }

  // Getters for template
  get completedFiles(): UploadedFile[] {
    return this.uploadedFiles.filter(f => f.status === 'completed');
  }

  get totalSize(): number {
    return this.uploadedFiles.reduce((total, file) => total + file.size, 0);
  }

  get canUpload(): boolean {
    return this.uploadedFiles.some(f => f.status === 'pending') && !this.isUploading;
  }

  hasPendingFiles(): boolean {
    return this.uploadedFiles.some(f => f.status === 'pending');
  }
}