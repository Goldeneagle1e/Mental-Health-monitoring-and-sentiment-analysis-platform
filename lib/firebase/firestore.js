import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";

// The canvas environment provides necessary global variables for Firebase setup.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// --- FIREBASE INITIALIZATION ---
// Initialize Firebase only once
let app;
let db;

try {
    if (Object.keys(firebaseConfig).length > 0) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        
        // Optional: Log app details for debugging
        console.log("Firebase App Initialized:", appId);
    } else {
        console.warn("Firebase configuration is missing. Data persistence will not work.");
    }
} catch (e) {
    console.error("Error initializing Firebase:", e);
}


/**
 * Constructs the Firestore collection path for analysis results.
 * We are using the public collection path because analysis results
 * might be viewed by different people or shared (e.g., historical review).
 * @returns {string} The full collection path.
 */
function getCollectionPath() {
    // Structure: /artifacts/{appId}/public/data/analysis_results
    return `artifacts/${appId}/public/data/analysis_results`;
}

/**
 * Saves a new analysis result document to the Firestore database.
 * @param {object} resultData - The analysis result object to save.
 * @returns {Promise<string>} A promise that resolves with the ID of the new document.
 */
export async function saveAnalysisResult(resultData) {
    if (!db) {
        console.error("Database is not initialized. Cannot save result.");
        throw new Error("Database service unavailable.");
    }

    try {
        const path = getCollectionPath();
        const analysisCollection = collection(db, path);

        // Ensure the timestamp is set on the server side for accuracy
        const docRef = await addDoc(analysisCollection, {
            ...resultData,
            timestamp: serverTimestamp(), // Use serverTimestamp for accuracy
            appId: appId
        });

        console.log("Analysis saved with ID:", docRef.id);
        return docRef.id;

    } catch (e) {
        console.error("Error saving analysis result to Firestore:", e);
        throw new Error("Failed to save data to database.");
    }
}
