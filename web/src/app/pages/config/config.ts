import _ from "lodash";
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { ConfigDetail } from '../../types';

@Component({
  selector: 'app-config',
  imports: [CommonModule, FormsModule],
  templateUrl: "./config.html",
})
export class Config {
  loading = signal<boolean>(false);
  pointsCarrotsEaten = 0;
  pointsLettuceEaten = 0;
  pointsPlayDatesHad = 0;
  eventCountTriggerForSnapshot = 0;
  functions = inject(Functions);

  async ngOnInit(): Promise<void> {
    try {
      this.loading.set(true);
      const getConfig = httpsCallable<void, ConfigDetail>(this.functions, 'getConfig');
      const configResponse = await getConfig();
      const configData = configResponse.data;
      if (_.isEmpty(configData)) {
        throw new Error(`Failed to load config: ${configResponse}`);
      }
      const {
        pointsCarrotsEaten,
        pointsLettuceEaten,
        pointsPlayDatesHad,
        eventCountTriggerForSnapshot,
      } = configData;
      this.pointsCarrotsEaten = pointsCarrotsEaten;
      this.pointsLettuceEaten = pointsLettuceEaten;
      this.pointsPlayDatesHad = pointsPlayDatesHad;
      this.eventCountTriggerForSnapshot = eventCountTriggerForSnapshot;
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  async saveConfig(): Promise<void> {
    try {
      this.loading.set(true);
      const setConfig = httpsCallable<ConfigDetail, ConfigDetail>(this.functions, 'setConfig');
      const updatedResult = await setConfig({
        pointsCarrotsEaten: this.pointsCarrotsEaten,
        pointsLettuceEaten: this.pointsLettuceEaten,
        pointsPlayDatesHad: this.pointsPlayDatesHad,
        eventCountTriggerForSnapshot: this.eventCountTriggerForSnapshot,
      });
      console.log("Updated config is:", updatedResult);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}
