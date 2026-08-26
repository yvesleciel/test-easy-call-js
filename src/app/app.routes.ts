import { Routes } from '@angular/router';
import { LobbyComponent } from './lobby/lobby.component';
import { CallHubComponent } from './call-hub/call-hub.component';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'hub/:userId', component: CallHubComponent },
  { path: '**', redirectTo: '' },
];
