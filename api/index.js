import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dashboardFunction from "./functions/dashboard.js";
import serviceAccount from "./credentials.json" with { type: "json" };

setGlobalOptions({
  maxInstances: 10,
  region: "me-west1",
});

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

export const dashboard = onRequest(
  (req, res) => dashboardFunction(db, req, res),
);
