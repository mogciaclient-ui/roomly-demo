"use client";
import {useEffect,useMemo,useState} from "react";
import {auth} from "@/lib/firebase";
import {useDemo} from "@/components/demo-provider";
import {formatRoomLabel} from "@/lib/room-label";

type Stay={id:string;roomNumber:string;guests:number;language:string;guestName:string;memo:string;validFrom:number;validUntil:number;active:boolean};
const languageLabel=(value:string)=>value==="ja"?"日本語":value;
const localDateTime=(date:Date)=>new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);

export default function Stays(){
 const {state}=useDemo(),facility=state.facilities.find(value=>value.id===state.activeFacilityId)!;
 const [stays,setStays]=useState<Stay[]>([]),[selectedRoom,setSelectedRoom]=useState<string|null>(null),[filter,setFilter]=useState("all"),[message,setMessage]=useState("");
 const [now,setNow]=useState(0);
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),60000);return()=>clearInterval(timer)},[]);
 useEffect(()=>{void refresh()},[facility.id]);
 async function api(body?:unknown){const user=auth.currentUser;if(!user)throw new Error("ログインが必要です");const token=await user.getIdToken();const response=await fetch(`/api/admin/rooms${body?"":`?facilityId=${encodeURIComponent(facility.id)}&includeStays=1`}`,{method:body?"POST":"GET",headers:{authorization:`Bearer ${token}`,...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw new Error(data.error==="stay_overlap"?"同じ客室の宿泊期間が重複しています":"登録内容を確認してください");return data}
 async function refresh(){try{const data=await api();setStays(data.stays)}catch(error){setMessage(error instanceof Error?error.message:"読み込みに失敗しました")}}
 const currentByRoom=useMemo(()=>new Map(stays.filter(stay=>stay.active&&stay.validFrom<=now&&now<stay.validUntil).map(stay=>[stay.roomNumber,stay])),[stays,now]);
 const upcomingByRoom=useMemo(()=>{const result=new Map<string,Stay>();for(const stay of stays.filter(item=>item.active&&item.validFrom>now).sort((a,b)=>a.validFrom-b.validFrom))if(!result.has(stay.roomNumber))result.set(stay.roomNumber,stay);return result},[stays,now]);
 const selectedStay=selectedRoom?(currentByRoom.get(selectedRoom)??upcomingByRoom.get(selectedRoom)):undefined;
 const attentionRooms=new Set(state.threads.filter(thread=>thread.facilityId===facility.id&&thread.status==="waiting").map(thread=>thread.roomNumber));
 const visibleRooms=facility.rooms.filter(room=>filter==="all"||filter==="occupied"&&currentByRoom.has(room)||filter==="check"&&attentionRooms.has(room)||filter==="empty"&&!currentByRoom.has(room)&&!upcomingByRoom.has(room));
 return <Page title="宿泊管理" sub="客室ごとの宿泊情報とQRの利用期間を管理します">
  <div className="summary-cards"><Card n={currentByRoom.size} label="滞在中" tone="green"/><Card n={attentionRooms.size} label="要確認" tone="amber"/><Card n={Math.max(0,facility.rooms.length-currentByRoom.size)} label="空室" tone="gray"/></div>
  {message&&<p className="form-message">{message}</p>}
  <div className="content-card"><div className="card-toolbar"><div>{["all","occupied","check","empty"].map(value=><button className={filter===value?"active":""} onClick={()=>setFilter(value)} key={value}>{value==="all"?"すべて":value==="occupied"?"滞在中":value==="check"?"要確認":"空室"}</button>)}</div><button className="primary small" disabled={!facility.rooms.length} onClick={()=>setSelectedRoom(facility.rooms[0]??null)}>＋ 宿泊登録</button></div>
   <div className="room-grid">{visibleRooms.map(room=>{const stay=currentByRoom.get(room),upcoming=upcomingByRoom.get(room),registered=stay??upcoming;return <button className={`room-card ${stay?"occupied":upcoming?"upcoming-room":"empty-room"}`} key={room} onClick={()=>setSelectedRoom(room)}><div><b>{formatRoomLabel(room)}</b><span>{stay?"滞在中":upcoming?"利用予定":"空室"}</span></div>{registered?<><h3>{registered.guestName||"ゲスト様"}</h3><p>{registered.guests}名 · {languageLabel(registered.language)}</p><small>{new Date(registered.validFrom).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})} 〜 {new Date(registered.validUntil).toLocaleString("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"})}</small>{registered.memo?<small className="room-stay-memo">{registered.memo}</small>:null}</>:<><h3>宿泊登録</h3><p>クリックして登録</p><small>QRは現在利用不可</small></>}</button>})}</div>
  </div>
  {selectedRoom&&<StayRegistration room={selectedRoom} stay={selectedStay} facilityId={facility.id} onClose={()=>setSelectedRoom(null)} onSaved={async()=>{setSelectedRoom(null);setMessage("宿泊情報を保存しました");await refresh()}} api={api}/>} 
 </Page>;
}

function StayRegistration({room,stay,facilityId,onClose,onSaved,api}:{room:string;stay?:Stay;facilityId:string;onClose:()=>void;onSaved:()=>Promise<void>;api:(body:unknown)=>Promise<any>}){
 const defaults=useMemo(()=>stay?{start:localDateTime(new Date(stay.validFrom)),end:localDateTime(new Date(stay.validUntil))}:{start:"",end:""},[stay]);
 const [guests,setGuests]=useState(String(stay?.guests??1)),[checkIn,setCheckIn]=useState(defaults.start),[checkOut,setCheckOut]=useState(defaults.end),[guestName,setGuestName]=useState(stay?.guestName??""),[memo,setMemo]=useState(stay?.memo??""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 return <div className="modal-bg"><form className="stay-registration" onSubmit={async event=>{event.preventDefault();setBusy(true);setError("");try{await api({action:stay?"updateStay":"issueStay",stayId:stay?.id,facilityId,roomNumber:room,guests:Number(guests),language:"ja",validFrom:new Date(checkIn).toISOString(),validUntil:new Date(checkOut).toISOString(),guestName,memo});await onSaved()}catch(value){setError(value instanceof Error?value.message:"保存できませんでした");setBusy(false)}}}>
  <button type="button" className="modal-close" onClick={onClose}>×</button><p className="stay-kicker">STAY REGISTRATION</p><h2>{formatRoomLabel(room)} の宿泊登録</h2>
  <div className="stay-form-grid"><label>宿泊人数 <em>必須</em><input type="number" min="1" max="20" required value={guests} onChange={event=>setGuests(event.target.value)}/></label><label>使用言語<div className="stay-fixed-value">日本語</div></label><label>チェックイン時刻 <em>必須</em><input type="datetime-local" required value={checkIn} onChange={event=>setCheckIn(event.target.value)}/></label><label>予定チェックアウト時刻 <em>必須</em><input type="datetime-local" required value={checkOut} onChange={event=>setCheckOut(event.target.value)}/></label><label className="full">ゲスト名 <span>任意</span><input value={guestName} maxLength={100} onChange={event=>setGuestName(event.target.value)} placeholder="例：山田 太郎"/></label><label className="full">メモ <span>任意</span><textarea value={memo} maxLength={1000} onChange={event=>setMemo(event.target.value)} placeholder="スタッフ間で共有する内容"/></label></div>
  {error&&<div className="login-error">{error}</div>}<div className="stay-actions"><button type="button" onClick={onClose}>キャンセル</button><button className="primary" disabled={busy}>{busy?"保存中…":stay?"変更を保存":"宿泊情報を登録"}</button></div>
 </form></div>;
}

export function Page({title,sub,children}:{title:string;sub:string;children:React.ReactNode}){return <div className="page-wrap"><div className="page-heading"><div><h1>{title}</h1><p>{sub}</p></div></div>{children}</div>}
function Card({n,label,tone}:{n:number;label:string;tone:string}){return <div className={`summary-card ${tone}`}><span>{label}</span><b>{n}</b><small>室</small></div>}
