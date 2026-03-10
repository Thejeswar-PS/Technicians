import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
    private authService: AuthService,
    private router: Router
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

  /**
   * Map legacy ASPX pages to Angular routes
   */
  private mapAspxToAngularRoute(aspxUrl: string): string | null {
    const aspxMap: { [key: string]: string } = {
      'TechDashboard.aspx': '/dashboard-view/',
      'techdashboard.aspx': '/dashboard-view/'
    };

    const trimmed = aspxUrl.trim().toLowerCase();
    for (const [aspx, route] of Object.entries(aspxMap)) {
      if (trimmed === aspx.toLowerCase() || trimmed.endsWith('/' + aspx.toLowerCase())) {
        return route;
      }
    }
    return null;
  }

  isRouterLink(url?: string | null): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    
    // Check if it's already an Angular route
    if (trimmed.startsWith('/')) return true;
    
    // Check if it's an ASPX page that can be mapped to Angular route
    if (trimmed.toLowerCase().endsWith('.aspx') || trimmed.toLowerCase().includes('.aspx?')) {
      return this.mapAspxToAngularRoute(trimmed) !== null;
    }
    
    return false;
  }

  isExternalLink(url?: string | null): boolean {
    if (!url) return false;
    const trimmed = url.trim().toLowerCase();
    
    // External URLs (http/https)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return true;
    }
    
    // ASPX pages that don't have Angular route mappings
    if (trimmed.endsWith('.aspx') || trimmed.includes('.aspx?')) {
      return this.mapAspxToAngularRoute(trimmed) === null;
    }
    
    return false;
  }

  getSafeUrl(url?: string | null): string {
    if (!url) return '#';
    const trimmed = url.trim();
    
    // If it's an ASPX URL that maps to Angular route, return the mapped route
    if (trimmed.toLowerCase().endsWith('.aspx') || trimmed.toLowerCase().includes('.aspx?')) {
      const mappedRoute = this.mapAspxToAngularRoute(trimmed);
      if (mappedRoute) {
        return mappedRoute;
      }
    }
    
    return trimmed;
  }

  isActiveRoute(url?: string | null): boolean {
    if (!url) return false;
    
    // Get the actual route (mapped if it's an ASPX)
    const actualRoute = this.getSafeUrl(url);
    
    if (!this.isRouterLink(url)) return false;
    return this.router.isActive(actualRoute, false);
  }

  getIconClass(name: string): string {
    const iconMap: { [key: string]: string } = {
      'reports': 'bi-file-earmark-text',
      'graphs': 'bi-bar-chart-line',
      'tools': 'bi-tools',
      'admin': 'bi-gear-wide-connected',
      'settings': 'bi-gear',
      'users': 'bi-people',
      'dashboard': 'bi-speedometer2',
      'calendar': 'bi-calendar-event',
      'tasks': 'bi-list-task',
      'miscellaneous': 'bi-three-dots',
      'default': 'bi-layers'
    };

    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return iconMap['default'];
  }
}
