import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Functions, httpsCallable } from '@angular/fire/functions';
import type { BunnyListItem, DashboardResponse } from "../../types";

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  functions = inject(Functions);

  loading = signal<boolean>(true);
  error = signal<string>("");

  // FIXME: should these be Observables?
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
    this.error.set("");

    try {
      const data = await this.#getDashboardData();
      this.bunnies.set(data.bunnies);
      this.totalCount.set(data.bunniesCount);
      this.averageHappiness.set(data.happinessAverage);
    } catch (err: unknown) {
      console.error(err);
      this.error.set((err as string).toString());
    } finally {
      this.loading.update(() => false);
    }
  }

  async createBunny(): Promise<void> {
    if (!this.newBunnyName) return;

    this.error.set("");
    this.loading.update(() => true);
    try {
      await this.#createNewBunny();
    } catch (err) {
      console.error(err);
      this.error.set((err as string).toString());
    } finally {
      this.newBunnyName = '';
      this.loading.update(() => false);
    }
  }

  async #getDashboardData(): Promise<DashboardResponse> {
    const getDashboard = httpsCallable<unknown, DashboardResponse>(this.functions, 'dashboard');
    const response = await getDashboard();
    return response.data;
  }

  async #createNewBunny() {
    const name = this.newBunnyName;
    const createBunnyCallable = httpsCallable<{ name: string }, BunnyListItem>(this.functions, 'createBunny');
    const newBunnyResult = await createBunnyCallable({ name });
    this.bunnies.update(bs => [...bs, newBunnyResult.data]);
    const currentTotal = this.totalCount();
    console.log("currentTotal:", currentTotal);
    this.totalCount.update(count => count + 1);
    console.log("newTotal:", this.totalCount());
    this.averageHappiness.update(currentAverage => {
      const newAverage = ((currentAverage * currentTotal) + newBunnyResult.data.happinessCount) / this.totalCount();
      console.log("newAverage:", newAverage);
      return newAverage;
    });
  }
}
