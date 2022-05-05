import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-extension-pop-up',
  templateUrl: './extension-pop-up.component.html',
  styleUrls: ['./extension-pop-up.component.scss']
})
export class ExtensionPopUpComponent implements OnInit {
  isShow: boolean = false;
  message={
    EIRemovePanel: "eassistant-injection-trigger-remove-panel"
    }
  showSetting: boolean = false;
  constructor() { }

  ngOnInit(): void {
  }

  openPopUp(): void {
    this.isShow = !this.isShow;
  }
  closePanel(){
   
    window.parent.postMessage(
      JSON.stringify({
        msg: this.message.EIRemovePanel,
      //  data: 'aa',
        index: window.frames.name || window.frames.location.href,
      }),
      "*"
    );
      }

}
