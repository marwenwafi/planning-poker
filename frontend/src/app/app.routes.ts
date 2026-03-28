import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'setup', pathMatch: 'full' },
  {
    path: 'setup',
    loadComponent: () =>
      import('./features/setup/setup.component').then(m => m.SetupComponent),
  },
  {
    path: 'session/:id/lobby',
    loadComponent: () =>
      import('./features/lobby/lobby.component').then(m => m.LobbyComponent),
  },
  {
    path: 'session/:id/vote',
    loadComponent: () =>
      import('./features/voting/voting.component').then(m => m.VotingComponent),
  },
  {
    path: 'session/:id/summary',
    loadComponent: () =>
      import('./features/summary/summary.component').then(m => m.SummaryComponent),
  },
  { path: '**', redirectTo: 'setup' },
];
