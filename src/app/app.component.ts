import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'advisor-latest';
  
    closePanel(){
      chrome.runtime.sendMessage({ msg: 'eassistant-injection-panel' });
    
  }
}

