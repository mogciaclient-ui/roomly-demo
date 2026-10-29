"use client";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect,useState} from "react";
import {doc,setDoc} from "firebase/firestore";
import {auth,db} from "@/lib/firebase";
import {ROOMLY_PUBLIC_ORIGIN} from "@/lib/public-url";
import {useDemo} from "./demo-provider";

const nav=[{href:"/console",icon:"▣",label:"チャット"},{href:"/console/stays",icon:"▦",label:"宿泊管理"},{href:"/console/facility",icon:"◇",label:"チャット設定"},{href:"/console/rooms",icon:"⌗",label:"客室・QR設定"}];

export function ConsoleShell({children}:{children:React.ReactNode}){
 const path=usePathname(),{state,update}=useDemo();const [trial,setTrial]=useState<boolean|null>(null),[invite,setInvite]=useState<{url:string;expiresAt:number}|null>(null),[inviteBusy,setInviteBusy]=useState(false),[inviteMessage,setInviteMessage]=useState("");
 useEffect(()=>{void auth.currentUser?.getIdTokenResult().then(result=>setTrial(result.claims.trial===true))},[]);
 async function createTrialLink(){const user=auth.currentUser;if(!user)return;setInviteBusy(true);setInviteMessage("");try{const response=await fetch("/api/trial-session",{method:"POST",headers:{"content-type":"application/json",authorization:`Bearer ${await user.getIdToken()}`},body:JSON.stringify({action:"create"})});if(!response.ok)throw new Error();const data=await response.json();const url=`${ROOMLY_PUBLIC_ORIGIN}/trial?token=${data.token}`;setInvite({url,expiresAt:data.expiresAt});try{await navigator.clipboard?.writeText(url);setInviteMessage("体験リンクをコピーしました")}catch{setInviteMessage("体験リンクを発行しました")}}catch{setInviteMessage("体験リンクを発行できませんでした")}finally{setInviteBusy(false)}}
 if(!state.facilities.length)return <FacilitySetup/>;
 const facility=state.facilities.find(value=>value.id===state.activeFacilityId)??state.facilities[0];
 const waiting=state.threads.filter(thread=>thread.facilityId===state.activeFacilityId&&thread.status==="waiting").length;
 return <div className="console-app"><aside><div className="console-brand">Roomly<span>.</span><small>FRONT DESK</small></div><nav>{nav.map(item=><Link key={item.href} href={item.href} className={path===item.href?"active":""}><i>{item.icon}</i>{item.label}{item.href==="/console"&&waiting>0&&<b>{waiting}</b>}</Link>)}</nav><div className="side-bottom"><span className="avatar">{state.currentStaff[0]}</span><div><b>{state.currentStaff}</b><small>{trial===true?"体験アカウント":"スタッフ"}</small></div></div></aside><div className="console-main"><header className="console-top"><div><span className="online-dot"></span><select value={facility.id} onChange={event=>update(value=>({...value,activeFacilityId:event.target.value}))}>{state.facilities.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><small>{facility.address}</small></div><div className="console-top-actions">{trial===false?<button type="button" className="trial-link-button" disabled={inviteBusy} onClick={()=>void createTrialLink()}>{inviteBusy?"発行中…":"体験リンク発行"}</button>:null}<div><label>担当者</label><select value={state.currentStaff} onChange={event=>update(value=>({...value,currentStaff:event.target.value}))}>{state.staff.map(name=><option key={name}>{name}</option>)}</select></div></div></header>{inviteMessage?<div className="console-flash">{inviteMessage}</div>:null}{children}</div>{invite?<div className="modal-bg"><div className="trial-link-modal"><button type="button" className="modal-close" onClick={()=>setInvite(null)}>×</button><p className="eyebrow">CLIENT TRIAL</p><h2>体験リンクを発行しました</h2><p>このURLをメールで送るだけで、ログイン情報なしでRoomlyを操作できます。</p><label>体験用URL<textarea readOnly rows={4} value={invite.url}/></label><small>有効期限：{new Date(invite.expiresAt).toLocaleString("ja-JP")}（7日間）</small><button type="button" className="button primary wide" onClick={async()=>{try{await navigator.clipboard.writeText(invite.url);setInviteMessage("体験リンクをコピーしました")}catch{setInviteMessage("URL欄を選択してコピーしてください")}}}>URLをコピー</button></div></div>:null}</div>;
}

function FacilitySetup(){
 const [name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
 return <main className="console-login"><form onSubmit={async event=>{event.preventDefault();setBusy(true);setError("");try{const id=crypto.randomUUID();await setDoc(doc(db,"facilities",id),{name:name.trim(),address:"",staffHours:[{start:"08:00",end:"11:00"},{start:"15:00",end:"21:00"}],richMenu:[],accessType:"production",createdAt:new Date()});await setDoc(doc(db,"facilities",id,"info","main"),{wifi:"",bath:"",breakfast:"",checkout:"",parking:"",shuttle:"",emergency:""})}catch{setError("施設を登録できませんでした");setBusy(false)}}}>
  <div className="console-brand">roomly<span>•</span><small>INITIAL SETUP</small></div><h1>施設を登録</h1><p>最初にRoomlyを利用する施設を登録してください</p>
  <label>施設名<input required value={name} onChange={event=>setName(event.target.value)} placeholder="例：旅館 Roomly"/></label>
  {error&&<div className="login-error">{error}</div>}<button className="primary" disabled={busy}>{busy?"登録中…":"施設を登録して開始"}</button>
 </form></main>;
}
