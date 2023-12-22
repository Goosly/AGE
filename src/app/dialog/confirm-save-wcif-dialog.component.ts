import {Component} from '@angular/core';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';

@Component({
  selector: 'confirm-save-wcif-dialog',
  templateUrl: 'confirm-save-wcif-dialog.component.html',
})
export class ConfirmSaveWcifDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmSaveWcifDialogComponent>,
    // @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    dialogRef.disableClose = true;
  }

}
