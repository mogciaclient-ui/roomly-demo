import {FieldValue,Timestamp} from "firebase-admin/firestore";
import {adminDb,requireUser} from "@/lib/firebase-admin";

const defaultRichMenu=[
 {label:"Wi-Fi",icon:"⌁",prompt:"Wi-FiのSSIDとパスワードを教えてください",type:"question",description:"接続方法"},
 {label:"館内案内",icon:"⌂",prompt:"館内施設と営業時間を教えてください",type:"question",description:"施設・営業時間"},
 {label:"アメニティ",icon:"＋",prompt:"利用できるアメニティを教えてください",type:"question",description:"備品のご案内"},
 {label:"タクシー",icon:"◇",prompt:"タクシーを手配してください",type:"request",description:"スタッフへ依頼"},
 {label:"周辺案内",icon:"◎",prompt:"周辺のおすすめやコンビニを教えてください",type:"question",description:"近隣スポット"},
 {label:"フロント",icon:"◉",prompt:"スタッフに相談したいです",type:"request",description:"有人対応へ"},
] as const;

export async function POST(request:Request){
 try{
  const user=await requireUser(request);
  const {roomToken}=await request.json();
  if(typeof roomToken!=="string"||roomToken.length>160)return Response.json({error:"invalid_token"},{status:400});
  const snap=await adminDb.doc(`roomTokens/${roomToken}`).get();
  if(!snap.exists||snap.data()?.active!==true)return Response.json({error:"invalid_token"},{status:404});
  const data=snap.data()!;
  const now=Date.now();
  const stays=await adminDb.collection(`facilities/${data.facilityId}/stays`).where("roomNumber","==",data.roomNumber).get();
  const activeStay=stays.docs.find(doc=>{const stay=doc.data();return stay.active!==false&&stay.validFrom instanceof Timestamp&&stay.validUntil instanceof Timestamp&&stay.validFrom.toMillis()<=now&&now<stay.validUntil.toMillis()});
  if(!activeStay)return Response.json({error:"outside_stay_period"},{status:403});
  const stay=activeStay.data(),validFrom=stay.validFrom as Timestamp,validUntil=stay.validUntil as Timestamp;
  const stayId=activeStay.id,threadId=`stay-${stayId}`;
  const [facilitySnap,roomSnap]=await Promise.all([
   adminDb.doc(`facilities/${data.facilityId}`).get(),
   adminDb.doc(`facilities/${data.facilityId}/rooms/${data.roomId}`).get(),
  ]);
  const facility=facilitySnap.data()??{},room=roomSnap.data()??{};
  await adminDb.doc(`guestSessions/${user.uid}`).set({uid:user.uid,roomToken,stayId,facilityId:data.facilityId,roomId:data.roomId,threadId,active:true,createdAt:FieldValue.serverTimestamp(),expiresAt:validUntil});
  const nights=Math.max(1,Math.ceil((validUntil.toMillis()-validFrom.toMillis())/86400000));
  await adminDb.doc(`facilities/${data.facilityId}/threads/${threadId}`).set({stayId,roomId:data.roomId,roomNumber:room.roomNumber??data.roomNumber,guestName:stay.guestName||"ゲスト様",guests:stay.guests??1,nights,language:stay.language??"ja",handoverNote:stay.memo??"",status:"ai",lastMessageAt:FieldValue.serverTimestamp(),unreadByStaff:0},{merge:true});
  const configuredMenu=Array.isArray(facility.richMenu)?facility.richMenu:[];
  return Response.json({facilityId:data.facilityId,roomId:data.roomId,threadId,facilityName:facility.name??"宿泊施設",roomNumber:room.roomNumber??data.roomNumber,language:stay.language??"ja",richMenu:configuredMenu.length>0?configuredMenu:defaultRichMenu,richMenuImageUrl:configuredMenu.length>0?null:"/guest-rich-menu-default.svg",staffHours:facility.staffHours??[],validFrom:validFrom.toMillis(),expiresAt:validUntil.toMillis()});
 }catch(error){
  const unauthorized=error instanceof Error&&error.message==="UNAUTHORIZED";
  return Response.json({error:unauthorized?"unauthorized":"session_failed"},{status:unauthorized?401:500});
 }
}
