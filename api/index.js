import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

import onCreateListener from "./listeners/onCreateListener.js";
import createBunnyHandler from "./endpoints/createBunnyHandler.js";
import getDashboardHandler from "./endpoints/getDashboardHandler.js";
import serviceAccount from "./credentials.json" with { type: "json" };
import { setCorsHeaders } from "./utilities.js";

setGlobalOptions({
  maxInstances: 10,
  region: "me-west1",
});

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

export const health = onRequest({ cors: true }, (_req, res) => (
  res.json({ ok: true })
));

export const dashboard = onRequest((req, res) => {
  setCorsHeaders(res);
  getDashboardHandler(db, req, res);
});

export const createBunny = onRequest((req, res) => {
  setCorsHeaders(res);
  createBunnyHandler(db, req, res);
});

export const onCreateTrigger = onDocumentWritten(
  "events",
  (event) => onCreateListener(db, event),
);
