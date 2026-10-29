import {createHash,randomBytes,randomUUID} from "crypto";
import {FieldValue,Timestamp} from "firebase-admin/firestore";
import {adminAuth,adminDb,requireUser} from "@/lib/firebase-admin";
import {rejectUnsafeRequest} from "@/lib/request-security";

const TRIAL_DURATION_MS=7*24*60*60*1000;
const sampleInfo={
 wifi:"利用場所: 全館\nWi-Fi名（SSID）: Roomly-Guest\nパスワード: roomly2026\n接続できない場合: Wi-Fiを一度オフにしてから再接続してください。",
 bath:"利用時間: 15:00〜23:00 / 6:00〜10:00\n場所: 1階 大浴場\n最終入場: 終了30分前です。",
 breakfast:"提供時間: 7:00〜9:00\n場所: 1階 お食事処\n最終入場: 8:30です。",
 checkout:"チェックアウト時刻: 10:00\n手続き場所: 1階フロント\n鍵はフロントへご返却ください。",
 parking:"無料駐車場をご利用いただけます。満車の場合はフロントへお声がけください。",
 shuttle:"送迎をご希望の場合は、希望時刻と人数をスタッフへお知らせください。",
 emergency:"火災・救急など命に関わる場合は119番へ連絡し、あわせてフロントへお知らせください。",
};

function hashToken(token:string){return createHash("sha256").update(token).digest("hex")}

export async function POST(request:Request){
 try{
  const rejected=rejectUnsafeRequest(request,8192);if(rejected)return rejected;
  const body=await request.json();
  if(body.action==="create"){
   const creator=await requireUser(request);
   if(creator.trial===true)throw new Error("FORBIDDEN");
   const staff=await adminDb.doc(`staff/${creator.uid}`).get();
   if(!staff.exists||staff.data()?.active!==true)throw new Error("FORBIDDEN");
   const uid=`trial_${randomUUID().replaceAll("-","")}`;
   const facilityId=`trial-${randomUUID()}`;
   const token=randomBytes(32).toString("base64url");
   const expiresAt=Timestamp.fromMillis(Date.now()+TRIAL_DURATION_MS);
   await adminAuth.createUser({uid,displayName:"体験ユーザー"});
   await adminAuth.setCustomUserClaims(uid,{trial:true,facilityId,trialExpiresAt:expiresAt.toMillis()});
   const batch=adminDb.batch();
   batch.set(adminDb.doc(`staff/${uid}`),{active:true,trial:true,facilityId,displayName:"体験ユーザー",createdBy:creator.uid,createdAt:FieldValue.serverTimestamp(),expiresAt});
   batch.set(adminDb.doc(`facilities/${facilityId}`),{name:"Roomly 体験施設",address:"",staffHours:[{start:"08:00",end:"11:00"},{start:"15:00",end:"21:00"}],richMenu:[],trial:true,accessType:"trial",createdAt:FieldValue.serverTimestamp(),expiresAt});
   batch.set(adminDb.doc(`facilities/${facilityId}/info/main`),sampleInfo);
   for(const roomNumber of ["101","102","103"]){
    const roomId=encodeURIComponent(roomNumber),roomToken=randomBytes(24).toString("base64url");
    batch.set(adminDb.doc(`facilities/${facilityId}/rooms/${roomId}`),{roomNumber,roomToken,active:true,createdAt:FieldValue.serverTimestamp()});
    batch.set(adminDb.doc(`roomTokens/${roomToken}`),{facilityId,roomId,roomNumber,type:"room",active:true,trial:true,expiresAt,createdAt:FieldValue.serverTimestamp()});
   }
   batch.set(adminDb.doc(`trialInvites/${hashToken(token)}`),{uid,facilityId,active:true,expiresAt,createdBy:creator.uid,createdAt:FieldValue.serverTimestamp()});
   await batch.commit();
   return Response.json({token,expiresAt:expiresAt.toMillis()});
  }
  if(body.action==="exchange"){
   const token=typeof body.token==="string"?body.token:"";
   if(token.length<40||token.length>100||!/^[A-Za-z0-9_-]+$/.test(token))return Response.json({error:"invalid_link"},{status:400});
   const invite=await adminDb.doc(`trialInvites/${hashToken(token)}`).get(),data=invite.data();
   if(!invite.exists||data?.active!==true||!(data.expiresAt instanceof Timestamp)||data.expiresAt.toMillis()<=Date.now())return Response.json({error:"expired_link"},{status:403});
   const customToken=await adminAuth.createCustomToken(data.uid);
   return Response.json({customToken,expiresAt:data.expiresAt.toMillis()});
  }
  return Response.json({error:"invalid_action"},{status:400});
 }catch(error){
  const message=error instanceof Error?error.message:"";
  return Response.json({error:message==="UNAUTHORIZED"?"unauthorized":message==="FORBIDDEN"?"forbidden":"trial_failed"},{status:message==="UNAUTHORIZED"?401:message==="FORBIDDEN"?403:500});
 }
}
