import {applicationDefault,initializeApp} from "firebase-admin/app";import {getAuth} from "firebase-admin/auth";
const [email,hotelId="demo-hotel"]=process.argv.slice(2);if(!email){console.error("Usage: npm run staff:claim -- staff@example.com demo-hotel");process.exit(1)}
const auth=getAuth(initializeApp({credential:applicationDefault(),projectId:"roomly-demo"}));const user=await auth.getUserByEmail(email);await auth.setCustomUserClaims(user.uid,{hotelId,role:"hotel_staff"});console.log(`hotelId claim set for ${email}. Sign in again to refresh the token.`);
