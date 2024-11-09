import { Injectable } from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class PeerService {

  callSubject = new BehaviorSubject<CallParam | null>(null);
  takeCallSubject = new BehaviorSubject<ReceiverParam | null>(null);

  constructor() { }
}

export interface CallParam{
  usersToCallId: string[],
  callIssuerId: string,
  videoSelector: string,
  idContentForCall: string
}

export interface ReceiverParam {
  participantId: string,
  callId: string,
  localVideoSelector: string,
  idContentForCallSelector: string
}
