import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { HorizontalNavigationService, NavigationItem } from 'src/app/core/services/horizontal-navigation.service';
import { CommonService } from 'src/app/core/services/common.service';

@Component({
  selector: 'app-horizontal-navigation',
  templateUrl: './horizontal-navigation.component.html',
  styleUrls: ['./horizontal-navigation.component.scss']
})
export class HorizontalNavigationComponent implements OnInit {
  menuItems: NavigationItem[] = [];
  errorMessage = '';
  private isManagerContext = false;

  constructor(
    private navService: HorizontalNavigationService,
    private authService: AuthService,
    private router: Router,
    private commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.resolveManagerContextAndLoadMenu();
  }

  private resolveManagerContextAndLoadMenu(): void {
    const userId = this.authService.currentUserValue?.windowsID || '';
    if (!userId) {
      this.loadMenu();
      return;
    }

    this.commonService.getEmployeeStatusForJobList(userId).subscribe({
      next: (statusData: any) => {
        const resolvedStatus = this.extractStatusValue(statusData);
        this.isManagerContext = this.isManagerLike(resolvedStatus);
        this.loadMenu();
      },
      error: () => {
        this.isManagerContext = this.getManagerContextFromLocalUserData();
        this.loadMenu();
      }
    });
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
        this.menuItems = this.applyManagerMenuAdjustments(items);
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

  getRouterPath(url?: string | null): string {
    const safeUrl = this.getSafeUrl(url);
    const [path] = safeUrl.split('?');
    return path || '/';
  }

  getRouterQueryParams(url?: string | null): { [key: string]: string } | null {
    const safeUrl = this.getSafeUrl(url);
    const queryIndex = safeUrl.indexOf('?');
    if (queryIndex === -1) {
      return null;
    }

    const queryString = safeUrl.substring(queryIndex + 1).trim();
    if (!queryString) {
      return null;
    }

    const params: { [key: string]: string } = {};
    const pairs = queryString.split('&');

    for (const pair of pairs) {
      if (!pair) continue;

      const equalIndex = pair.indexOf('=');
      const rawKey = equalIndex >= 0 ? pair.substring(0, equalIndex) : pair;
      const rawValue = equalIndex >= 0 ? pair.substring(equalIndex + 1) : '';

      const key = decodeURIComponent(rawKey || '').trim();
      const value = decodeURIComponent((rawValue || '').replace(/\+/g, ' '));

      if (key) {
        params[key] = value;
      }
    }

    return Object.keys(params).length ? params : null;
  }

  onExternalLinkClick(event: MouseEvent, url?: string | null): void {
    const safeUrl = this.getSafeUrl(url);
    if (!this.isExternalLink(safeUrl)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  }

  isActiveRoute(url?: string | null): boolean {
    if (!url) return false;

    // Compare by route path to avoid query-string encoding differences
    const actualRoute = this.getRouterPath(url);

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

  private applyManagerMenuAdjustments(items: NavigationItem[]): NavigationItem[] {
    if (!this.isManagerContext || !Array.isArray(items) || items.length === 0) {
      return items;
    }

    const menuCopy = items.map(item => ({
      ...item,
      children: item.children ? [...item.children] : []
    }));

    this.insertPartReturnAfterPartReq(menuCopy);
    return menuCopy;
  }

  private insertPartReturnAfterPartReq(items: NavigationItem[]): boolean {
    if (!Array.isArray(items) || items.length === 0) {
      return false;
    }

    const normalize = (value: string) => (value || '').toString().trim().toLowerCase();
    const partReqIndex = items.findIndex(item => normalize(item.name).includes('part req status'));
    const hasPartReturn = items.some(item => {
      const itemName = normalize(item.name);
      const itemUrl = normalize(item.url);
      return itemName.includes('part return status') || itemUrl.includes('/reports/part-return-status');
    });

    if (partReqIndex >= 0 && !hasPartReturn) {
      const partReqItem = items[partReqIndex];
      const partReturnItem: NavigationItem = {
        id: `custom-part-return-status-${partReqItem.parentId || 'root'}`,
        parentId: partReqItem.parentId,
        name: 'Part Return Status',
        url: '/reports/part-return-status',
        children: []
      };

      items.splice(partReqIndex + 1, 0, partReturnItem);
      return true;
    }

    for (const item of items) {
      if (item.children && item.children.length > 0) {
        const inserted = this.insertPartReturnAfterPartReq(item.children);
        if (inserted) {
          return true;
        }
      }
    }

    return false;
  }

  private extractStatusValue(statusData: any): string {
    if (Array.isArray(statusData) && statusData.length > 0) {
      return (statusData[0]?.Status || statusData[0]?.status || '').toString().trim();
    }

    if (statusData && typeof statusData === 'object') {
      return (statusData?.Status || statusData?.status || '').toString().trim();
    }

    return '';
  }

  private isManagerLike(status: string): boolean {
    const normalized = (status || '').toString().trim().toLowerCase();
    return normalized === 'manager' || normalized === 'other' || normalized === 'm' || normalized === 'o' || normalized.includes('manager');
  }

  private getManagerContextFromLocalUserData(): boolean {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (!userDataStr) {
        return false;
      }

      const userData = JSON.parse(userDataStr);
      const localStatus = (
        userData?.employeeStatus ||
        userData?.empStatus ||
        userData?.role ||
        userData?.userRole ||
        ''
      ).toString().trim();

      return this.isManagerLike(localStatus);
    } catch {
      return false;
    }
  }
}
