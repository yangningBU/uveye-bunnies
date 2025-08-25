import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

import onCreateListener from "./listeners/onCreateListener.js";
import bunnyEventHandler from "./endpoints/bunnyEventHandler.js";
import createBunnyHandler from "./endpoints/createBunnyHandler.js";
import getBunnyHandler from "./endpoints/getBunnyHandler.js";
import getBunnyNamesHandler from "./endpoints/getBunnyNamesHandler.js";
import getConfigHandler from "./endpoints/getConfigHandler.js";
import getDashboardHandler from "./endpoints/getDashboardHandler.js";
import setConfigHandler from "./endpoints/setConfigHandler.js";
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
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  getDashboardHandler(db, req, res);
});

export const getBunny = onRequest((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  getBunnyHandler(db, req, res);
});

export const getBunnyNames = onRequest((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  getBunnyNamesHandler(db, req, res);
});

export const recordBunnyEvent = onRequest((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  bunnyEventHandler(db, req, res);
});

export const createBunny = onRequest((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  createBunnyHandler(db, req, res);
});

export const getConfig = onRequest((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  getConfigHandler(db, req, res);
});

export const setConfig = onRequest((req, res) => {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  setConfigHandler(db, req, res);
});

export const onCreateTrigger = onDocumentWritten(
  "events/{eventId}",
  (event) => onCreateListener(db, event),
);
