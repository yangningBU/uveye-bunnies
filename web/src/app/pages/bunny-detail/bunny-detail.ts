import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface BunnyDetailModel {
  id: string;
  name: string;
  carrots_eaten: number;
  lettuce_eaten: number;
  play_dates_had: number;
  happiness: number;
}

@Component({
  selector: 'app-bunny-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <a routerLink="/" class="btn btn-link p-0 mb-3">← Back</a>

    <div *ngIf="bunny() as b">
      <h3 class="mb-3">{{ b.name }}</h3>

      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted">Happiness</div>
            <div class="fs-3 fw-bold">{{ b.happiness }}</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted">Carrots eaten</div>
            <div class="d-flex align-items-center gap-2">
              <span class="fs-5">{{ b.carrots_eaten }}</span>
              <button class="btn btn-sm btn-primary" (click)="increment('INC_CARROT_EATEN')">+1</button>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted">Lettuce eaten</div>
            <div class="d-flex align-items-center gap-2">
              <span class="fs-5">{{ b.lettuce_eaten }}</span>
              <button class="btn btn-sm btn-primary" (click)="increment('INC_LETTUCE_EATEN')">+1</button>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card p-3">
            <div class="text-muted">Play dates</div>
            <div class="d-flex align-items-center gap-2">
              <span class="fs-5">{{ b.play_dates_had }}</span>
            </div>
          </div>
        </div>
      </div>

      <form class="row g-2 align-items-end" (ngSubmit)="recordPlayDate()">
        <div class="col-auto">
          <label class="form-label d-block">Play with</label>
          <select class="form-select" [(ngModel)]="selectedFriendId" name="friend">
            <option value="" disabled selected>Select bunny</option>
            <option *ngFor="let other of otherBunnies()" [value]="other.id">{{ other.name }}</option>
          </select>
        </div>
        <div class="col-auto">
          <button class="btn btn-secondary" type="submit" [disabled]="!selectedFriendId">Record play date</button>
        </div>
      </form>
    </div>
  `,
  styles: ``
})
export class BunnyDetail {
  private route = new ActivatedRoute();

  bunny = signal<BunnyDetailModel | null>(null);
  otherBunnies = signal<{ id: string; name: string }[]>([]);
  selectedFriendId: string = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.reload(id);
    }
  }

  private async reload(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/bunnies/${id}`);
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      this.bunny.set(data);

      const res2 = await fetch('/api/dashboard');
      const data2 = await res2.json();
      this.otherBunnies.set(data2.bunnies.filter((b: any) => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async increment(type: 'INC_CARROT_EATEN' | 'INC_LETTUCE_EATEN'): Promise<void> {
    if (!this.bunny()) return;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bunny_id: this.bunny()!.id, name: type, count: 1 })
      });
      if (!res.ok) throw new Error('Failed to record event');
      await this.reload(this.bunny()!.id);
    } catch (err) {
      console.error(err);
    }
  }

  async recordPlayDate(): Promise<void> {
    if (!this.bunny() || !this.selectedFriendId) return;
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bunny_id: this.bunny()!.id, play_date_id: this.selectedFriendId, name: 'INC_PLAY_DATE_HAD', count: 1 })
      });
      if (!res.ok) throw new Error('Failed to record play date');
      this.selectedFriendId = '';
      await this.reload(this.bunny()!.id);
    } catch (err) {
      console.error(err);
    }
  }
}
