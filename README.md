# UVeyeBunnies
Homework assignment for UVEye. For details see: `Onboarding Task - UVbunny.pdf`.

Live site hosted at: https://uveye-bunnies.web.app
![Initial Design](https://raw.githubusercontent.com/yangningBU/uveye-bunnies/main/public/UI-sketch.png)

# Local Dev
### Front-end
```
cd web
npm install
npm run start
```

App runs on port http://localhost:4200.

### Back-end
```
cd api
npm install
```

To make the functions available locally using HTTP paths which mirror the deployed environment use:
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

To run the emulator including triggers and not just functions you can run:
```
firebase emulators:start
```
But you will have to install Java to use it. I recommend using [sdkman](https://sdkman.io/).

There is a full firebase interactive UI to manage your data at http://localhost:4000.

# Deployment
```
cd api
npm run deploy
```
This handled deploying the backend functions to the API gateway as well as building the frontend Angular app from `../web`.

Deployed functions are at Ehttps://me-west1-uveye-bunnies.cloudfunctions.net/<functionName> as indicated in `api/index.js`.

Get logs for deployed functions with:
```
firebase functions:log
```
or track them online [here](https://console.cloud.google.com/logs/query;query=resource.type%3D%22cloud_function%22%0Aresource.labels.function_name%3D%22onCreateTrigger%22%0Aresource.labels.region%3D%22me-west1%22;cursorTimestamp=2025-08-25T08:01:16.570171203Z;duration=PT1H?pli=1&project=uveye-bunnies).

# Tests
Use `npm run test`