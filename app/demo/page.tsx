"use client";
import Link from "next/link";
import {useState} from "react";

type DemoStep="guest"|"ai"|"staff";
type DemoArea="chat"|"stays"|"rooms"|"facility"|"guest";
const guidance:Record<DemoStep,{label:string,title:string,text:string}>={
 guest:{label:"STEP 1 / 3",title:"お客様から質問",text:"客室のQRを読み取ると、アプリのインストールなしでチャットが開きます。"},
 ai:{label:"STEP 2 / 3",title:"AIが施設情報から回答",text:"よくある質問にはAIがすぐ回答。スタッフの手を止めません。"},
 staff:{label:"STEP 3 / 3",title:"スタッフへ引き継ぎ",text:"個別対応が必要な相談は、会話の内容ごとフロントへ届きます。"},
};
const areaGuidance:Record<Exclude<DemoArea,"chat">,{label:string,title:string;text:string}>={
 guest:{label:"TOUR 1 / 5",title:"お客様がQRから利用開始",text:"アプリ不要で、滞在中だけ使える専用チャットを開きます。"},
 stays:{label:"TOUR 3 / 5",title:"宿泊期間を登録",text:"チェックイン・チェックアウト時刻に合わせてQRの利用を自動で切り替えます。"},
 rooms:{label:"TOUR 4 / 5",title:"客室を登録してQRを設置",text:"QRは客室に常設できるため、宿泊者が変わっても交換する必要はありません。"},
 facility:{label:"TOUR 5 / 5",title:"AIチャットの回答内容を設定",text:"ホテルが登録した正確な情報だけを使って、お客様へ回答します。"},
};

export default function DemoPage(){
 const [area,setArea]=useState<DemoArea>("guest");
 const [step,setStep]=useState<DemoStep>("guest");
 const [taken,setTaken]=useState(false);
 const next=()=>setStep(value=>value==="guest"?"ai":"staff");
 const info=area==="chat"?guidance[step]:areaGuidance[area];
 const nextArea=()=>setArea(value=>value==="guest"?"chat":value==="chat"?"stays":value==="stays"?"rooms":value==="rooms"?"facility":"facility");
 return <main className="demo-experience">
  <header className="demo-global"><Link href="/" className="roomly-logo">Roomly<span>.</span><small>FRONT DESK</small></Link><div><span className="demo-mode">体験デモ</span><Link href="/console" className="demo-login">本番の設定・ログインへ</Link></div></header>
  <nav className="demo-switcher" aria-label="デモ機能を選択"><button className={area==="guest"?"active":""} onClick={()=>setArea("guest")}>1. お客様画面</button><button className={area==="chat"?"active":""} onClick={()=>setArea("chat")}>2. AI・スタッフ対応</button><button className={area==="stays"?"active":""} onClick={()=>setArea("stays")}>3. 宿泊登録</button><button className={area==="rooms"?"active":""} onClick={()=>setArea("rooms")}>4. 客室・QR</button><button className={area==="facility"?"active":""} onClick={()=>setArea("facility")}>5. チャット設定</button></nav>
  <div className="demo-guide"><div><span>{info.label}</span><h1>{info.title}</h1><p>{info.text}</p></div><div className="demo-guide-actions">{area==="chat"&&step!=="staff"?<button onClick={next}>チャットを進める →</button>:area!=="facility"?<button onClick={nextArea}>次の機能を見る →</button>:<Link href="/console">実際の利用をはじめる →</Link>}</div></div>
  {area==="chat"?<div className="mock-console">
   <aside className="mock-nav"><div className="mock-wordmark">Roomly<span>.</span><small>FRONT DESK</small></div><nav><b>▣</b><span>チャット</span><b>▦</b><span>宿泊管理</span><b>◇</b><span>施設情報</span><b>⌗</b><span>客室・QR</span><b>⚙</b><span>設定</span></nav><div className="mock-user"><i>佐</i><span><b>佐藤</b><small>スタッフ</small></span></div></aside>
   <section className="mock-thread"><header><div><h2>チャット</h2><small>3件のトーク</small></div><button>＋ 声掛け</button></header><div className="mock-tabs"><b>すべて</b><span>未対応 <i>1</i></span><span>対応中</span><span>完了</span></div><button className="mock-thread-item active"><i>101</i><span><b>101号室 田中様</b><small>{step==="guest"?"タオルを追加でいただけますか？":"かしこまりました。スタッフに…"}</small><em>2名・1泊</em></span><strong>1</strong></button><button className="mock-thread-item"><i>203</i><span><b>203号室 鈴木様</b><small>Wi-Fiのパスワードを教えて</small><em>1名・2泊</em></span></button><button className="mock-thread-item"><i>305</i><span><b>305号室</b><small>チェックアウトは何時ですか？</small><em>2名・1泊</em></span></button></section>
   <section className="mock-conversation"><header><i>101</i><div><h2>101号室 田中様</h2><p>2名・1泊　<span>{taken?"スタッフ対応中":"AI応答中"}</span></p></div><button className={taken?"is-taken":""} onClick={()=>setTaken(true)}>{taken?"佐藤が対応中":"対応を引き取る"}</button></header><div className="mock-handover"><b>引継ぎメモ</b><span>{step==="staff"?"タオル2枚を希望。スタッフ対応をお願いします。":"スタッフだけに見えるメモ"}</span></div><div className="mock-messages"><div className="mock-bubble guest"><small>101号室</small><p>タオルを追加でいただけますか？</p><time>19:42</time></div>{step!=="guest"?<div className="mock-bubble ai"><small>AIコンシェルジュ</small><p>かしこまりました。追加のタオルについてスタッフへおつなぎします。少々お待ちください。</p><time>19:42</time></div>:null}{step==="staff"?<div className="mock-waiting"><span>!</span><div><b>スタッフの対応を待っています</b><p>フロントの画面に通知され、会話内容もそのまま共有されます。</p></div></div>:null}{taken?<div className="mock-bubble staff"><small>佐藤（スタッフ）</small><p>承知しました。ただいまお部屋へお持ちします。</p><time>19:44</time></div>:null}</div><footer><span>メッセージを入力してください</span><button>送信</button></footer></section>
   <aside className="mock-detail"><header><b>宿泊情報</b></header><dl><dt>客室</dt><dd>101</dd><dt>ゲスト名</dt><dd>田中様</dd><dt>宿泊人数</dt><dd>2名</dd><dt>チェックアウト</dt><dd>10月30日 10:00</dd><dt>使用言語</dt><dd>日本語</dd></dl><div><b>このデモについて</b><p>ボタンを進めると、お客様の質問からAI回答、スタッフ対応までを体験できます。</p></div></aside>
  </div>:<FeatureDemo area={area}/>} 
 </main>
}

function FeatureDemo({area}:{area:Exclude<DemoArea,"chat">}){
 if(area==="guest")return <section className="feature-demo guest-demo"><div className="feature-copy"><span>GUEST EXPERIENCE</span><h2>QRを読み取るだけで、<br/>お客様専用チャットへ。</h2><p>アプリのインストールや会員登録は不要です。滞在期間中だけ、客室専用のチャットを利用できます。</p><ul><li>言語を選択</li><li>館内情報をすぐ質問</li><li>必要な時はスタッフへ接続</li></ul><button onClick={()=>alert("デモ：お客様から『Wi-Fiを教えて』が送信されました")}>「Wi-Fiを教えて」を送る</button></div><div className="demo-phone"><header><div className="guest-brand">Roomly<span>.</span></div><b>Roomly デモ旅館</b><small>101号室</small></header><div className="phone-note">● スタッフ対応 8:00–11:00 / 15:00–21:00</div><div className="phone-messages"><p className="phone-ai">ようこそ、Roomly デモ旅館へ。<br/>館内のご案内やご要望をお手伝いします。<time>15:02</time></p><p className="phone-guest">Wi-Fiのパスワードを教えてください<time>15:04</time></p><p className="phone-ai">客室Wi-Fiは「Roomly-Guest」です。パスワードは客室内のご案内にも記載しています。<time>15:04</time></p></div><div className="phone-menu"><span>♨<small>温泉</small></span><span>☕<small>朝食</small></span><span>Wi-Fi<small>接続</small></span><span>◉<small>周辺案内</small></span></div><footer>メッセージを入力 <b>↑</b></footer></div></section>;
 if(area==="stays")return <section className="feature-demo admin-feature"><FeatureSidebar active="宿泊管理"/><div className="feature-work"><div className="feature-title"><div><span>STAY MANAGEMENT</span><h2>宿泊管理</h2><p>チェックインからチェックアウトまで、QRの利用期間を自動管理します。</p></div><button>＋ 宿泊登録</button></div><div className="feature-stats"><article><small>滞在中</small><b>12</b><span>室</span></article><article><small>本日チェックイン</small><b>5</b><span>室</span></article><article><small>空室</small><b>8</b><span>室</span></article></div><div className="feature-room-grid">{["101","102","103","201","202","203","301","302"].map((room,index)=><article className={index>4?"vacant":""} key={room}><header><b>{room}</b><span>{index>4?"空室":"滞在中"}</span></header><h3>{index>4?"宿泊登録":"ゲスト様"}</h3><p>{index>4?"クリックして登録":`${index%2+1}名・日本語`}</p><small>{index>4?"QRは現在利用不可":"チェックアウト 10/30 10:00"}</small></article>)}</div></div></section>;
 if(area==="rooms")return <section className="feature-demo admin-feature"><FeatureSidebar active="客室・QR"/><div className="feature-work"><div className="feature-title"><div><span>ROOM & QR</span><h2>客室・QR</h2><p>客室に置くQRは交換不要。宿泊期間だけを登録します。</p></div><button>＋ 客室を登録</button></div><div className="qr-demo-layout"><div className="qr-table"><h3>登録済みの客室</h3>{["101","102","201","桜の間"].map(room=><div key={room}><b>{room}</b><span>● 常設用QR</span><button>PDF</button></div>)}</div><div className="qr-sheet"><div className="roomly-logo">Roomly<span>.</span></div><small>Roomly デモ旅館</small><b>101号室</b><div className="fake-qr">▦</div><p>スマートフォンで<br/>QRコードを読み取ってください</p><em>このQRは交換不要です</em></div></div></div></section>;
 return <section className="feature-demo admin-feature"><FeatureSidebar active="チャット設定"/><div className="feature-work"><div className="feature-title"><div><span>CHAT SETTINGS</span><h2>チャット設定</h2><p>AIがお客様へ回答する案内内容を登録します。</p></div><button>変更を保存</button></div><div className="demo-boundary"><div><span>AIが回答</span><b>設定に登録済み</b><small>Wi-Fi、温泉、朝食など</small></div><strong>それ以外は →</strong><div><span>ホテルへ通知</span><b>未登録・人が動く依頼</b><small>忘れ物、追加依頼、故障など</small></div></div><div className="facility-demo-grid"><div className="facility-form"><label>Wi-Fi<textarea defaultValue="SSID：Roomly-Guest\nパスワードは客室内の案内に記載"/></label><label>大浴場・温泉<textarea defaultValue="利用時間 15:00〜23:00 / 6:00〜10:00\n最終入場は終了30分前"/></label><label>朝食<textarea defaultValue="1階レストランにて 7:00〜9:30"/></label></div><aside><span>ANSWER ROUTING PREVIEW</span><h3>質問による振り分け</h3><p className="preview-question">露天風呂は何時までですか？</p><p className="preview-answer">AI回答：23:00までです。最終入場は22:30です。</p><p className="preview-question">忘れ物を探してほしい</p><p className="preview-handoff">ホテルへ通知：スタッフの確認が必要です</p><small>AIは登録内容以外を推測しません</small></aside></div></div></section>;
}

function FeatureSidebar({active}:{active:string}){return <aside className="feature-sidebar"><div className="mock-wordmark">Roomly<span>.</span><small>FRONT DESK</small></div>{["チャット","宿泊管理","チャット設定","客室・QR"].map(item=><div className={item===active?"active":""} key={item}>{item}</div>)}</aside>}
