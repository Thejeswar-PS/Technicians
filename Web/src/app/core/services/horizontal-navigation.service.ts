import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, shareReplay } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface NavigationItem {
  id: string;
  parentId: string | null;
  name: string;
  url: string;
  children: NavigationItem[];
}

@Injectable({
  providedIn: 'root'
})
export class HorizontalNavigationService {
  private apiUrl = environment.apiUrl;
  private menuObservableCache: { [userId: string]: Observable<NavigationItem[]> } = {};
  private readonly CACHE_KEY_PREFIX = 'menu_items_';
  private readonly CACHE_VERSION_KEY = 'menu_items_cache_version';
  private readonly CACHE_VERSION = 'v2';

  constructor(private http: HttpClient) {}

  getMenuItems(userId: string): Observable<NavigationItem[]> {
    this.ensureCacheVersion();
    const cacheKey = this.CACHE_KEY_PREFIX + userId;

    // Check localStorage for cached data first
    const cachedData = this.getCachedMenuItems(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    // Return cached Observable if request is in progress
    if (this.menuObservableCache[userId]) {
      return this.menuObservableCache[userId];
    }

    // Fetch and cache the menu items
    const menuItems$ = this.fetchMenuItems(userId, 0).pipe(
      switchMap(items => this.attachChildren(userId, items)),
      map(items => {
        // Store in localStorage
        this.setCachedMenuItems(cacheKey, items);
        return items;
      }),
      shareReplay(1) // Cache the Observable result
    );

    // Store the Observable to prevent multiple concurrent requests
    this.menuObservableCache[userId] = menuItems$;

    return menuItems$;
  }

  // Get cached data from localStorage
  private getCachedMenuItems(cacheKey: string): NavigationItem[] | null {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        return null;
      }

      const parsed = JSON.parse(cached) as NavigationItem[];
      return this.remapCachedItems(parsed);
    } catch (error) {
      console.error('Error retrieving cached menu items:', error);
      return null;
    }
  }

  // Store data in localStorage
  private setCachedMenuItems(cacheKey: string, items: NavigationItem[]): void {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(items));
    } catch (error) {
      console.error('Error storing menu items in cache:', error);
    }
  }

  // Clear cache for a specific user (call this on logout)
  clearCache(userId: string): void {
    const cacheKey = this.CACHE_KEY_PREFIX + userId;
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
    delete this.menuObservableCache[userId];
  }

  // Clear all cache
  clearAllCache(): void {
    try {
      for (const key in localStorage) {
        if (key.startsWith(this.CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
    this.menuObservableCache = {};
  }

  private fetchMenuItems(userId: string, menuId: number): Observable<NavigationItem[]> {
    const params = new HttpParams()
      .set('UserID', userId)
      .set('MenuID', menuId.toString());

    return this.http.get<any>(`${this.apiUrl}/Common/GetLinkswithLogin`, { params }).pipe(
      map(response => this.normalizeItems(response))
    );
  }

  private attachChildren(userId: string, items: NavigationItem[]): Observable<NavigationItem[]> {
    if (!items.length) {
      return of([]);
    }

    const requests = items.map(item =>
      this.fetchMenuItems(userId, Number(item.id)).pipe(
        switchMap(children => this.attachChildren(userId, children)),
        map(children => ({ ...item, children }))
      )
    );

    return forkJoin(requests);
  }

  private normalizeItems(response: any): NavigationItem[] {
    const rows = Array.isArray(response)
      ? response
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.columns)
          ? response.columns
          : [];

    return rows.map((row: any) => ({
      id: String(
        row.Menu_Id || row.menuId || row.menu_id || row.menu_ID || row.id || ''
      ),
      parentId: row.Menu_Parent_ID || row.menuParentId || row.menu_ParentID || row.parentId || row.menu_parent_id || null,
      name: row.Menu_Name || row.menuName || row.menu_Name || row.name || '',
      url: this.mapLegacyUrl(
        row.Menu_Page_URL || row.menuPageUrl || row.menu_Page_URL || row.url || '',
        row.Menu_Name || row.menuName || row.menu_Name || row.name || ''
      ),
      children: []
    }));
  }

  private mapLegacyUrl(url: string, name: string): string {
    const rawUrl = (url || '').trim();
    if (!rawUrl) {
      return '';
    }

    let cleanedUrl = rawUrl.replace(/\\/g, '/').replace(/^~\//, '');
    const lower = cleanedUrl.toLowerCase();
    const legacyHostPrefix = 'http://dcgwebint/';

    if (lower.startsWith(legacyHostPrefix)) {
      cleanedUrl = cleanedUrl.substring(legacyHostPrefix.length);
    } else if (lower.startsWith('http://') || lower.startsWith('https://')) {
      return rawUrl;
    }

    const [base, query] = cleanedUrl.split('?');
    const baseKey = base.replace(/^\/+/, '').toLowerCase();

    const legacyMap: { [key: string]: string } = {
      // Miscellaneous & General Pages
      'miscellaneoustasks.aspx': '/miscellaneous-tasks',
      'createdtechusers.aspx': '/reports/dtech-users-data',
      'techmileagedashboard.aspx': '/mileage-dashboard',
      
      // Reports
      'reports/partrequeststatus.aspx': '/reports/parts-request-status',
      'reports/partrequestStatus.aspx': '/reports/parts-request-status',
      'partrequeststatus.aspx': '/reports/parts-request-status',
      'reports/unscheduledreport.aspx': '/reports/unscheduled-report',
      'reports/accountingstatus.aspx': '/reports/accounting-status',
      'reports/libertparts.aspx': '#todo-liebert-part-numbers',
      'reports/jobstobeuploaded.aspx': '/tools/jobs-to-be-uploaded',
      'reports/contractdetailsreport.aspx': '/reports/contract-details-report',
      'reports/pastduecontractdetails.aspx': '/reports/past-due-contract-details',
      'reports/emergencyjobs.aspx': '/reports/emergency-jobs',
      'reports/dcgdisplayreportdetails.aspx': '/reports/display-calls-detail',
      
      // Parts & Testing
      'partreturnstatus.aspx': '/reports/part-return-status',
      'testinfopartentry.aspx': '/reports/parts-test-info',
      'partsteststatus.aspx': '/reports/parts-test-status',
      'strippedupsunitsstatus.aspx': '/reports/stripped-units-status',
      
      // User Management
      'dtechuserssearch.aspx': '/reports/dtech-users-data',
      'dtechusersreport.aspx': '/reports/dtech-users-data',
      
      // Jobs & Calendar
      'dtechjobslist.aspx': '/jobs/job-list',
      'techcalendar.aspx': '/calendar',
      
      // Tools
      'toolstrackingcalendar.aspx': '/tools/tools-tracking-calendar',
      'billafterpmjobs.aspx': '/tools/bill-after-pm-jobs',
      
      // Search
      'dtechpartsearch.aspx': '/reports/parts-search',
      
      // Graphs & Charts
      'reports/accmgmtgraph.aspx': '/graphs/account-manager-graph',
      'capfanusageyearly.aspx': '/graphs/cap-fan-usage-yearly',
      'http://dcgwebint/capfanusageyearly.aspx': '/graphs/cap-fan-usage-yearly',
      'reports/pastduegraph.aspx': '/graphs/past-due-graph',
      
      // Performance Reports
      'displayreports/accmgrperformance.aspx': '/reports/acc-mgr-performance-report',
      
      // Testing
      'newunittesting.aspx': '/reports/new-unit-test',
      'newunitsteststatus.aspx': '/reports/ups-test-status',
      'newunitsTestStatus.aspx': '/reports/ups-test-status',
      
      // Orders
      'orderrequest.aspx': '/reports/order-request',
      'orderrequeststatus.aspx': '/reports/order-request-status',
      
      // Legacy Full URLs
      'http://dcgwebint/Reports/UnScheduledReport.aspx': '/reports/unscheduled-report'
    };

    const mappedBase = legacyMap[baseKey];
    if (!mappedBase) {
      return rawUrl;
    }

    if (!query) {
      return mappedBase;
    }

    return `${mappedBase}?${query}`;
  }

  private remapCachedItems(items: NavigationItem[]): NavigationItem[] {
    return (items || []).map(item => ({
      ...item,
      url: this.mapLegacyUrl(item.url || '', item.name || ''),
      children: this.remapCachedItems(item.children || [])
    }));
  }

  private ensureCacheVersion(): void {
    try {
      const currentVersion = localStorage.getItem(this.CACHE_VERSION_KEY);
      if (currentVersion !== this.CACHE_VERSION) {
        this.clearAllCache();
        localStorage.setItem(this.CACHE_VERSION_KEY, this.CACHE_VERSION);
      }
    } catch (error) {
      console.error('Error validating cache version:', error);
    }
  }

  private buildTree(items: NavigationItem[]): NavigationItem[] {
    return items;
  }
}
