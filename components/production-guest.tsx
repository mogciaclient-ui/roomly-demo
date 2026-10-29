"use client";

import {FormEvent,use,useEffect,useMemo,useRef,useState} from "react";
import {openRoomSession,sendProductionGuestMessage} from "@/lib/production-client";
import {Message} from "@/lib/types";
import {formatRoomLabel} from "@/lib/room-label";
import {formatKnowledgeAnswer} from "@/lib/format-knowledge";

type Session={facilityId:string;threadId:string;facilityName:string;roomNumber:string;expiresAt:number;staffHours?:{start:string;end:string}[]};
type PendingMessage={id:string;text:string;state:"sending"|"failed";createdAt:number};

function timeLabel(value:number){return new Intl.DateTimeFormat("ja-JP",{hour:"2-digit",minute:"2-digit",timeZone:"Asia/Tokyo"}).format(new Date(value))}
function staffLabel(){return "スタッフ"}

export function ProductionGuest({params}:{params:Promise<{roomToken:string}>}){
 const {roomToken}=use(params);const [session,setSession]=useState<Session|null>(null);const [messages,setMessages]=useState<Message[]>([]);const [pending,setPending]=useState<PendingMessage|null>(null);const [messageVersion,setMessageVersion]=useState(0);const [input,setInput]=useState("");const [loadError,setLoadError]=useState(false);const [streamError,setStreamError]=useState(false);const [expired,setExpired]=useState(false);const end=useRef<HTMLDivElement>(null);const messageList=useRef<HTMLElement>(null);const followLatest=useRef(true);const textarea=useRef<HTMLTextAreaElement>(null);
 useEffect(()=>{openRoomSession(roomToken).then(setSession).catch(()=>setLoadError(true))},[roomToken]);
 useEffect(()=>{const viewport=window.visualViewport;const syncViewport=()=>document.documentElement.style.setProperty("--roomly-guest-height",`${Math.round(viewport?.height??window.innerHeight)}px`);syncViewport();viewport?.addEventListener("resize",syncViewport);window.addEventListener("resize",syncViewport);return()=>{viewport?.removeEventListener("resize",syncViewport);window.removeEventListener("resize",syncViewport);document.documentElement.style.removeProperty("--roomly-guest-height")}},[]);
 useEffect(()=>{if(!session||expired)return;let active=true;const load=async()=>{try{const response=await fetch("/api/room-messages",{cache:"no-store"});if(response.status===403){setExpired(true);return}if(!response.ok)throw new Error();const data=await response.json();if(!active)return;setStreamError(false);setMessages((data.messages as Message[]).map(message=>({...message,text:formatKnowledgeAnswer(message.source,message.text)})).sort((left,right)=>left.createdAt-right.createdAt||(left.from==="guest"?-1:right.from==="guest"?1:0)))}catch{if(active)setStreamError(true)}};void load();const timer=window.setInterval(()=>void load(),2500);return()=>{active=false;window.clearInterval(timer)}},[session,expired,messageVersion]);
 useEffect(()=>{if(!session)return;const check=()=>{if(Date.now()>=session.expiresAt){setMessages([]);setPending(null);setExpired(true)}};const visible=()=>{if(document.visibilityState==="visible")check()};check();const delay=session.expiresAt-Date.now();const timeout=delay>0&&delay<=2147483647?window.setTimeout(check,delay):undefined;const interval=window.setInterval(check,30000);window.addEventListener("focus",check);window.addEventListener("pageshow",check);document.addEventListener("visibilitychange",visible);return()=>{if(timeout!==undefined)window.clearTimeout(timeout);window.clearInterval(interval);window.removeEventListener("focus",check);window.removeEventListener("pageshow",check);document.removeEventListener("visibilitychange",visible)}},[session]);
 useEffect(()=>{if(followLatest.current)end.current?.scrollIntoView({block:"end"})},[messages,pending]);
 useEffect(()=>{const field=textarea.current;if(!field)return;field.style.height="auto";field.style.height=`${Math.min(Math.max(field.scrollHeight,50),120)}px`},[input]);
 const staffHours=useMemo(()=>session?.staffHours?.map(hours=>`${hours.start}–${hours.end}`).join(" / "),[session]);
 async function send(text:string){const trimmed=text.trim();if(!trimmed||pending?.state==="sending")return;followLatest.current=true;const optimistic:PendingMessage={id:crypto.randomUUID(),text:trimmed,state:"sending",createdAt:Date.now()};setPending(optimistic);setInput("");try{await sendProductionGuestMessage(trimmed);setPending(null);setMessageVersion(value=>value+1)}catch(value){if(value instanceof Error&&value.message==="SESSION_EXPIRED"){setExpired(true);return}setPending({...optimistic,state:"failed"});setInput(trimmed)}}
 function submit(event:FormEvent){event.preventDefault();void send(input)}
 if(expired)return <main className="guest-shell center"><div className="invalid-card"><div className="qr-icon">✓</div><h1>ご利用ありがとうございました</h1><p><span>チェックアウト時刻を過ぎたため、</span><span>このチャットの利用は終了しました。</span></p></div></main>;
 if(loadError)return <main className="guest-shell center"><div className="invalid-card"><div className="qr-icon">!</div><h1>この客室ページは<br/>現在利用できません</h1><p><span>リンクが無効になっている可能性があります。</span><span>客室またはフロントの最新案内をご確認ください。</span></p></div></main>;
 if(!session)return <div className="app-loading" role="status"><div className="guest-brand">Roomly<span>.</span></div><p>客室を確認中</p></div>;
 return <main className="guest-shell production-chat">
  <header className="production-guest-header"><div className="production-brand-mark"><span>R</span></div><div><b>Roomly<span>.</span></b><small>{session.facilityName} · {formatRoomLabel(session.roomNumber)}</small></div></header>
  {staffHours?<div className="production-service-note"><i/> スタッフ対応時間 {staffHours}</div>:null}
  <section ref={messageList} className="production-messages" aria-live="polite" onScroll={()=>{const list=messageList.current;if(list)followLatest.current=list.scrollHeight-list.scrollTop-list.clientHeight<80}}><div className="day-label">今日</div>
   {messages.length===0&&!streamError?<div className="production-welcome-message"><div className="production-ai-avatar">R</div><div><small>Roomly AI</small><p>ようこそ、{session.facilityName}へ。<br/>館内のご案内やご要望をお手伝いします。</p></div></div>:null}
   {streamError?<button type="button" className="production-stream-error" onClick={()=>window.location.reload()}>会話を読み込めませんでした。タップして再読み込み</button>:null}
   {messages.map(message=><article key={message.id} className={`production-message ${message.from}`}>{message.from!=="guest"?<div className="production-ai-avatar">{message.from==="staff"?"人":"R"}</div>:null}<div className="production-message-stack">{message.from!=="guest"?<small>{message.from==="staff"?staffLabel():message.from==="facility"?"ホテルからのお知らせ":"Roomly AI"}</small>:null}<p>{message.text}</p><time>{timeLabel(message.createdAt)}</time></div></article>)}
   {pending?<><article className="production-message guest pending"><div className="production-message-stack"><p>{pending.text}</p><time>{pending.state==="sending"?"送信済み":"送信できませんでした"}</time>{pending.state==="failed"?<button type="button" onClick={()=>void send(pending.text)}>再送する</button>:null}</div></article>{pending.state==="sending"?<div className="production-thinking" role="status" aria-live="polite"><div className="production-ai-avatar">R</div><div><span className="thinking-dots" aria-hidden="true"><i/><i/><i/></span><p>Roomlyがご案内を準備しています。<br/>このまま少しお待ちください。</p></div></div>:null}</>:null}<div ref={end}/>
  </section>
  <form className="production-composer" onSubmit={submit}><textarea ref={textarea} rows={1} aria-label="メッセージ" value={input} onChange={event=>setInput(event.target.value)} placeholder="メッセージを入力してください" enterKeyHint="send" disabled={pending?.state==="sending"}/><button className="production-send" disabled={!input.trim()||pending?.state==="sending"}>{pending?.state==="sending"?"送信中":"送信"}</button></form>
 </main>
}
