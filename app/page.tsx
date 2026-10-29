import Link from "next/link";

export default function Home(){
 return <main className="product-home">
  <header className="product-home-header"><div className="roomly-logo">Roomly<span>.</span><small>FRONT DESK</small></div><Link href="/console" className="home-login">ログイン</Link></header>
  <section className="product-hero">
   <div className="product-hero-copy"><p className="product-kicker">小規模宿泊施設のデジタルコンシェルジュ</p><h1>まずは、実際の流れを<br/>デモで体験してください。</h1><p className="product-lead">お客様からの質問にAIが答え、必要な時だけスタッフへつなぐ。<br/>Roomlyでの接客を、データを登録する前にそのまま試せます。</p><div className="product-actions"><Link href="/demo" className="demo-start">デモをはじめる <span>→</span></Link><Link href="/console" className="setup-start">実際の利用をはじめる</Link></div><p className="demo-note">デモでは本番の施設情報・宿泊データは使用しません</p></div>
   <div className="hero-preview" aria-label="Roomlyのチャット画面イメージ"><div className="preview-top"><span className="preview-dot"/>Roomly デモ旅館 <b>DEMO</b></div><div className="preview-body"><aside><strong>チャット</strong><button className="selected"><i>101</i><span><b>101号室 田中様</b><small>露天風呂は何時までですか？</small></span></button><button><i>203</i><span><b>203号室</b><small>Wi-Fiを教えてください</small></span></button></aside><section><header><i>101</i><div><b>101号室 田中様</b><small>2名・1泊</small></div></header><div className="preview-chat"><p className="guest-message">露天風呂は何時までですか？<time>19:42</time></p><p className="ai-message"><small>AIコンシェルジュ</small>露天風呂は23:00までご利用いただけます。最終入場は22:30です。<time>19:42</time></p></div><footer>メッセージを入力してください <button>送信</button></footer></section></div></div>
  </section>
 </main>
}
