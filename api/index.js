import { getFirestore } from "firebase-admin/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp, cert } from "firebase-admin/app";

import getDashboard from "./endpoints/dashboard.js";
import serviceAccount from "./credentials.json" with { type: "json" };

setGlobalOptions({
  maxInstances: 10,
  region: "me-west1",
});

initializeApp({
  credential: cert(serviceAccount),
});

function setCorsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "https://uveye-bunnies.web.app");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

const db = getFirestore();

export const health = onRequest({ cors: true }, (_req, res) => (
  res.json({ ok: true })
));

export const dashboard = onRequest((req, res) => {
  setCorsHeaders(res);
  getDashboard(db, req, res);
});
