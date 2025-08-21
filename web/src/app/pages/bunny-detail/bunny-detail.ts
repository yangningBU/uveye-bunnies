import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  // ActivatedRoute,
  // ParamMap,
  RouterLink,
} from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Functions, httpsCallable } from '@angular/fire/functions';
import _ from 'lodash';
import type {
  BunnyDetailModel,
  BunnyListItem,
  DashboardResponse
} from "../../types";

@Component({
  selector: 'app-bunny-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './bunny-detail.html',
})
export class BunnyDetail {
  // private route = new ActivatedRoute();

  bunnyId = '';
  bunny = signal<BunnyDetailModel | null>(null);
  otherBunnies = signal<{ id: string; name: string }[]>([]);
  loading = signal(true);
  selectedFriendId: string = '';

  functions = inject(Functions);

  async ngOnInit(): Promise<void> {
    /* This keeps throwing the following error on page load even
    though the redirect from the dashboard page suceeds:

    this.route.paramMap.subscribe(async (params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        this.bunnyId = id;
        await this.reload(id);
      }
    })

    app.routes.ts:5 ERROR TypeError: Cannot read properties of undefined (reading 'pipe')
    at get paramMap (router2.mjs:2272:36)
    at _BunnyDetail.<anonymous> (bunny-detail.ts:29:16)
    at Generator.next (<anonymous>)
    at chunk-C4KO2HLL.js:18:61
    at new ZoneAwarePromise (zone.js:2701:25)
    at __async (chunk-C4KO2HLL.js:2:10)
    at _BunnyDetail.ngOnInit (bunny-detail.ts:27:17)

    So I'm ignoring the normal routing strategy and using vanilla JS
    for now until I can figure out why the ActivatedRoute isn't being
    initialized properly.
    */
    const pathSegments = window.location.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    this.bunnyId = id;
    await this.reload(id);
  }

  private async reload(id: string): Promise<void> {
    this.loading.set(true);
    try {
      const getBunny = httpsCallable<unknown, BunnyDetailModel>(this.functions, 'getBunny');
      const bunnyResponse = await getBunny({id});
      const bunnyData = bunnyResponse.data;
      if (_.isEmpty(bunnyData)) {
        throw new Error(`Failed to load bunny: ${bunnyResponse}`);
      }

      this.bunny.set(bunnyData);

      const getDashboard = httpsCallable<unknown, DashboardResponse>(this.functions, 'dashboard');
      const dashboardResponse = await getDashboard();
      const dashboardData = dashboardResponse.data;
      if (_.isEmpty(dashboardData)) {
        throw new Error(`Error retrieving dashboard contents: ${dashboardResponse}`);
      }

      this.otherBunnies.set(dashboardData.bunnies.filter((b: BunnyListItem) => b.id !== id));
    } catch (err) {
      console.error(err);
      // FIXME: setError here
    } finally {
      this.loading.set(false);
    }
  }

  async increment(type: 'INC_CARROT_EATEN' | 'INC_LETTUCE_EATEN'): Promise<void> {
    if (!this.bunny()) return;
    try {
      // FIXME change bunny.carrotsEaten event to bunny.carrotEaten;
      const eventType = type === 'INC_CARROT_EATEN' ?
        'bunny.carrotsEaten':
        'bunny.lettuceEaten';
      const logEventCallable = httpsCallable<{ eventType: string, bunnyId: string }, { count: number, happiness: number }>(this.functions, 'recordBunnyEvent');
      const updatedResult = await logEventCallable({ eventType, bunnyId: this.bunnyId });
      const count = updatedResult.data.count;
      const newHappiness = updatedResult.data.happiness;
      if (!_.isNumber(count) || !_.isNumber(newHappiness)) {
        throw new Error('Failed to record event.');
      }

      const field = type === 'INC_CARROT_EATEN' ? 'carrotsEaten' : 'lettuceEaten';
      const current = this.bunny();
      if (current) {
        this.bunny.set({ ...current, [field]: count, happiness: newHappiness });
      }
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
