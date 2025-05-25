import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../components/auth/login/login.component';
import { RegisterComponent } from '../components/auth/register/register.component';
import { HomeComponent } from '../components/home/home.component';
import { FileManagementComponent } from '../components/file-management/file-management.component';
import { NgModule } from '@angular/core';
import { AboutComponent } from '../components/about/about.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'files', component: FileManagementComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'aboat', component: AboutComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}