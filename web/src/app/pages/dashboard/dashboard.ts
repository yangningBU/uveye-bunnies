import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface BunnyListItem {
  id: string;
  name: string;
  happiness: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="row mb-4">
      <div class="col-auto">
        <div class="card p-3">
          <div class="text-muted">Total bunnies</div>
          <div class="fs-3 fw-bold">{{ totalCount() }}</div>
        </div>
      </div>
      <div class="col-auto">
        <div class="card p-3">
          <div class="text-muted">Average happiness</div>
          <div class="fs-3 fw-bold">{{ averageHappiness() | number:'1.0-1' }}</div>
        </div>
      </div>
    </div>

    <form class="row g-2 mb-4" (ngSubmit)="createBunny()">
      <div class="col-auto">
        <input class="form-control" placeholder="New bunny name" name="name" [(ngModel)]="newBunnyName" (input)="sanitizeName()" />
      </div>
      <div class="col-auto">
        <button class="btn btn-primary" type="submit" [disabled]="!newBunnyName">Add Bunny</button>
      </div>
    </form>

    <div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
      <div class="col" *ngFor="let b of bunnies()">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">{{ b.name }}</h5>
            <p class="card-text mb-2">Happiness: {{ b.happiness }}</p>
            <a class="btn btn-outline-secondary btn-sm" [routerLink]="['/bunnies', b.id]">Open</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``
})
export class Dashboard {
  bunnies = signal<BunnyListItem[]>([]);
  totalCount = signal<number>(0);
  averageHappiness = signal<number>(0);
  newBunnyName = '';

  sanitizeName(): void {
    this.newBunnyName = this.newBunnyName.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      this.bunnies.set(data.bunnies);
      this.totalCount.set(data.bunnies_count);
      this.averageHappiness.set(data.happiness_average);
    } catch (err) {
      console.error(err);
    }
  }

  async createBunny(): Promise<void> {
    if (!this.newBunnyName) return;
    try {
      const res = await fetch('/api/bunnies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: this.newBunnyName })
      });
      if (!res.ok) throw new Error('Failed to create');
      this.newBunnyName = '';
      await this.loadDashboard();
    } catch (err) {
      console.error(err);
    }
  }
}
