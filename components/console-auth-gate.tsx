"use client";
import {useEffect,useState} from "react";
import {onAuthStateChanged,signInWithEmailAndPassword,signOut,User} from "firebase/auth";
import {doc,getDoc} from "firebase/firestore";
import {auth,db} from "@/lib/firebase";

export function ConsoleAuthGate({children}:{children:React.ReactNode}){
 const production=process.env.NEXT_PUBLIC_ROOMLY_MODE!=="demo";
 const [user,setUser]=useState<User|null>(null);const [loading,setLoading]=useState(false);const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [showPassword,setShowPassword]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{if(!production)return;return onAuthStateChanged(auth,async next=>{if(next&&!next.isAnonymous){const staff=await getDoc(doc(db,"staff",next.uid));if(staff.exists())setUser(next);else{setError("このアカウントはスタッフ登録されていません");await signOut(auth)}}else setUser(null);setLoading(false)})},[production]);
 if(!production)return children;
 if(loading)return <div className="app-loading"><div className="guest-brand">Roomly<span>.</span></div><p>認証を確認中...</p></div>;
 if(!user)return <main className="console-login"><form autoComplete="off" onSubmit={async event=>{event.preventDefault();setError("");setLoading(true);try{await signInWithEmailAndPassword(auth,email,password)}catch{setError("メールアドレスまたはパスワードを確認してください");setLoading(false)}}}>
  <div className="console-brand">Roomly<span>.</span><small>FRONT DESK</small></div><h1>ホテルコンソール</h1><p>スタッフアカウントでログインしてください</p>
  <label>メールアドレス<input type="email" name="roomly-login-email" required value={email} onChange={event=>setEmail(event.target.value)} autoComplete="off"/></label>
  <label>パスワード<span className="password-field"><input type={showPassword?"text":"password"} name="roomly-login-password" required value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password"/><button type="button" aria-label={showPassword?"パスワードを隠す":"パスワードを表示"} onClick={()=>setShowPassword(value=>!value)}>{showPassword?"非表示":"表示"}</button></span></label>
  {error&&<div className="login-error">{error}</div>}<button className="primary">ログイン</button>
 </form></main>;
 return children;
}
