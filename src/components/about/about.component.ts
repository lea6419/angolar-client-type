import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initFaqToggle();
    }
  }

  initFaqToggle(): void {
    setTimeout(() => {
      const faqItems = document.querySelectorAll('.faq-question');
      faqItems.forEach(item => {
        item.addEventListener('click', () => {
          const parent = item.parentElement;
          if (parent) {
            parent.classList.toggle('active');
          }
        });
      });
    }, 100);
  }

  submitContactForm(event: Event): void {
    event.preventDefault();
    alert('ההודעה נשלחה בהצלחה! נחזור אליך בהקדם.');
  }
}

