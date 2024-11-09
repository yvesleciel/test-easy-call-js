import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {provideRouter, withComponentInputBinding} from '@angular/router';

import { routes } from './app.routes';
import {CallProcessService, FirebaseCallProcess} from "easy-call-js";
import {configuration, constraint, firebaseConfig} from "./peer-call/peer-call.component";

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes, withComponentInputBinding()),
    {provide: CallProcessService, useFactory: () => new CallProcessService(new FirebaseCallProcess(firebaseConfig), configuration, constraint)}]
};
