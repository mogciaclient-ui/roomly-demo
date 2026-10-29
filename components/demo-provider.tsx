"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {doc,getDoc,onSnapshot,setDoc} from "firebase/firestore";
import {db,getGuestUser} from "@/lib/firebase";
import {createDemoState} from "@/lib/seed";
import {DemoState,Message,Thread} from "@/lib/types";
import {ProductionProvider} from "./production-provider";
import {RoomlyContext,RoomlyContextValue,useRoomly} from "./roomly-context";

const KEY="roomly-demo-state-v3";

export function LocalDemoProvider({children}:{children:React.ReactNode}){
 const [state,setState]=useState<DemoState>(createDemoState);const [ready,setReady]=useState(false);const [syncMode,setSyncMode]=useState<"firebase"|"local">("firebase");const remoteRef=useRef(doc(db,"demo","state"));const firebaseReady=useRef(false);
 useEffect(()=>{let stop=()=>{};let active=true;(async()=>{try{await getGuestUser();const snapshot=await getDoc(remoteRef.current);if(!snapshot.exists())await setDoc(remoteRef.current,createDemoState());stop=onSnapshot(remoteRef.current,next=>{if(!active||!next.exists())return;const value=next.data() as DemoState;setState(value);localStorage.setItem(KEY,JSON.stringify(value));firebaseReady.current=true;setReady(true)},()=>fallback())}catch{fallback()}})();function fallback(){if(!active)return;setSyncMode("local");try{const saved=localStorage.getItem(KEY);if(saved)setState(JSON.parse(saved))}catch{}setReady(true)}return()=>{active=false;stop()}},[]);
 const persist=(next:DemoState)=>{localStorage.setItem(KEY,JSON.stringify(next));if(syncMode==="firebase"&&firebaseReady.current)setDoc(remoteRef.current,next).catch(()=>setSyncMode("local"))};
 const update=(fn:(s:DemoState)=>DemoState)=>setState(current=>{const next=fn(structuredClone(current));persist(next);return next});
 const add=(thread:Thread,message:Message)=>{thread.messages.push(message);thread.lastMessageAt=message.createdAt};
 const sendGuest=(threadId:string,text:string,type?:"question"|"request")=>update(s=>{let thread=s.threads.find(x=>x.id===threadId);if(!thread){const [facilityId,roomNumber]=threadId.split("-room-");thread={id:threadId,facilityId,roomNumber,guestName:"ゲスト様",guests:2,nights:1,status:"ai",assignee:"",handoverNote:"",unreadByStaff:0,lastMessageAt:Date.now(),messages:[]};s.threads.unshift(thread)}if(thread.status==="done")thread.status="ai";add(thread,{id:crypto.randomUUID(),from:"guest",text,createdAt:Date.now()});const facility=s.facilities.find(x=>x.id===thread!.facilityId)!;const lower=text.toLowerCase();const emergency=/火事|火災|救急|倒れ|閉じ込め|息が/.test(text);const request=type==="request"||/タオル|送迎|清掃|壊れ|故障|苦情|スタッフ|お願い|追加/.test(text);let reply="";if(emergency){reply=`緊急の可能性があります。${facility.info.emergency}`;thread.status="waiting";thread.unreadByStaff+=1}else if(request){reply="承知しました。スタッフにお伝えしました。そのままお待ちください。";thread.status="waiting";thread.unreadByStaff+=1}else if(/wi.?fi|ワイファイ|パスワード/i.test(lower))reply=facility.info.wifi;else if(/風呂|温泉|浴場/.test(text))reply=facility.info.bath;else if(/朝食|モーニング/.test(text))reply=facility.info.breakfast;else if(/チェックアウト|退館/.test(text))reply=facility.info.checkout;else if(/駐車/.test(text))reply=facility.info.parking;else{reply="施設情報で確認できないため、スタッフに確認します。そのままお待ちください。";thread.status="waiting";thread.unreadByStaff+=1}add(thread,{id:crypto.randomUUID(),from:"ai",text:reply,createdAt:Date.now()+250});return s});
 const sendStaff=(threadId:string,text:string,facility=false)=>update(s=>{let thread=s.threads.find(x=>x.id===threadId);if(!thread){const [facilityId,roomNumber]=threadId.split("-room-");thread={id:threadId,facilityId,roomNumber,guestName:"ゲスト様",guests:2,nights:1,status:"staff",assignee:s.currentStaff,handoverNote:"",unreadByStaff:0,lastMessageAt:Date.now(),messages:[]};s.threads.unshift(thread)}add(thread,{id:crypto.randomUUID(),from:facility?"facility":"staff",text,createdAt:Date.now(),staffName:s.currentStaff});thread.status="staff";thread.assignee=s.currentStaff;thread.unreadByStaff=0;return s});
 const reset=()=>{const next=createDemoState();setState(next);persist(next)};const value=useMemo(()=>({state,update,reset,sendGuest,sendStaff,syncMode}),[state,syncMode]);
 if(!ready)return <div className="app-loading" role="status"><div className="guest-brand">roomly<span>•</span></div><p>Firebaseに接続中...</p></div>;
 return <RoomlyContext.Provider value={value}>{children}</RoomlyContext.Provider>
}
export function DemoProvider({children}:{children:React.ReactNode}){return process.env.NEXT_PUBLIC_ROOMLY_MODE==="demo"?<LocalDemoProvider>{children}</LocalDemoProvider>:<ProductionProvider>{children}</ProductionProvider>}
export const useDemo=useRoomly;
