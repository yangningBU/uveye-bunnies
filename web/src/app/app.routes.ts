import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
  { path: 'bunnies/:id', loadComponent: () => import('./pages/bunny-detail/bunny-detail').then(m => m.BunnyDetail) },
  { path: 'config', loadComponent: () => import('./pages/config/config').then(m => m.Config) },
  { path: '**', redirectTo: '' }
];
