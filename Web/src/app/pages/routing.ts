import { Routes } from '@angular/router';
import { JobEditComponent } from './jobs/job-edit/job-edit.component';
import { AuthGuard } from '../modules/auth/services/auth.guard';

const Routing: Routes = [
  {
    path: 'calendar',
    canActivate: [AuthGuard],
    loadChildren: () => import('./calendar/calendar.module').then(m => m.CalendarModule),
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
  },
  {
    path: 'pricing',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pricing/capfanpricing.module').then(m => m.CapfanpricingModule),
  },
  {
    path: 'quotes',
    canActivate: [AuthGuard],
    loadChildren : () => import('../modules/quotes/quotes.module').then(m => m.QuotesModule),
  },
  {
    path: 'application-sent',
    canActivate: [AuthGuard],
    loadChildren : () => import('../modules/application-to-be-sent/application-to-be-sent.module').then(m => m.SiteMaintenanceModule),
  },
  {
    path: 'site-maintenance',
    canActivate: [AuthGuard],
    loadChildren : () => import('../modules/site-maintenance/site-maintenance.module').then(m => m.SiteMaintenanceModule),
  },
  {
    path: 'report',
    canActivate: [AuthGuard],
    loadChildren : () => import('../modules/reports/reports.module').then(m => m.ReportsModule),
  },
  {
    path: 'reports',
    canActivate: [AuthGuard],
    loadChildren : () => import('./reports/reports.module').then(m => m.ReportsModule),
  },
  {
    path: 'quote-amounts',
    canActivate: [AuthGuard],
    loadChildren : () => import('../modules/graphs/quote_amounts.module').then(m => m.QuoteAmountsModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dashboard-view/dashboard-view.module').then((m) => m.DashboardViewModule),
  },
  {
    path: 'dashboard-view',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./dashboard-view/dashboard-view.module').then((m) => m.DashboardViewModule),
  },
  {
    path: 'crafted/account',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('../modules/account/account.module').then((m) => m.AccountModule),
    data: { layout: 'dark-header' },
  },
  {
    path: 'crafted/pages/wizards',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('../modules/wizards/wizards.module').then((m) => m.WizardsModule),
    data: { layout: 'light-header' },
  },
  {
    path: 'crafted/widgets',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('../modules/widgets-examples/widgets-examples.module').then(
        (m) => m.WidgetsExamplesModule
      ),
    data: { layout: 'light-header' },
  },
  {
    path: 'apps/chat',
    // canActivate: [AuthGuard],
    loadChildren: () =>
      import('../modules/apps/chat/chat.module').then((m) => m.ChatModule),
    data: { layout: 'light-sidebar' },
  },
  {
    path: '',
    redirectTo: '/dashboard-view',
    pathMatch: 'full',
  },
  {
    path: 'jobs',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./jobs/jobs.module').then((m) => m.JobsModule),
    data: { layout: 'light-sidebar' },
  },
  {
    path : 'job-edit',
    canActivate: [AuthGuard],
    component: JobEditComponent
  },
  {
    path: 'to-do-list',
    canActivate: [AuthGuard],
    loadChildren: () => import('./to-do-list/to-do-list.module').then((m) => m.ToDoListModule),
    data: { layout: 'light-sidebar' },
  },
  {
    path: 'graphs',
    canActivate: [AuthGuard],
    loadChildren: () => import('./graphs/graphs.module').then((m) => m.GraphsModule),
    data: { layout: 'light-sidebar' },
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];

export { Routing };
