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

  constructor(private http: HttpClient) {}

  getMenuItems(userId: string): Observable<NavigationItem[]> {
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
      return cached ? JSON.parse(cached) : null;
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
      url: row.Menu_Page_URL || row.menuPageUrl || row.menu_Page_URL || row.url || '',
      children: []
    }));
  }

  private buildTree(items: NavigationItem[]): NavigationItem[] {
    return items;
  }
}
