import {Timestamp} from "firebase-admin/firestore";
import {adminDb} from "./firebase-admin";

export const GUEST_SESSION_COOKIE="roomly_guest_session";
type GuestSession={roomToken:string;stayId:string;facilityId:string;roomId:string;threadId:string;active:boolean;expiresAt:Timestamp};

function cookieValue(request:Request,name:string){
 const cookies=request.headers.get("cookie")??"";
 for(const part of cookies.split(";")){const [key,...value]=part.trim().split("=");if(key===name)return decodeURIComponent(value.join("="))}
 return "";
}

export async function requireGuestSession(request:Request){
 const sessionId=cookieValue(request,GUEST_SESSION_COOKIE);
 if(!/^[A-Za-z0-9_-]{40,100}$/.test(sessionId))throw new Error("SESSION_EXPIRED");
 const snap=await adminDb.doc(`guestSessions/${sessionId}`).get(),session=snap.data() as GuestSession|undefined;
 if(!snap.exists||session?.active!==true||!(session.expiresAt instanceof Timestamp)||session.expiresAt.toMillis()<=Date.now())throw new Error("SESSION_EXPIRED");
 return {sessionId,...session};
}
