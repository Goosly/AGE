import {Component, Input} from '@angular/core';

@Component({
  selector: 'age-info-icon',
  templateUrl: './info-icon.component.html',
  styleUrls: [ './info-icon.component.css' ]
})
export class InfoIconComponent {
  @Input() info: string;
}
