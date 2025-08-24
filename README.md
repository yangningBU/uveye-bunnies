# UVeyeBunnies
Homework assignment for UVEye. For details see: `Onboarding Task - UVbunny.pdf`.

Live site hosted at: https://uveye-bunnies.web.app

# Local Dev
### Front-end
```
cd web
npm install
npm run start
```

App runs on port http://localhost:4200.

### Back-end
Endpoints are available at https://me-west1-uveye-bunnies.cloudfunctions.net/<functionName> as indicated in `./api/index.js`.

```
cd api
npm install
```

To make the functions available locally using HTTP parhs which mirror the deployed environment use:
```
npm run serve
```
Functions will be available at http://localhost:5001/uveye-bunnies/me-west1/<functionName>.

To call functions locally in an interactive console:
```
npm run start
```

To use the `db` in a REPL shell run the shell (or start) command and then run these imports:
```
firebase > const { initializeApp, cert } = await import("firebase-admin/app");
firebase > const { getFirestore } = await import("firebase-admin/firestore");
firebase > const { default: serviceAccount } = await import("./credentials.json", { with: { type: "json" } });
firebase > initializeApp({credential: cert(serviceAccount)});
firebase > const db = getFirestore();
```
Then use the `db` freely:
```
firebase > const { getConfig } = await import("./utilities.js");
firebase > const c = await getConfig(db);
firebase > c
{
  pointsCarrotsEaten: 3,
  pointsLettuceEaten: 1,
  pointsPlayDatesHad: 2,
  eventCountTriggerForSnapshot: 100
}
```

# Deployment
```
cd api
npm run deploy
```
This deploys backend "functions" ie the API gateway methods as well as building Angular app in ../web.

# Tests
Use `npm run test`