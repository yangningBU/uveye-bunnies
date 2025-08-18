import { environment } from './environments/environment';
import { inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

async function createNewBunny(name: string) {
  // Try Firebase Callable first
  try {
    const functions = inject(Functions);
    const createBunny = httpsCallable<{ name: string }, unknown>(functions, 'createBunny');
    await createBunny({ name });
    return;
  } catch (_err) {
    // Fallback to HTTP endpoint
    const url = `${environment.apiUrl}/bunnies`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to create bunny.');
  }
}

async function getDashboardData() {
  // Try Firebase Callable first
  try {
    const functions = inject(Functions);
    const getDashboard = httpsCallable<unknown, any>(functions, 'dashboard');
    const result = await getDashboard({});
    return result.data;
  } catch (_err) {
    // Fallback to HTTP endpoint
    const url = `${environment.apiUrl}/dashboard`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to load dashboard');
    }

    return response.json();
  }
}

export { createNewBunny, getDashboardData };