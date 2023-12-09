import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatInputModule} from '@angular/material/input';
import {ConfirmSaveWcifDialogComponent} from './dialog/confirm-save-wcif-dialog.component';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
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
