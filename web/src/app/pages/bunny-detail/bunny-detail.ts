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
  BunnyNameAndId,
  EatSomethingRequest,
  LogEventResult,
  PlayDateEventRequest,
} from "../../types";

@Component({
  selector: 'app-bunny-detail',
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './bunny-detail.html',
  styles: `
    .increment-button {
      height: 30px;
      width: 30px;
      padding: 0;
    }
  `
})
export class BunnyDetail {
  // private route = new ActivatedRoute();

  bunnyId = '';
  bunny = signal<BunnyDetailModel | null>(null);
  otherBunnies = signal<{ id: string; name: string }[]>([]);
  pageLoading = signal(true);
  carrotsLoading = signal(false);
  lettuceLoading = signal(false);
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
    this.pageLoading.set(true);
    try {
      const getBunny = httpsCallable<{id: string}, BunnyDetailModel>(this.functions, 'getBunny');
      const bunnyResponse = await getBunny({id});
      const bunnyData = bunnyResponse.data;
      if (_.isEmpty(bunnyData)) {
        throw new Error(`Failed to load bunny: ${bunnyResponse}`);
      }

      this.bunny.set(bunnyData);

      const getBunnyNames = httpsCallable<void, BunnyNameAndId[]>(this.functions, 'getBunnyNames');
      const nameResponse = await getBunnyNames();
      const nameData = nameResponse.data;
      if (_.isEmpty(nameData)) {
        throw new Error(`Error retrieving bunny names: ${nameResponse}`);
      }

      this.otherBunnies.set(nameData.filter((b: BunnyNameAndId) => b.id !== id));
    } catch (err) {
      console.error(err);
      // FIXME: setError here
    } finally {
      this.pageLoading.set(false);
    }
  }

  async increment(type: 'INC_CARROT_EATEN' | 'INC_LETTUCE_EATEN'): Promise<void> {
    if (!this.bunny()) return;

    if (type === 'INC_CARROT_EATEN') {
      this.carrotsLoading.set(true);
    } else {
      this.lettuceLoading.set(true);
    }

    try {
      const eventType = type === 'INC_CARROT_EATEN' ?
        'bunny.carrotsEaten':
        'bunny.lettuceEaten';
      const logEventCallable = httpsCallable<EatSomethingRequest, LogEventResult>(this.functions, 'recordBunnyEvent');
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
    } finally {
      if (type === 'INC_CARROT_EATEN') {
        this.carrotsLoading.set(false);
      } else {
        this.lettuceLoading.set(false);
      }
    }
  }

  async recordPlayDate(): Promise<void> {
    if (!this.bunny() || !this.selectedFriendId) return;
    try {
      const eventType = 'bunny.playDateHad';
      const recordPlayDateEvent = httpsCallable<PlayDateEventRequest, LogEventResult>(this.functions, 'recordBunnyEvent');
      const updatedResult = await recordPlayDateEvent({
        eventType,
        bunnyId: this.bunnyId,
        otherBunnyId: this.selectedFriendId,
      });
      const count = updatedResult.data.count;
      const newHappiness = updatedResult.data.happiness;
      if (!_.isNumber(count) || !_.isNumber(newHappiness)) {
        throw new Error('Failed to record event.');
      }

      const current = this.bunny();
      if (current) {
        this.bunny.set({ ...current, playDatesHad: count, happiness: newHappiness });
      }
      this.selectedFriendId = '';
    } catch (err) {
      console.error(err);
    }
  }
}
