import { DemoState, Facility, Message, Thread } from "./types";

const now = Date.now();
const menu: Facility["richMenu"] = [
  {label:"Wi-Fi",icon:"⌁",type:"question",prompt:"Wi-Fiの接続方法を教えてください"},
  {label:"大浴場",icon:"♨",type:"question",prompt:"大浴場の利用時間を教えてください"},
  {label:"朝食",icon:"☕",type:"question",prompt:"朝食の時間と場所を教えてください"},
  {label:"タオル追加",icon:"▱",type:"request",prompt:"タオルを追加でお願いします"},
  {label:"送迎依頼",icon:"◇",type:"request",prompt:"送迎をお願いしたいです"},
  {label:"スタッフに相談",icon:"◌",type:"request",prompt:"スタッフと話したいです"},
];
const infoA = {wifi:"全館 Wi-Fi『ROOMLY-GUEST』をご利用ください。パスワードは roomly2026 です。",bath:"大浴場は1階です。15:00〜24:00、翌朝6:00〜10:00にご利用いただけます。",breakfast:"朝食は2階『花の間』で7:00〜9:30です。最終入場は9:00です。",checkout:"チェックアウトは11:00です。",parking:"正面玄関横の無料駐車場をご利用ください。",shuttle:"駅への送迎はフロントで承ります。出発の30分前までにご連絡ください。",emergency:"緊急時は客室電話の9番、またはフロント 03-1234-5678 へご連絡ください。"};
const infoB = {...infoA,wifi:"Wi-Fi『ROOMLY-ANNEX』をご利用ください。パスワードは annex2026 です。",bath:"貸切風呂は1階です。16:00〜23:00、予約制です。"};
export const facilities: Facility[] = [
  {id:"facility-a",name:"デモ施設A",address:"東京都台東区浅草1-2-3",rooms:[...Array.from({length:10},(_,i)=>`${101+i}`),...Array.from({length:10},(_,i)=>`${201+i}`)],staffHours:[{start:"08:00",end:"11:00"},{start:"15:00",end:"21:00"}],info:infoA,richMenu:menu},
  {id:"facility-b",name:"デモ施設B",address:"神奈川県箱根町湯本4-5-6",rooms:Array.from({length:5},(_,i)=>`${101+i}`),staffHours:[{start:"08:00",end:"11:00"},{start:"15:00",end:"21:00"}],info:infoB,richMenu:menu},
];
const msg=(id:string,from:Message["from"],text:string,mins:number,staffName?:string):Message=>({id,from,text,createdAt:now-mins*60000,staffName});
export const initialThreads: Thread[] = [
  {id:"facility-a-101",facilityId:"facility-a",roomNumber:"101",guestName:"山田様",guests:2,nights:1,status:"waiting",assignee:"",handoverNote:"タオルは2組ご希望",unreadByStaff:1,lastMessageAt:now-4*60000,messages:[msg("a1","guest","タオルを追加で2組お願いします",5),msg("a2","ai","承知しました。スタッフにお伝えしました。そのままお待ちください。",4)]},
  {id:"facility-a-203",facilityId:"facility-a",roomNumber:"203",guestName:"佐藤様",guests:2,nights:2,status:"staff",assignee:"田中",handoverNote:"18:30の駅送りを確認中",unreadByStaff:0,lastMessageAt:now-12*60000,messages:[msg("b1","guest","明日の送迎をお願いできますか？",18),msg("b2","ai","スタッフにお伝えしました。",17),msg("b3","staff","かしこまりました。ご希望のお時間を教えてください。",12,"田中")]},
  {id:"facility-a-108",facilityId:"facility-a",roomNumber:"108",guestName:"鈴木様",guests:1,nights:1,status:"done",assignee:"佐々木",handoverNote:"",unreadByStaff:0,lastMessageAt:now-42*60000,messages:[msg("c1","guest","Wi-Fiのパスワードを教えてください",44),msg("c2","ai",infoA.wifi,43),msg("c3","guest","つながりました、ありがとう",42)]},
];
export const createDemoState=():DemoState=>({facilities,threads:initialThreads,staff:["田中","佐々木","高橋"],activeFacilityId:"facility-a",currentStaff:"田中"});
