import { Routes } from '@angular/router';
import {HomeComponent} from "./home/home.component";
import {PeerCallComponent} from "./peer-call/peer-call.component";

export const routes: Routes = [
  {path:'home', component:HomeComponent},
  {path: 'call/:userId', component: PeerCallComponent},
  {path: '', redirectTo: 'home', pathMatch: 'full'}
];
