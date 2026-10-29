"use client";
import {useEffect,useState} from "react";
import {browserLocalPersistence,setPersistence,signInWithCustomToken} from "firebase/auth";
import {auth} from "@/lib/firebase";

export default function TrialPage(){
 const [error,setError]=useState(false);
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get("token");if(!token){setError(true);return}fetch("/api/trial-session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"exchange",token})}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();await setPersistence(auth,browserLocalPersistence);const credential=await signInWithCustomToken(auth,data.customToken);await credential.user.getIdToken(true);window.location.replace("/console")}).catch(()=>setError(true))},[]);
 return <main className="console-login"><div className="trial-entry"><div className="console-brand">Roomly<span>.</span><small>TRIAL</small></div>{error?<><h1>この体験リンクは利用できません</h1><p>有効期限が切れているか、リンクが正しくありません。</p></>:<><div className="trial-spinner"/><h1>体験環境を準備しています</h1><p>そのまま少しお待ちください。</p></>}</div></main>;
}
