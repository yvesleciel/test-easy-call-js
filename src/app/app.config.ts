import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import { routes } from './app.routes';
import {CallProcessService, CallServiceFactory, FirebaseCallProcess} from "easy-call-js";
import {firebaseConfig} from "./peer-call/peer-call.component";

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes, withComponentInputBinding()),
    {provide: CallProcessService, useFactory: () => CallServiceFactory.create(new FirebaseCallProcess(firebaseConfig))}]
};
