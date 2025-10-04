import {Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {PeerService} from "../peer.service";
import {CallProcessService} from "easy-call-js";
import {Router} from "@angular/router";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnChanges{
   peerService = inject(PeerService);
   callService = inject(CallProcessService);
   isTakeCall = false;
   @Input() userId: string = '';
   callId = '';
   router = inject(Router);

   emitCall(): void {
     this.peerService.callSubject.next({usersToCallId: ['2222', '3333', '4444'],
                                              callIssuerId: this.userId, videoSelector: 'localVideo', idContentForCall: 'content'});
     this.router.navigate(['/call', this.userId]);
   }

   takeCall(): void {
     this.isTakeCall = false;
     this.peerService.takeCallSubject.next({participantId: this.userId, callId: this.callId, localVideoSelector:'localVideo', idContentForCallSelector: 'content'});
     this.router.navigate(['/call', this.userId]);
   }

   ngOnChanges(changes: SimpleChanges) {
     console.log(this.userId);
     this.callService.trackCall(this.userId).then(track => {
       //faire sonner l'appareil si possible

       //autres actions
       this.isTakeCall = true;
       this.callId = track
     })
   }
}
