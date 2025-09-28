import {initializeApp} from "firebase-admin/app";
import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {setGlobalOptions} from "firebase-functions/v2/options";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

initializeApp();
const db = getFirestore();
setGlobalOptions({region: "us-central1", maxInstances: 10});

export const helloWorld = onRequest(async (request, response) => {
  try {
    const docRef = db.collection("appContent").doc("hello");
    const snapshot = await docRef.get();

    let message: string | undefined = snapshot.data()?.message as string | undefined;

    if (!snapshot.exists || !message) {
      message = "Hello world";
      logger.info("Seeding default hello world message");
      await docRef.set(
        {
          message,
          updatedAt: FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    }

    response.set("Cache-Control", "private, max-age=60");
    response.status(200).json({message});
  } catch (error) {
    logger.error("Failed to read hello world message", error);
    response.status(500).json({message: "Unable to read from Firestore"});
  }
});
