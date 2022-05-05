import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-setting-pop-up',
  templateUrl: './setting-pop-up.component.html',
  styleUrls: ['./setting-pop-up.component.scss']
})
export class SettingPopUpComponent implements OnInit {
  @Output() callback = new EventEmitter<any>();
  showAccount: boolean = false;
  constructor() { }

  ngOnInit(): void {
  }

  close(){
    this.callback.emit('close');
  }

}
