import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatLegacyInputModule as MatInputModule} from '@angular/material/legacy-input';
import {ConfirmSaveWcifDialogComponent} from './dialog/confirm-save-wcif-dialog.component';
import {MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import {MatLegacyButtonModule as MatButtonModule} from '@angular/material/legacy-button';
import {MatLegacyTooltipModule as MatTooltipModule} from '@angular/material/legacy-tooltip';
import {MatIconModule} from '@angular/material/icon';

@NgModule({
  imports: [BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule, MatIconModule],
  declarations: [ AppComponent, ConfirmSaveWcifDialogComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
