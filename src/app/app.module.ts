import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatSidenavModule} from '@angular/material/sidenav';
import {ConfirmSaveWcifDialogComponent} from './dialog/confirm-save-wcif-dialog.component';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import {MatButtonModule} from '@angular/material/button';
import {MatTooltipModule} from '@angular/material/tooltip';
import {InfoIconComponent} from './info-icon/info-icon.component';
import {MatSelectModule} from '@angular/material/select';
import {MatDividerModule} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';

@NgModule({
  imports: [BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatInputModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDividerModule],
  declarations: [AppComponent, ConfirmSaveWcifDialogComponent, InfoIconComponent],
  bootstrap: [AppComponent]
})
export class AppModule {
}
