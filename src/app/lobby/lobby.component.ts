import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { SessionIdentityService } from '../identity/session-identity.service';

type CopyTarget = 'id' | 'link';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent {
  private readonly router = inject(Router);
  private readonly identity = inject(SessionIdentityService);

  /** This tab's auto-generated, human-shareable id — see SessionIdentityService. */
  readonly id = this.identity.id;

  /** Which copy button last succeeded, to show a transient "Copié ✓" — cleared after 2s. */
  readonly justCopied = signal<CopyTarget | null>(null);

  readonly inviteLink = () => `${location.origin}/hub/${this.id()}`;

  regenerate(): void {
    this.identity.regenerate();
  }

  async copyId(): Promise<void> {
    await this.copy(this.id(), 'id');
  }

  async copyLink(): Promise<void> {
    await this.copy(this.inviteLink(), 'link');
  }

  enter(): void {
    this.router.navigate(['/hub', this.id()]);
  }

  private async copy(text: string, target: CopyTarget): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      this.justCopied.set(target);
      setTimeout(() => this.justCopied.set(null), 2000);
    } catch {
      // Clipboard API unavailable/denied — the id is still selectable and
      // readable on screen, so this is a soft failure, not a dead end.
    }
  }
}
