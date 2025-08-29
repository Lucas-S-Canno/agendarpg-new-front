import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent }     from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NewEventComponent } from './components/new-event/new-event.component';
import { MyEventsComponent } from './components/my-events/my-events.component';
import { RegisteredEventsComponent } from './components/registered-events/registered-events.component';
import { RegisterNewUserComponent } from './components/register-new-user/register-new-user.component';
import { UserProfileComponent } from './components/user-profile/user-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';

export const routes: Routes = [
  { path: '',         redirectTo: 'dashboard',    pathMatch: 'full' },
  { path: 'login',    component: LoginComponent },
  { path: 'cadastro', component: RegisterNewUserComponent },
  { path: 'dashboard',component: DashboardComponent },
  { path: 'recuperar-senha', component: ForgotPasswordComponent },
  {
    path: 'novo-evento',
    component: NewEventComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'meus-eventos',
    component: MyEventsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'eventos-registrados',
    component: RegisteredEventsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'perfil',
    component: UserProfileComponent,
    canActivate: [AuthGuard]
  },
  { path: '**',       redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
