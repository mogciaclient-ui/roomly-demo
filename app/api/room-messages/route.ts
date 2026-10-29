import {adminDb} from "@/lib/firebase-admin";
import {requireGuestSession} from "@/lib/guest-session";

export async function GET(request:Request){
 try{
  const session=await requireGuestSession(request);
  const snapshot=await adminDb.collection(`facilities/${session.facilityId}/threads/${session.threadId}/messages`).orderBy("createdAt","asc").limit(300).get();
  return Response.json({messages:snapshot.docs.map(document=>{const message=document.data();return{id:document.id,from:message.from,text:message.text,source:message.source??null,staffName:message.staffName??null,createdAt:message.createdAt?.toMillis?.()??Date.now()}})});
 }catch(error){
  const expired=error instanceof Error&&error.message==="SESSION_EXPIRED";
  return Response.json({error:expired?"session_expired":"messages_failed"},{status:expired?403:500});
 }
}
