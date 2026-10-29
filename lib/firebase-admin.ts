import {applicationDefault,cert,getApps,initializeApp} from "firebase-admin/app";import {getAuth} from "firebase-admin/auth";import {getFirestore} from "firebase-admin/firestore";
function credential(){const json=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;return json?cert(JSON.parse(json)):applicationDefault()}
export const adminApp=getApps()[0]??initializeApp({credential:credential(),projectId:"roomly-demo"});export const adminAuth=getAuth(adminApp);export const adminDb=getFirestore(adminApp);
export async function requireUser(request:Request){const header=request.headers.get("authorization");if(!header?.startsWith("Bearer "))throw new Error("UNAUTHORIZED");const token=header.slice(7);if(token.length>4096)throw new Error("UNAUTHORIZED");return adminAuth.verifyIdToken(token,true)}
