import {FieldValue} from "firebase-admin/firestore";
import {adminDb,requireUser} from "@/lib/firebase-admin";

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
  const user=await requireUser(request);
  const {text}=await request.json();
  if(typeof text!=="string"||!text.trim()||text.length>2000)return Response.json({error:"invalid_message"},{status:400});
  const snap=await adminDb.doc(`guestSessions/${user.uid}`).get(),session=snap.data();
  if(!snap.exists||!session?.active||session.expiresAt.toMillis()<Date.now())return Response.json({error:"session_expired"},{status:403});
  const {facilityId,threadId,roomId}=session;
  const thread=adminDb.doc(`facilities/${facilityId}/threads/${threadId}`);
  const info=(await adminDb.doc(`facilities/${facilityId}/info/main`).get()).data()??{};
  let reply="",status:"ai"|"waiting"="ai",source:string|null=null;
  if(emergencyRequest.test(text)){
   reply=`緊急の可能性があります。${info.emergency??"客室電話またはフロントへご連絡ください。"}`;
   status="waiting";
  }else if(actionRequest.test(text)){
   reply="スタッフによる対応が必要なため、ホテルへお伝えしました。そのままお待ちください。";
   status="waiting";
  }else{
   const sheet=parseHearingSheet(info.hearingSheet);
   const freeAnswer=answerFromFreeEntries(text,sheet);
   const rule=knowledgeRules.find(item=>item.pattern.test(text));
   const answer=freeAnswer?.answer??(rule&&typeof info[rule.key]==="string"?info[rule.key].trim():"");
   if(answer){reply=answer;source=freeAnswer?.source??rule!.key}else{reply="チャット設定に回答がないため、ホテルのスタッフへ確認します。";status="waiting"}
  }
  const batch=adminDb.batch();
  batch.set(thread,{roomId,status,lastMessageAt:FieldValue.serverTimestamp(),unreadByStaff:status==="waiting"?1:0},{merge:true});
  batch.set(thread.collection("messages").doc(),{from:"guest",text:text.trim(),createdAt:FieldValue.serverTimestamp(),guestUid:user.uid});
  batch.set(thread.collection("messages").doc(),{from:"ai",text:reply,source,createdAt:FieldValue.serverTimestamp()});
  await batch.commit();
  return Response.json({type:status==="waiting"?"handoff":"answer",text:reply,source});
 }catch(error){
  const unauthorized=error instanceof Error&&error.message==="UNAUTHORIZED";
  return Response.json({error:unauthorized?"unauthorized":"message_failed"},{status:unauthorized?401:500});
 }
}
