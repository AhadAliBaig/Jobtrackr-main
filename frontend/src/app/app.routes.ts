import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard'; 
import { LoginComponent } from './login/login';
import { ForgotPasswordComponent } from './forgot-password/forgot-password';
import { ResetPasswordComponent } from './reset-password/reset-password';
import { ProfileComponent } from './profile/profile';
import { JobFormComponent } from './job-form/job-form'; 
import { CoverLetterComponent } from './cover-letter/cover-letter'; 
import { BoardComponent } from './board/board'; 
import { ResourcesComponent } from './resources/resources';
import { UpdatesComponent } from './updates/updates';
import { AnalysisComponent } from './analysis/analysis';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  
  // Protected App Pages (require login)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'add-job', component: JobFormComponent, canActivate: [authGuard] },
  { path: 'edit-job/:id', component: JobFormComponent, canActivate: [authGuard] },
  { path: 'board', component: BoardComponent, canActivate: [authGuard] },
  { path: 'cover-letter', component: CoverLetterComponent, canActivate: [authGuard] },
  { path: 'resources', component: ResourcesComponent, canActivate: [authGuard] },
  { path: 'updates', component: UpdatesComponent, canActivate: [authGuard] },
  { path: 'analysis', component: AnalysisComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' } 
];