import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DocumentsComponent } from './documents/documents.component';
import { ExtensionPopUpComponent } from './extension-pop-up/extension-pop-up.component';


const routes: Routes = [
  {
    path: '', component: ExtensionPopUpComponent
  },
  // {
  //   path: 'google-ads', component: FollowMeGoogleAdsComponent
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
