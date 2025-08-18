import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-config',
  imports: [CommonModule, FormsModule],
  template: `
    <h3 class="mb-3">Configuration</h3>
    <form class="row g-3" (ngSubmit)="save()">
      <div class="col-md-3">
        <label class="form-label">EATING_CARROT_POINTS</label>
        <input class="form-control" type="number" [(ngModel)]="carrot" name="carrot" />
      </div>
      <div class="col-md-3">
        <label class="form-label">EATING_LETTUCE_POINTS</label>
        <input class="form-control" type="number" [(ngModel)]="lettuce" name="lettuce" />
      </div>
      <div class="col-md-3">
        <label class="form-label">PLAY_DATE_POINTS</label>
        <input class="form-control" type="number" [(ngModel)]="play" name="play" />
      </div>
      <div class="col-12">
        <button class="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  `,
  styles: ``
})
export class Config {
  carrot = 3;
  lettuce = 1;
  play = 2;

  async save(): Promise<void> {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ EATING_CARROT_POINTS: this.carrot, EATING_LETTUCE_POINTS: this.lettuce, PLAY_DATE_POINTS: this.play })
      });
      if (!res.ok) throw new Error('Failed to save config');
      alert('Config saved, recalculating...');
    } catch (err) {
      console.error(err);
    }
  }
}
