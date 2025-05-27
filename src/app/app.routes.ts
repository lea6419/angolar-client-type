import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../components/auth/login/login.component';
import { RegisterComponent } from '../components/auth/register/register.component';
import { HomeComponent } from '../components/home/home.component';
import { FileManagementComponent } from '../components/file-management/file-management.component';
import { NgModule } from '@angular/core';
import { FileUploadComponent } from '../components/upload/upload.component';
import { AuthGuard } from './guards/auth.guard';
import { AboutComponent } from '../components/about/about.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent },
  { path: 'files', component: FileManagementComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: FileUploadComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'aboaut', component: AboutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}