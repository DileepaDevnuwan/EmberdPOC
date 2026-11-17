import { Component } from '@angular/core';
import { HostBridgeService } from './host-bridge.service';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>'
})
export class AppComponent {
  constructor(bridge: HostBridgeService) {
    bridge.start();
  }
}
