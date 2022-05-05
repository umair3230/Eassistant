import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DocumentsComponent } from './documents/documents.component';
import { HttpClientModule } from '@angular/common/http';
import { AuthenticationService } from './services/authentication/authentication.service';
import { HttpService } from './services/http/http.service';
import { ProgressSpinnerComponent } from './shared/progress-spinner/progress-spinner.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule  } from '@angular/forms';
import { ExtensionPopUpComponent } from './extension-pop-up/extension-pop-up.component';
import { SettingPopUpComponent } from './setting-pop-up/setting-pop-up.component';
import { FollowMeGoogleAdsComponent } from './follow-me-google-ads/follow-me-google-ads.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DocumentsComponent,
    ProgressSpinnerComponent,
    ExtensionPopUpComponent,
    SettingPopUpComponent,
    FollowMeGoogleAdsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    BrowserAnimationsModule
  ],
  providers: [AuthenticationService, HttpService],
  bootstrap: [AppComponent]
})
export class AppModule {}
