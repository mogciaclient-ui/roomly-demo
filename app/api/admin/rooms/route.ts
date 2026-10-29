import {randomBytes,randomUUID} from "crypto";
import {FieldValue,Timestamp} from "firebase-admin/firestore";
import {adminDb,requireUser} from "@/lib/firebase-admin";

async function authorize(request:Request,facilityId:string){
 const user=await requireUser(request);
 const [staff,facility]=await Promise.all([adminDb.doc(`staff/${user.uid}`).get(),adminDb.doc(`facilities/${facilityId}`).get()]);
 if(!staff.exists)throw new Error("FORBIDDEN");
 if(!facility.exists)throw new Error("FORBIDDEN");
 return {staffId:user.uid};
}

export async function GET(request:Request){
 try{
  const params=new URL(request.url).searchParams,facilityId=params.get("facilityId")??"",includeStays=params.get("includeStays")==="1";
  if(!facilityId)return Response.json({error:"invalid_facility"},{status:400});
  await authorize(request,facilityId);
  const [roomsSnap,staysSnap]=await Promise.all([adminDb.collection(`facilities/${facilityId}/rooms`).orderBy("roomNumber").get(),includeStays?adminDb.collection(`facilities/${facilityId}/stays`).orderBy("validFrom","desc").limit(200).get():Promise.resolve(null)]);
  return Response.json({
   rooms:roomsSnap.docs.map(doc=>({id:doc.id,roomNumber:doc.data().roomNumber,roomToken:doc.data().roomToken??null})),
   stays:staysSnap?.docs.map(doc=>{const data=doc.data();return {id:doc.id,roomNumber:data.roomNumber,guests:data.guests??1,language:data.language??"ja",guestName:data.guestName??"",memo:data.memo??"",validFrom:data.validFrom?.toMillis?.(),validUntil:data.validUntil?.toMillis?.(),active:data.active!==false}})??[],
  });
 }catch(error){
  const message=error instanceof Error?error.message:"";
  return Response.json({error:message==="UNAUTHORIZED"?"unauthorized":"forbidden"},{status:message==="UNAUTHORIZED"?401:403});
 }
}

export async function POST(request:Request){
 try{
  const body=await request.json();
  const facilityId=typeof body.facilityId==="string"?body.facilityId:"";
  if(!facilityId)return Response.json({error:"invalid_facility"},{status:400});
  await authorize(request,facilityId);

  if(body.action==="registerRooms"){
   const roomNumbers:string[]=Array.isArray(body.roomNumbers)?[...new Set<string>(body.roomNumbers.map((value:unknown)=>String(value).trim()).filter(Boolean))]:[];
   if(!roomNumbers.length||roomNumbers.length>100||roomNumbers.some(x=>x.length>20))return Response.json({error:"invalid_rooms"},{status:400});
   const roomDocs=await Promise.all(roomNumbers.map(roomNumber=>adminDb.doc(`facilities/${facilityId}/rooms/${encodeURIComponent(roomNumber)}`).get()));
   const batch=adminDb.batch();
   for(let index=0;index<roomNumbers.length;index++){
    const roomNumber=roomNumbers[index],roomId=encodeURIComponent(roomNumber),current=roomDocs[index];
    const roomToken=typeof current.data()?.roomToken==="string"?current.data()!.roomToken:randomBytes(24).toString("base64url");
    const roomRef=adminDb.doc(`facilities/${facilityId}/rooms/${roomId}`);
    batch.set(roomRef,{roomNumber,roomToken,active:true,updatedAt:FieldValue.serverTimestamp(),createdAt:current.exists?current.data()?.createdAt??FieldValue.serverTimestamp():FieldValue.serverTimestamp()},{merge:true});
    batch.set(adminDb.doc(`roomTokens/${roomToken}`),{facilityId,roomId,roomNumber,type:"room",active:true,createdAt:FieldValue.serverTimestamp()},{merge:true});
   }
   await batch.commit();
   return Response.json({registered:roomNumbers.length});
  }

  if(body.action==="issueStay"){
   const roomNumber=typeof body.roomNumber==="string"?body.roomNumber.trim():"";
   const validFromMs=Date.parse(body.validFrom);
   const validUntilMs=Date.parse(body.validUntil);
   const guests=Number(body.guests),language=typeof body.language==="string"?body.language:"";
   const guestName=typeof body.guestName==="string"?body.guestName.trim():"",memo=typeof body.memo==="string"?body.memo.trim():"";
   if(!roomNumber||!Number.isInteger(guests)||guests<1||guests>20||!["ja","en","zh-CN","zh-TW","ko"].includes(language)||guestName.length>100||memo.length>1000||!Number.isFinite(validFromMs)||!Number.isFinite(validUntilMs)||validUntilMs<=validFromMs)return Response.json({error:"invalid_stay"},{status:400});
   const roomId=encodeURIComponent(roomNumber);
   const room=await adminDb.doc(`facilities/${facilityId}/rooms/${roomId}`).get();
   if(!room.exists)return Response.json({error:"room_not_found"},{status:404});
   const sameRoomStays=await adminDb.collection(`facilities/${facilityId}/stays`).where("roomNumber","==",roomNumber).get();
   const overlaps=sameRoomStays.docs.some(doc=>{const data=doc.data();const from=data.validFrom?.toMillis?.(),until=data.validUntil?.toMillis?.();return data.active!==false&&Number.isFinite(from)&&Number.isFinite(until)&&validFromMs<until&&validUntilMs>from});
   if(overlaps)return Response.json({error:"stay_overlap"},{status:409});
   const stayId=randomUUID();
   const validFrom=Timestamp.fromMillis(validFromMs),validUntil=Timestamp.fromMillis(validUntilMs);
   const batch=adminDb.batch();
   batch.set(adminDb.doc(`facilities/${facilityId}/stays/${stayId}`),{facilityId,roomId,roomNumber,guests,language,guestName,memo,validFrom,validUntil,active:true,createdAt:FieldValue.serverTimestamp()});
   await batch.commit();
   return Response.json({stay:{id:stayId,roomNumber,guests,language,guestName,memo,validFrom:validFromMs,validUntil:validUntilMs,active:true}});
  }

  if(body.action==="updateStay"){
   const stayId=typeof body.stayId==="string"?body.stayId:"",roomNumber=typeof body.roomNumber==="string"?body.roomNumber.trim():"";
   const validFromMs=Date.parse(body.validFrom),validUntilMs=Date.parse(body.validUntil);
   const guests=Number(body.guests),language=typeof body.language==="string"?body.language:"";
   const guestName=typeof body.guestName==="string"?body.guestName.trim():"",memo=typeof body.memo==="string"?body.memo.trim():"";
   if(!stayId||!roomNumber||!Number.isInteger(guests)||guests<1||guests>20||language!=="ja"||guestName.length>100||memo.length>1000||!Number.isFinite(validFromMs)||!Number.isFinite(validUntilMs)||validUntilMs<=validFromMs)return Response.json({error:"invalid_stay"},{status:400});
   const stayRef=adminDb.doc(`facilities/${facilityId}/stays/${stayId}`),existing=await stayRef.get();
   if(!existing.exists||existing.data()?.roomNumber!==roomNumber)return Response.json({error:"stay_not_found"},{status:404});
   const sameRoomStays=await adminDb.collection(`facilities/${facilityId}/stays`).where("roomNumber","==",roomNumber).get();
   const overlaps=sameRoomStays.docs.some(doc=>{if(doc.id===stayId)return false;const data=doc.data();const from=data.validFrom?.toMillis?.(),until=data.validUntil?.toMillis?.();return data.active!==false&&Number.isFinite(from)&&Number.isFinite(until)&&validFromMs<until&&validUntilMs>from});
   if(overlaps)return Response.json({error:"stay_overlap"},{status:409});
   const validFrom=Timestamp.fromMillis(validFromMs),validUntil=Timestamp.fromMillis(validUntilMs);
   await stayRef.set({guests,language,guestName,memo,validFrom,validUntil,updatedAt:FieldValue.serverTimestamp()},{merge:true});
   return Response.json({stay:{id:stayId,roomNumber,guests,language,guestName,memo,validFrom:validFromMs,validUntil:validUntilMs,active:true}});
  }

  return Response.json({error:"invalid_action"},{status:400});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  return Response.json({error:message==="UNAUTHORIZED"?"unauthorized":"forbidden"},{status:message==="UNAUTHORIZED"?401:403});
 }
}
