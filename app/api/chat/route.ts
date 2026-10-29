import {FieldValue,Timestamp} from "firebase-admin/firestore";
import {adminDb} from "@/lib/firebase-admin";
import {formatKnowledgeAnswer} from "@/lib/format-knowledge";
import {rejectUnsafeRequest} from "@/lib/request-security";
import {requireGuestSession} from "@/lib/guest-session";

const knowledgeRules=[
 {pattern:/wi.?fi|ワイファイ|ssid|パスワード/i,key:"wifi"},
 {pattern:/風呂|温泉|浴場|露天風呂/,key:"bath"},
 {pattern:/朝食|モーニング|朝ごはん/,key:"breakfast"},
 {pattern:/チェックアウト|退館|鍵.*返/,key:"checkout"},
 {pattern:/駐車|パーキング|車/,key:"parking"},
 {pattern:/アメニティ|歯ブラシ|タオル.*場所|貸出/,key:"amenities"},
 {pattern:/館内|売店|自販機|ランドリー|製氷/,key:"facilities"},
 {pattern:/ルームサービス|食事.*部屋|軽食/,key:"roomService"},
 {pattern:/送迎|駅|タクシー|交通/,key:"shuttle"},
 {pattern:/周辺|コンビニ|観光|近く/,key:"nearby"},
 {pattern:/よくある|その他/,key:"faq"},
] as const;
const actionRequest=/持って|追加|予約|変更|手配|呼んで|探して|忘れ物|清掃|故障|壊れ|苦情|スタッフ|お願い|来て/;
const emergencyRequest=/火事|火災|救急|倒れ|閉じ込め|息が|けが|怪我/;

type StaffHours={start:string;end:string};
function toMinutes(value:string){const [hour,minute]=value.split(":").map(Number);return Number.isFinite(hour)&&Number.isFinite(minute)?hour*60+minute:null}
function staffAvailability(hours:StaffHours[],now=new Date()){
 if(hours.length===0)return {open:true,nextLabel:null};
 const parts=new Intl.DateTimeFormat("en-US",{timeZone:"Asia/Tokyo",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(now);
 const current=Number(parts.find(part=>part.type==="hour")?.value)*60+Number(parts.find(part=>part.type==="minute")?.value);
 const periods=hours.map(period=>({...period,startMinutes:toMinutes(period.start),endMinutes:toMinutes(period.end)})).filter((period):period is StaffHours&{startMinutes:number;endMinutes:number}=>period.startMinutes!==null&&period.endMinutes!==null).sort((a,b)=>a.startMinutes-b.startMinutes);
 if(periods.length===0)return {open:true,nextLabel:null};
 const open=periods.some(period=>period.startMinutes<period.endMinutes?current>=period.startMinutes&&current<period.endMinutes:current>=period.startMinutes||current<period.endMinutes);
 if(open)return {open:true,nextLabel:null};
 const today=periods.find(period=>period.startMinutes>current);
 const next=today??periods[0];
 return {open:false,nextLabel:`${today?"本日":"明日"}${next.start.replace(/^0/,"")}以降`};
}

type SheetEntry=Record<string,string>;
function parseHearingSheet(value:unknown):Record<string,SheetEntry[]>{
 if(typeof value!=="string")return {};
 try{return JSON.parse(value) as Record<string,SheetEntry[]>}catch{return {}}
}
function answerFromFreeEntries(text:string,sheet:Record<string,SheetEntry[]>){
 const normalized=text.toLowerCase().replace(/[\s？?。！!]/g,"");
 const faq=(sheet.faq??[]).find(entry=>{const question=(entry.question??"").toLowerCase().replace(/[\s？?。！!]/g,"");return question&&((normalized.includes(question)||question.includes(normalized))||question.split(/[、,・]/).some(part=>part.length>=3&&normalized.includes(part)))});
 if(faq?.answer?.trim())return {answer:faq.answer.trim(),source:"faq"};
 const custom=(sheet.custom??[]).find(entry=>{const label=(entry.label??"").toLowerCase().replace(/\s/g,"");return label&&normalized.includes(label)});
 if(custom?.content?.trim())return {answer:custom.content.trim(),source:"custom"};
 return null;
}

export async function POST(request:Request){
 try{
  const rejected=rejectUnsafeRequest(request,8192);if(rejected)return rejected;
  const session=await requireGuestSession(request);
  const {text}=await request.json();
  if(typeof text!=="string"||!text.trim()||text.length>2000)return Response.json({error:"invalid_message"},{status:400});
  const {facilityId,threadId,roomId}=session;
  const thread=adminDb.doc(`facilities/${facilityId}/threads/${threadId}`);
  const [infoSnap,facilitySnap]=await Promise.all([adminDb.doc(`facilities/${facilityId}/info/main`).get(),adminDb.doc(`facilities/${facilityId}`).get()]);
  const info=infoSnap.data()??{},facility=facilitySnap.data()??{};
  const availability=staffAvailability(Array.isArray(facility.staffHours)?facility.staffHours:[]);
  let reply="",status:"ai"|"waiting"="ai",source:string|null=null,isEmergency=false;
  if(emergencyRequest.test(text)){
   isEmergency=true;
   reply=`緊急の可能性があります。命に関わる場合は、すぐに119番へ連絡してください。\n\n${typeof info.emergency==="string"?formatKnowledgeAnswer("emergency",info.emergency):"客室電話またはホテルの緊急連絡先へご連絡ください。"}`;
   status="waiting";
  }else if(actionRequest.test(text)){
   reply="スタッフによる対応が必要なため、ホテルへお伝えしました。そのままお待ちください。";
   status="waiting";
  }else{
   const sheet=parseHearingSheet(info.hearingSheet);
   const freeAnswer=answerFromFreeEntries(text,sheet);
   const rule=knowledgeRules.find(item=>item.pattern.test(text));
   const answer=freeAnswer?.answer??(rule&&typeof info[rule.key]==="string"?info[rule.key].trim():"");
   if(answer){source=freeAnswer?.source??rule!.key;reply=formatKnowledgeAnswer(source,answer)}else{reply="チャット設定に回答がないため、ホテルのスタッフへ確認します。";status="waiting"}
  }
  const afterHours=status==="waiting"&&!availability.open&&!isEmergency;
  if(afterHours&&!isEmergency)reply=`現在はスタッフ対応時間外です。ご用件はホテルへ送信しました。${availability.nextLabel??"次の対応時間"}にスタッフが確認します。`;
  const batch=adminDb.batch(),createdAt=Date.now();
  batch.set(thread,{roomId,status,afterHours,emergency:isEmergency,nextStaffResponse:afterHours?availability.nextLabel:null,lastMessageAt:FieldValue.serverTimestamp(),unreadByStaff:status==="waiting"?1:0},{merge:true});
  batch.set(thread.collection("messages").doc(),{from:"guest",text:text.trim(),createdAt:Timestamp.fromMillis(createdAt),guestSessionId:session.sessionId});
  batch.set(thread.collection("messages").doc(),{from:"ai",text:reply,source,createdAt:Timestamp.fromMillis(createdAt+1)});
  await batch.commit();
  return Response.json({type:status==="waiting"?"handoff":"answer",text:reply,source,afterHours,nextStaffResponse:afterHours?availability.nextLabel:null});
 }catch(error){
  const expired=error instanceof Error&&error.message==="SESSION_EXPIRED";
  return Response.json({error:expired?"session_expired":"message_failed"},{status:expired?403:500});
 }
}
