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

setGlobalOptions({
  maxInstances: 10,
  region: "me-west1",
});

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

function setCorsHeaders(res) {
  const frontendUrl = process.env.FUNCTIONS_EMULATOR ?
    "http://localhost:4200" :
    "https://uveye-bunnies.web.app";

  res.set("Access-Control-Allow-Origin", frontendUrl);
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
  res.set("Access-Control-Max-Age", "5");
}

function safelyHandleOptionsAndCors(req, res, handler) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(200).send();
  }
  handler(db, req, res);
}

export const health = onRequest({ cors: true }, (_req, res) => (
  res.json({ ok: true })
));

export const dashboard = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, getDashboardHandler);
});

export const getBunny = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, getBunnyHandler);
});

export const getBunnyNames = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, getBunnyNamesHandler);
});

export const recordBunnyEvent = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, bunnyEventHandler);
});

export const createBunny = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, createBunnyHandler);
});

export const getConfig = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, getConfigHandler);
});

export const setConfig = onRequest((req, res) => {
  safelyHandleOptionsAndCors(req, res, setConfigHandler);
});

export const onCreateTrigger = onDocumentWritten(
  "events/{eventId}",
  (event) => onCreateListener(db, event),
);
