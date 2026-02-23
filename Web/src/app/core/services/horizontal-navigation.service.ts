import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {}

  getMenuItems(userId: string): Observable<NavigationItem[]> {
    return this.fetchMenuItems(userId, 0).pipe(
      switchMap(items => this.attachChildren(userId, items))
    );
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
