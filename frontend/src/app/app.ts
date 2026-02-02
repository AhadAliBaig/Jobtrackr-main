import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { DOCUMENT, CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, RouterLinkActive, Router, NavigationEnd, Event } from '@angular/router';
import { ApiService, User } from './api.service'; // Import User Interface
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
})
export class App implements OnInit {
  isSidebarCollapsed = false;
  isDarkMode = true;  // Default to dark mode
  isLoginPage = false;

  // NEW: Dynamic User Data
  currentUser: User | null = null;

  constructor(
    private apiService: ApiService,
    @Inject(DOCUMENT) private document: Document,
    private renderer: Renderer2,
    private router: Router
  ) {
    // Route Listener
    this.router.events.pipe(
      filter((event: Event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.isLoginPage = event.urlAfterRedirects.includes('/login');
    });
  }

  ngOnInit(): void {
    this.apiService.checkHealth().subscribe();

    // 1. Load Theme - Default to dark mode if no preference saved
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isDarkMode = false;
      this.renderer.removeClass(this.document.body, 'dark-theme');
    } else {
      // Default to dark mode (either 'dark' saved or no preference)
      this.isDarkMode = true;
      this.renderer.addClass(this.document.body, 'dark-theme');
      if (!savedTheme) {
        localStorage.setItem('theme', 'dark');  // Save default preference
      }
    }

    // 2. NEW: Subscribe to Current User
    this.apiService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  toggleSidebar() {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      this.renderer.addClass(this.document.body, 'dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      this.renderer.removeClass(this.document.body, 'dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }

  logout() {
    this.apiService.logout(); // Call service logout
    this.router.navigate(['/login']);
  }
}