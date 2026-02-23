import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { HorizontalNavigationService, NavigationItem } from 'src/app/core/services/horizontal-navigation.service';

@Component({
  selector: 'app-horizontal-navigation',
  templateUrl: './horizontal-navigation.component.html',
  styleUrls: ['./horizontal-navigation.component.scss']
})
export class HorizontalNavigationComponent implements OnInit {
  menuItems: NavigationItem[] = [];
  errorMessage = '';

  constructor(
    private navService: HorizontalNavigationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadMenu();
  }

  private loadMenu(): void {
    const userId = this.authService.currentUserValue?.windowsID || '';
    if (!userId) {
      this.errorMessage = '';
      this.menuItems = [];
      return;
    }

    this.navService.getMenuItems(userId).subscribe({
      next: (items) => {
        this.menuItems = items;
      },
      error: () => {
        this.errorMessage = 'Unable to load navigation menu.';
        this.menuItems = [];
      }
    });
  }

  isRouterLink(url?: string | null): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    if (trimmed.endsWith('.aspx') || trimmed.includes('.aspx?')) return false;
    return trimmed.startsWith('/');
  }

  isExternalLink(url?: string | null): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.endsWith('.aspx') || trimmed.includes('.aspx?');
  }

  getSafeUrl(url?: string | null): string {
    return url?.trim() || '#';
  }
}
