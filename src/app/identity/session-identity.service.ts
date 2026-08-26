import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'easy-call-js-demo.session-id';

const ADJECTIVES = [
  'brave', 'calm', 'swift', 'bright', 'quiet', 'bold', 'gentle', 'sunny',
  'clever', 'lucky', 'proud', 'witty', 'merry', 'vivid', 'eager',
] as const;

const ANIMALS = [
  'otter', 'falcon', 'panda', 'lynx', 'heron', 'koala', 'viper', 'moose',
  'dingo', 'raven', 'tiger', 'whale', 'zebra', 'gecko', 'crane',
] as const;

/**
 * A friendly, human-shareable id (e.g. `swift-otter-42`), generated once
 * per browser **tab** and kept in `sessionStorage` for that tab's lifetime.
 *
 * Why not let visitors type their own id, like this demo used to? Once
 * public, unrelated strangers testing at the same time would very likely
 * pick the same handful of obvious names and collide on
 * `users/{userId}/call/callId` in Firestore — one stranger's incoming-call
 * banner could ring on someone else's screen. An id nobody has to invent
 * can't collide that way, and staying human-readable (rather than a UUID)
 * means it's still easy to read aloud or paste into a chat to invite
 * someone.
 *
 * `sessionStorage` rather than `localStorage` is the deliberate choice:
 * each browser **tab** gets its own id, so opening several tabs to
 * self-test a multiparty call (see the README) still gives you several
 * distinct participants — exactly the old behaviour, just without anyone
 * having to type or coordinate a name up front. Two people on two
 * different devices get two different ids too, and can find each other by
 * sharing one (copy button in the lobby) — a real cross-device test, not
 * just self-testing across tabs.
 */
@Injectable({ providedIn: 'root' })
export class SessionIdentityService {
  private readonly idSignal = signal(this.loadOrCreate());

  /** This tab's id — stable for the tab's lifetime unless {@link regenerate} is called. */
  readonly id = this.idSignal.asReadonly();

  /** Swaps in a brand-new id for this tab (e.g. to simulate a different guest without opening a new tab). */
  regenerate(): void {
    const created = randomId();
    this.persist(created);
    this.idSignal.set(created);
  }

  private loadOrCreate(): string {
    try {
      const existing = sessionStorage.getItem(STORAGE_KEY);
      if (existing) return existing;
    } catch {
      // sessionStorage unavailable (private mode, storage blocked, ...) —
      // fall through to an in-memory id, still fine for this page load.
    }
    const created = randomId();
    this.persist(created);
    return created;
  }

  private persist(id: string): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Best-effort only — an in-memory id still works for this page load.
    }
  }
}

function randomId(): string {
  const adjective = pick(ADJECTIVES);
  const animal = pick(ANIMALS);
  const suffix = Math.floor(10 + Math.random() * 90); // 10-99
  return `${adjective}-${animal}-${suffix}`;
}

function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}
