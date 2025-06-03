import { Component, ElementRef } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    // הפעלת אנימציות כותרת ראשית מיד בטעינה
    setTimeout(() => {
      const headerElement = this.elementRef.nativeElement.querySelector('.home-container > header');
      if (headerElement) {
        headerElement.classList.add('visible');
      }
    }, 100);

    // הפעלת אנימציות גלילה
    this.initScrollAnimations();
  }

  private initScrollAnimations() {
    const features = this.elementRef.nativeElement.querySelectorAll('.feature');
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.1 });
       features.forEach((feature: Element) => {
      observer.observe(feature);
    });
    }
    

}
}
