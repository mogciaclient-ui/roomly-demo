"use client";
import {useEffect,useState} from "react";
import {signInWithCustomToken} from "firebase/auth";
import {useRouter} from "next/navigation";
import {auth} from "@/lib/firebase";

export default function TrialPage(){
 const router=useRouter(),[error,setError]=useState(false);
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get("token");if(!token){setError(true);return}fetch("/api/trial-session",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({action:"exchange",token})}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();await signInWithCustomToken(auth,data.customToken);router.replace("/console")}).catch(()=>setError(true))},[router]);
 return <main className="console-login"><div className="trial-entry"><div className="console-brand">Roomly<span>.</span><small>TRIAL</small></div>{error?<><h1>この体験リンクは利用できません</h1><p>有効期限が切れているか、リンクが正しくありません。</p></>:<div className="trial-spinner" aria-label="読み込み中"/>}</div></main>;
}
