import {initializeApp} from "firebase-admin/app";
import {setGlobalOptions} from "firebase-functions/v2/options";

initializeApp();
setGlobalOptions({region: "us-central1", maxInstances: 10});

// Cloud Functions will be added here as needed
