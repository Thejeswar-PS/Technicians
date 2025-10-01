import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LayoutType } from '../../../core/configs/config';
import { LayoutInitService } from '../../../core/layout-init.service';
import { LayoutService } from '../../../core/layout.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-header-menu',
  templateUrl: './header-menu.component.html',
  styleUrls: ['./header-menu.component.scss'],
})
export class HeaderMenuComponent implements OnInit {
  constructor(private router: Router, private layout: LayoutService, private layoutInit: LayoutInitService, private auth: AuthService) {}

  empName: string = '';

  ngOnInit() {
    this.auth.currentUserSubject.subscribe(data=>
      {
        this.empName = data.empName.trim();
      });

      const link1 = document.getElementById('r1');
      const link2 = document.getElementById('r2');
      const link3 = document.getElementById('r3');
      const link4 = document.getElementById('r4');
      const link5 = document.getElementById('r5');
      const link6 = document.getElementById('r6');
      const link7 = document.getElementById('r7');
      const home = document.getElementById('home');
      // Add more variables for additional links if needed

      // if (link1) {
      //   link1.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 1 is clicked
      //   });
      // }

      // if (link2) {
      //   link2.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 2 is clicked
      //   });
      // }

      // if (link3) {
      //   link3.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 3 is clicked
      //   });
      // }

      // if (link4) {
      //   link4.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 4 is clicked
      //   });
      // }

      // if (link5) {
      //   link5.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 5 is clicked
      //   });
      // }

      // if (link6) {
      //   link6.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 6 is clicked
      //   });
      // }

      // if (link7) {
      //   link7.addEventListener('click', () => {
      //     setTimeout(() => {
      //       location.reload(); // Reload the current page after a brief delay
      //     }, 100); // Reload the current page when Link 7 is clicked
      //   });
      // }

      
  }

  calculateMenuItemCssClass(url: string): string {
    return checkIsActive(this.router.url, url) ? 'active' : '';
  }

  setBaseLayoutType(layoutType: LayoutType) {
    this.layoutInit.setBaseLayoutType(layoutType);
  }

  setToolbar(toolbarLayout: 'classic' | 'accounting' | 'extended' | 'reports' | 'saas') {
    const currentConfig = {...this.layout.layoutConfigSubject.value};
    if (currentConfig && currentConfig.app && currentConfig.app.toolbar) {
      currentConfig.app.toolbar.layout = toolbarLayout;
      this.layout.saveBaseConfig(currentConfig)
    }
  }
  goToDashboard(event: Event): void {
    event.preventDefault(); // prevent default anchor behavior
    this.router.navigate(['/dashboard-view']).then(() => {
      window.location.reload(); // full browser reload
    });
  }
}

const getCurrentUrl = (pathname: string): string => {
  return pathname.split(/[?#]/)[0];
};

const checkIsActive = (pathname: string, url: string) => {
  const current = getCurrentUrl(pathname);
  if (!current || !url) {
    return false;
  }

  if (current === url) {
    return true;
  }

  if (current.indexOf(url) > -1) {
    return true;
  }

  return false;
};
