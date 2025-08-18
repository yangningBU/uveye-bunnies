import { environment } from './environments/environment';

async function createNewBunny(name: string) {
  const url = `${environment.apiUrl}/api/bunnies`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error('Failed to create bunny.');
}

async function getDashboardData() {
  const url = `${environment.apiUrl}/dashboard`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load dashboard');
  }

  return response.json();
}

export { createNewBunny, getDashboardData };