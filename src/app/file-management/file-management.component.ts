import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
interface MyFile {
  id: string;
  fileName: string;
  size: number;
  date: string;
  status: number;
  clientName: string;
}
@Component({
  selector: 'app-file-management',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './file-management.component.html',
  styleUrls: ['./file-management.component.css'],



  
})
export class FileManagementComponent implements OnInit {
  API_URL = 'https://server-type-practicom.onrender.com';
  files: MyFile[] = [];
  filteredFiles: MyFile[] = [];
  loading = false;
  name = null

  // חיפוש
  searchName = '';
  searchClient = '';
  searchDate = '';
  searchSize = '';
  searchStatus: string = '';

  // העלאה
  selectedFile: File | null = null;

  statusLabels: Record<number, string> = {
    1: 'הועלה על ידי לקוח',
    2: 'ממתין להקלדה',
    3: 'בהקלדה',
    4: 'הוקלד והועלה',
    5: 'הורד על ידי לקוח',
    6: 'גרסה מעודכנת',
    99: 'נמחק',
  };
  
  statusColors: Record<number, string> = {
    1: 'gray',
    2: 'orange',
    3: 'blue',
    4: 'green',
    5: 'purple',
    6: 'teal',
    99: 'red',
  };
  

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchFiles();
  }

  fetchFiles(): void {
    this.loading = true;
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '');
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
      },
    });
  }

  applyFilters(): void {
    this.filteredFiles = this.files.filter((file) => {
      const matchesName = file.fileName?.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesClient = file.clientName?.toLowerCase().includes(this.searchClient.toLowerCase());
      const matchesDate = this.searchDate ? file.date.includes(this.searchDate) : true;
      const matchesSize = this.searchSize ? file.size <= parseInt(this.searchSize) : true;
      const matchesStatus = this.searchStatus ? file.status.toString() === this.searchStatus : true;

      return matchesName || matchesClient || matchesDate || matchesSize || matchesStatus;
    });
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0] || null;
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('deadline', new Date().toISOString());

    this.http.post(`${this.API_URL}/upload-client`, formData, { headers }).subscribe({
      next: () => {
        alert('✅ קובץ הועלה בהצלחה');
        this.fetchFiles();
      },
      error: () => {
        alert('❌ העלאה נכשלה');
      },
    });
  }

  downloadFile(id: string): void {
    this.http.get<any>(`${this.API_URL}/download/${id}`).subscribe({
      next: (res) => {
        fetch(res.url)
          .then((r) => r.blob())
          .then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `file-${id}.docx`;
            a.click();
          });
      },
      error: () => {
        alert('❌ שגיאה בהורדה');
      },
    });
  }

  deleteFile(id: string): void {
    this.http.delete(`${this.API_URL}/${id}`).subscribe({
      next: () => {
        alert('🗑️ קובץ נמחק');
        this.files = this.files.filter(f => f.id !== id);
        this.applyFilters();
      },
      error: () => {
        alert('❌ מחיקה נכשלה');
      },
    });
  }
}
