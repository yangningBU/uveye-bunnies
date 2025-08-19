import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
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
  templateUrl: './bunny-detail.html',
})
export class BunnyDetail {
  private route = new ActivatedRoute();

  bunny = signal<BunnyDetailModel | null>(null);
  otherBunnies = signal<{ id: string; name: string }[]>([]);
  selectedFriendId: string = '';

  async ngOnInit(): Promise<void> {
    this.route.paramMap.subscribe(async (params: ParamMap) => {
      const id = params.get('id');
      if (id) {
        await this.reload(id);
      }
    })
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
