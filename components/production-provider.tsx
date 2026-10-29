"use client";
import type {Thread} from "@/lib/types";
import {useEffect,useMemo,useRef,useState} from "react";
import {onAuthStateChanged} from "firebase/auth";
import {collection,doc,getDoc,getDocs,onSnapshot,writeBatch} from "firebase/firestore";
import {auth,db} from "@/lib/firebase";
import {RoomlyContext,RoomlyContextValue} from "./roomly-context";
import {DemoState,Facility,Message} from "@/lib/types";

const empty:DemoState={facilities:[],threads:[],staff:[],activeFacilityId:"",currentStaff:""};

export function ProductionProvider({children}:{children:React.ReactNode}){
 const [state,setState]=useState<DemoState>(empty),[ready,setReady]=useState(true);
 const timer=useRef<ReturnType<typeof setTimeout>|null>(null);

 const load=async()=>{
  const facilitiesSnap=await getDocs(collection(db,"facilities"));
  const facilities:Facility[]=[],threads:Thread[]=[];
  for(const facilityDoc of facilitiesSnap.docs){
   const data=facilityDoc.data();
   const [infoSnap,roomsSnap,threadsSnap]=await Promise.all([getDoc(doc(db,"facilities",facilityDoc.id,"info","main")),getDocs(collection(db,"facilities",facilityDoc.id,"rooms")),getDocs(collection(db,"facilities",facilityDoc.id,"threads"))]);
   facilities.push({id:facilityDoc.id,name:data.name,address:data.address??"",staffHours:data.staffHours??[],info:infoSnap.data()??{},richMenu:data.richMenu??[],rooms:roomsSnap.docs.map(x=>x.data().roomNumber)});
   for(const threadDoc of threadsSnap.docs){
    const value=threadDoc.data(),messagesSnap=await getDocs(collection(db,"facilities",facilityDoc.id,"threads",threadDoc.id,"messages"));
    const messages=messagesSnap.docs.map(x=>{const message=x.data();return {id:x.id,from:message.from,text:message.text,staffName:message.staffName,createdAt:message.createdAt?.toMillis?.()??Date.now()} as Message}).sort((a,b)=>a.createdAt-b.createdAt||(a.from==="guest"?-1:b.from==="guest"?1:0));
    threads.push({id:threadDoc.id,facilityId:facilityDoc.id,roomNumber:value.roomNumber??"",guestName:value.guestName??"ゲスト様",guests:value.guests??1,nights:value.nights??1,status:value.status??"ai",assignee:value.assignee??"",handoverNote:value.handoverNote??"",unreadByStaff:value.unreadByStaff??0,lastMessageAt:value.lastMessageAt?.toMillis?.()??Date.now(),messages});
   }
  }
  const user=auth.currentUser,staffName=user?.displayName||user?.email||"管理者";
  setState(current=>({facilities,threads,staff:[staffName],activeFacilityId:current.activeFacilityId&&facilities.some(x=>x.id===current.activeFacilityId)?current.activeFacilityId:facilities[0]?.id??"",currentStaff:staffName}));
  setReady(true);
 };

 useEffect(()=>{let stopFacilities=()=>{},stopChildren:(()=>void)[]=[];const stopAuth=onAuthStateChanged(auth,user=>{stopFacilities();stopChildren.forEach(stop=>stop());stopChildren=[];if(!user||user.isAnonymous){setReady(true);return}stopFacilities=onSnapshot(collection(db,"facilities"),snapshot=>{stopChildren.forEach(stop=>stop());stopChildren=snapshot.docs.flatMap(facility=>[onSnapshot(collection(db,"facilities",facility.id,"rooms"),()=>void load()),onSnapshot(collection(db,"facilities",facility.id,"threads"),()=>void load())]);void load()})});return()=>{stopAuth();stopFacilities();stopChildren.forEach(stop=>stop())}},[]);

 const persist=async(next:DemoState)=>{const batch=writeBatch(db);for(const facility of next.facilities){batch.set(doc(db,"facilities",facility.id),{name:facility.name,address:facility.address,staffHours:facility.staffHours,richMenu:facility.richMenu},{merge:true});batch.set(doc(db,"facilities",facility.id,"info","main"),facility.info,{merge:true})}for(const thread of next.threads){batch.set(doc(db,"facilities",thread.facilityId,"threads",thread.id),{roomNumber:thread.roomNumber,guestName:thread.guestName,guests:thread.guests,nights:thread.nights,status:thread.status,assignee:thread.assignee,handoverNote:thread.handoverNote,unreadByStaff:thread.unreadByStaff,lastMessageAt:new Date(thread.lastMessageAt)},{merge:true});for(const message of thread.messages)batch.set(doc(db,"facilities",thread.facilityId,"threads",thread.id,"messages",message.id),{from:message.from,text:message.text,staffName:message.staffName??null,createdAt:new Date(message.createdAt)},{merge:true})}await batch.commit()};
 const update=(fn:(value:DemoState)=>DemoState)=>setState(current=>{const next=fn(structuredClone(current));if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>void persist(next),350);return next});
 const sendStaff=(threadId:string,text:string,facility=false)=>update(value=>{const thread=value.threads.find(x=>x.id===threadId);if(!thread)return value;const now=Date.now();thread.messages.push({id:crypto.randomUUID(),from:facility?"facility":"staff",text,createdAt:now,staffName:value.currentStaff});thread.lastMessageAt=now;thread.status="staff";thread.assignee=value.currentStaff;thread.unreadByStaff=0;return value});
 const context=useMemo<RoomlyContextValue>(()=>({state,update,reset:()=>{},sendGuest:()=>{},sendStaff,syncMode:"firebase"}),[state]);
 if(!ready)return <div className="app-loading"><div className="guest-brand">roomly<span>•</span></div><p>Firestoreに接続中...</p></div>;
 return <RoomlyContext.Provider value={context}>{children}</RoomlyContext.Provider>;
}
