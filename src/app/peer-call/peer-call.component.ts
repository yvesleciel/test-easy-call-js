import {Component, inject, Input, OnInit} from '@angular/core';
import {CallParam, CallProcessService} from "easy-call-js";
import {PeerService} from "../peer.service";
import {Router} from "@angular/router";

export const firebaseConfig = {
  apiKey: "AIzaSyA4kjkPodiM2-lwCRxog0FoEOpvyRLnFgE",
  authDomain: "mkutano-6e62b.firebaseapp.com",
  projectId: "mkutano-6e62b",
  storageBucket: "mkutano-6e62b.firebasestorage.app",
  messagingSenderId: "216681224820",
  appId: "1:216681224820:web:202a8d2cfcab72e32ecf21",
  measurementId: "G-KLBJN3W0L4"
};

export const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const constraint = {
  "video": {
    "width": {
      "min": 200,
      "max": 400
    },
    "height": {
      "min": 200,
      "max": 400
    }
  },
  "audio":true
}

@Component({
  selector: 'app-peer-call',
  standalone: true,
  imports: [],
  templateUrl: './peer-call.component.html',
  styleUrl: './peer-call.component.scss'
})
export class PeerCallComponent implements OnInit{
   callService = inject(CallProcessService);
   peerService = inject(PeerService);
   callId = '';
   @Input() userId: string = '';
   router = inject(Router);

   ngOnInit() {
     this.peerService.callSubject.subscribe(async data => {
       if(data != null) {
         this.callService.initializeCall(data.callIssuerId, data.usersToCallId).then((callId: string) => {
           console.log('Call initialized with callId ', callId);
           this.callId = callId
           this.callService.handleLeaveCall(callId).subscribe((value)=>{
             console.log('leave call user', value)
             if(value != this.userId){
               console.log('leave call user2: ',value)
               this.callService.removeParticipantVideo(value);
             }
           })
           this.callPeople(data, callId)
         })
       }
     });
     this.peerService.takeCallSubject.subscribe(async data => {
       console.log(data);
       if(data != null) {
         this.callId = data.callId;
         this.callService.handleLeaveCall(this.callId).subscribe((value)=>{
           console.log('leave call user', value)
           if(value != this.userId){
             console.log('leave call user: ',value)
             this.callService.removeParticipantVideo(value);
           }
         })
         await this.takeCall(data.participantId, data.callId, data.localVideoSelector, data.idContentForCallSelector);
       }
     });
   }

  async callPeople(callParam: CallParam, callId: string): Promise<void> {
    await this.callService.launchCall(callParam, callId);
  }

  async takeCall(participantId: string, callId: string, localVideoSelector: string, idContentForCallSelector: string){
    await this.callService.takeCall(participantId, callId, localVideoSelector, idContentForCallSelector);
  }

  async releaseCall() {
    try {
      this.callService.releaseCall(this.callId, this.userId);
    }catch(error){
      console.log(error)
    }finally {
      await this.router.navigate(['home'], {queryParams: {userId: this.userId}});
    }
  }
}
