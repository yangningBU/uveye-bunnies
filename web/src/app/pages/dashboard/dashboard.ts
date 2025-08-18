import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { createNewBunny, getDashboardData } from '../../../api';

interface BunnyListItem {
  id: string;
  name: string;
  happiness: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
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
      const data = await getDashboardData();
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
      await createNewBunny(this.newBunnyName);
    } catch (err) {
      console.error(err);
    } finally {
      this.newBunnyName = '';
    }

    // FIXME: Performance - just add the new bunny to the list
    // instead of reloading the entire dashboard.
    await this.loadDashboard();
  }
}
