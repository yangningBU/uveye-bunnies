import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { environment } from '../../../environments/environment';
import type { BunnyListItem, DashboardResponse } from "../../types";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  newBunnyName = '';

  bunnies = signal<BunnyListItem[]>([]);
  totalCount = signal<number>(0);
  averageHappiness = signal<number>(0);
  loading = signal<boolean>(true);
  error = signal<string>("");
  
  functions = inject(Functions);

  sanitizeName(): void {
    this.newBunnyName = this.newBunnyName.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    try {
      const data = await this.#getDashboardData();
      const { bunnies, bunniesCount, happinessAverage } = data;
      this.bunnies.set(bunnies);
      this.totalCount.set(bunniesCount);
      this.averageHappiness.set(happinessAverage);
    } catch (err: unknown) {
      console.error(err);
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.loading.update(() => false);
    }
  }

  async createBunny(): Promise<void> {
    if (!this.newBunnyName) return;

    this.loading.update(() => true);
    try {
      await this.#createNewBunny();
    } catch (err) {
      console.error(err);
    } finally {
      this.newBunnyName = '';
    }

    // FIXME: Performance - just add the new bunny to the list
    // instead of reloading the entire dashboard.
    await this.loadDashboard();
  }

  async #getDashboardData(): Promise<DashboardResponse> {
    const getDashboard = httpsCallable<unknown, DashboardResponse>(this.functions, 'dashboard');
    const response = await getDashboard();
    return response.data;
  }

  async #createNewBunny() {
    const name = this.newBunnyName;
    // Try Firebase Callable first
    try {
      const createBunny = httpsCallable<{ name: string }, unknown>(this.functions, 'createBunny');
      await createBunny({ name });
      return;
    } catch (err) {
      console.error(err);
      // // Fallback to HTTP endpoint
      // const url = `${environment.apiUrl}/bunnies`;
      // const res = await fetch(url, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name })
      // });
      // if (!res.ok) throw new Error('Failed to create bunny.');
    }
  }
}
