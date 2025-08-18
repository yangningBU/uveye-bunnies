import * as functions from 'firebase-functions';
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

export const api = functions.https.onRequest(app); 