import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map } from 'rxjs';

import { CallJoinTimeoutError, CallState } from 'easy-call-js';
import { CallProcessAngular, EcVideoDirective } from 'easy-call-js/angular';

type Status = 'idle' | 'incoming' | 'calling' | 'in-call';

@Component({
  selector: 'app-call-hub',
  standalone: true,
  imports: [FormsModule, EcVideoDirective],
  templateUrl: './call-hub.component.html',
  styleUrl: './call-hub.component.scss',
})
export class CallHubComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly callService = inject(CallProcessAngular);

  // Bound straight from the `:userId` route segment via
  // withComponentInputBinding() (see app.config.ts) — no ActivatedRoute
  // needed. It's this tab's auto-generated id from the lobby (see
  // SessionIdentityService); there is no separate "display name" concept
  // in this demo, so it's shown as-is throughout. (input() is developer
  // preview on the Angular 18 installed here; stable since v19,
  // functionally solid either way.)
  readonly userId = input.required<string>();

  readonly targetsInput = signal<string>('');
  readonly status = signal<Status>('idle');
  readonly currentCallId = signal<string | null>(null);
  readonly incomingCallId = signal<string | null>(null);
  readonly incomingFrom = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly justCopiedId = signal(false);

  // Bridge the SDK's RxJS streams to signals once, at the component
  // boundary — the template never touches `| async`.
  readonly localStream = toSignal(this.callService.localStream$, { initialValue: null });
  readonly state = toSignal(this.callService.state$, { initialValue: CallState.IDLE });

  // Convert the {id → stream} map into a template-friendly array.
  readonly remoteEntries = toSignal(
    this.callService.remoteStreams$.pipe(
      map(record => Object.entries(record).map(([participantId, stream]) => ({ participantId, stream }))),
    ),
    { initialValue: [] as { participantId: string; stream: MediaStream }[] },
  );

  /** Displayed on the incoming banner — falls back to a neutral French
   *  label when the signaling backend didn't report a caller id. Kept in
   *  TS to avoid apostrophe-escaping woes in templates. */
  readonly incomingCallerName = computed(() => this.incomingFrom() ?? "Quelqu'un");

  /** Whether "Quitter l'appel" should be offered. Bound to remote media too
   *  (not just `status`): a join that timed out client-side can still land
   *  moments later (see acceptIncoming/wireDomainEvents) — once a remote
   *  stream is actually flowing, the user must always be able to hang up,
   *  even if `status` hasn't caught up to 'in-call' yet. */
  readonly canLeaveCall = computed(() => this.status() === 'in-call' || this.remoteEntries().length > 0);

  ngOnInit(): void {
    this.wireDomainEvents();
    this.listenForIncomingCalls();
  }

  // -----------------------------------------------------------------------
  // Actions client
  // -----------------------------------------------------------------------

  async copyMyId(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.userId());
      this.justCopiedId.set(true);
      setTimeout(() => this.justCopiedId.set(false), 2000);
    } catch {
      // Clipboard API unavailable/denied — the id is still visible on
      // screen, so this is a soft failure, not a dead end.
    }
  }

  async startCall(): Promise<void> {
    const users = this.parseTargets();
    if (users.length === 0) {
      this.errorMessage.set('Indiquez au moins un destinataire.');
      return;
    }
    this.clearMessages();
    this.status.set('calling');
    try {
      const callId = await this.callService.startCall(this.userId(), users);
      this.currentCallId.set(callId);
      this.infoMessage.set(`Appel ${callId} démarré avec ${users.length} participant(s).`);
    } catch (err) {
      this.status.set('idle');
      this.errorMessage.set(`Impossible de démarrer l'appel : ${(err as Error).message}`);
    }
  }

  async acceptIncoming(): Promise<void> {
    const callId = this.incomingCallId();
    if (!callId) return;
    this.clearMessages();
    this.status.set('calling');
    try {
      await this.callService.takeCall(this.userId(), callId, { joinTimeoutMs: 45_000 });
      this.currentCallId.set(callId);
      this.infoMessage.set(`Vous avez rejoint l'appel ${callId}.`);
      this.incomingFrom.set(null);
    } catch (err) {
      this.status.set('idle');
      const msg =
        err instanceof CallJoinTimeoutError
          ? "Le rejoin a expiré. L'appelant a peut-être quitté."
          : `Impossible de rejoindre : ${(err as Error).message}`;
      this.errorMessage.set(msg);
      if (err instanceof CallJoinTimeoutError) {
        // The join can still complete in the background after this timeout
        // (easy-call-js doesn't cancel the in-flight negotiation) — a late
        // `Joined` event will flip `status` back to 'in-call' and clear this
        // message (see wireDomainEvents). Keep the call id so "Quitter
        // l'appel" can release it meanwhile, in case media is already
        // flowing despite the timeout — see canLeaveCall().
        this.currentCallId.set(callId);
      }
      this.incomingCallId.set(null);
      this.incomingFrom.set(null);
      this.listenForIncomingCalls();
    }
  }

  async rejectIncoming(): Promise<void> {
    this.clearMessages();
    try {
      await this.callService.rejectCall(this.userId());
    } catch (err) {
      this.errorMessage.set(`Rejet échoué : ${(err as Error).message}`);
    } finally {
      this.incomingCallId.set(null);
      this.incomingFrom.set(null);
      this.status.set('idle');
      this.listenForIncomingCalls();
    }
  }

  async leaveCall(): Promise<void> {
    const callId = this.currentCallId();
    if (!callId) return;
    this.clearMessages();
    try {
      await this.callService.releaseCall(callId, this.userId());
    } catch (err) {
      this.errorMessage.set(`Sortie de l'appel échouée : ${(err as Error).message}`);
    }
  }

  async logout(): Promise<void> {
    if (this.status() === 'in-call' && this.currentCallId()) {
      await this.leaveCall();
    }
    await this.callService.cleanup();
    this.router.navigate(['/']);
  }

  // -----------------------------------------------------------------------
  // Câblage des événements de domaine
  // -----------------------------------------------------------------------

  private wireDomainEvents(): void {
    this.callService.events$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        switch (event.kind) {
          case 'Joined':
            this.status.set('in-call');
            this.currentCallId.set(event.callId);
            // A join can complete *after* acceptIncoming() already reported
            // a CallJoinTimeoutError (see there) — clear that stale message
            // now that the call is actually up.
            this.errorMessage.set(null);
            break;
          case 'CallEnded':
            this.status.set('idle');
            this.currentCallId.set(null);
            this.infoMessage.set(`Appel terminé (${event.reason}).`);
            this.listenForIncomingCalls();
            break;
          case 'ParticipantJoined':
            this.infoMessage.set(`${event.participantId} a rejoint.`);
            break;
          case 'ParticipantLeft':
            this.infoMessage.set(`${event.participantId} a quitté.`);
            break;
          case 'IncomingCall':
            // trackIncomingCalls resolves once — we surface via a signal.
            break;
          case 'Error':
            this.errorMessage.set(`${event.operation} : ${event.error.message}`);
            break;
        }
      });
  }

  private listenForIncomingCalls(): void {
    // trackIncomingCalls resolves each time the signaling backend reports a
    // new incoming call for this user. Re-arm the listener after each ring.
    this.callService
      .trackIncomingCalls(this.userId())
      .then(({ callId, from }) => {
        if (this.status() === 'in-call') {
          // Already in a call — ignore silently, don't overwrite the UI.
          this.listenForIncomingCalls();
          return;
        }
        this.incomingCallId.set(callId);
        this.incomingFrom.set(from ?? null);
        this.status.set('incoming');
      })
      .catch((err: unknown) => {
        this.errorMessage.set(`Écoute des appels entrants : ${(err as Error).message}`);
      });
  }

  private parseTargets(): string[] {
    return this.targetsInput()
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  private clearMessages(): void {
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }
}
