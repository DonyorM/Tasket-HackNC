
const functions = require("firebase-functions");
const auth = require("firebase/auth");

const admin = require("firebase-admin");
var serviceAccount = require("./service.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

exports.getUser = functions.https.onCall(async (data, context) => {
 return admin.auth()
    .getUserByEmail(data.email)
    .then((userRecord) => {
      // See the UserRecord reference doc for the contents of userRecord.
      return { name: userRecord.displayName };
    })
    .catch((error) => {
      console.log("Error fetching user data:", error);
      return { error: "Got an error" };
    });
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
