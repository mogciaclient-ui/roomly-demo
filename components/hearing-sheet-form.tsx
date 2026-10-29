"use client";
import {useEffect,useMemo,useState} from "react";
import {useDemo} from "./demo-provider";

type Entry=Record<string,string>;
type Section={id:string;title:string;description:string;fields:{key:string;label:string;placeholder?:string}[]};

const sections:Section[]=[
 {id:"wifi",title:"Wi-Fi設定",description:"階数ごとにSSIDとパスワードを登録できます。全館共通なら「全館」で入力してください。",fields:[{key:"floor",label:"対象階",placeholder:"全館 / 3F / 5-7F"},{key:"ssid",label:"SSID",placeholder:"Roomly-Guest"},{key:"password",label:"パスワード"},{key:"notes",label:"補足"}]},
 {id:"breakfast",title:"朝食情報",description:"形式・時間・場所・料金を分けて登録できます。",fields:[{key:"style",label:"形式"},{key:"hours",label:"時間"},{key:"location",label:"場所"},{key:"price",label:"料金"},{key:"notes",label:"補足"}]},
 {id:"bath",title:"大浴場・温泉情報",description:"施設ごとに場所や営業時間を登録できます。",fields:[{key:"name",label:"名称"},{key:"hours",label:"営業時間"},{key:"location",label:"場所"},{key:"notes",label:"補足"}]},
 {id:"facilities",title:"館内設備情報",description:"設備ごとに使える時間や注意事項を登録できます。",fields:[{key:"name",label:"設備名"},{key:"hours",label:"利用時間"},{key:"notes",label:"補足"}]},
 {id:"amenities",title:"アメニティ・貸出品",description:"常設品、追加依頼できる物、料金などを登録できます。",fields:[{key:"name",label:"品名"},{key:"availability",label:"提供方法"},{key:"price",label:"料金"},{key:"notes",label:"補足"}]},
 {id:"parking",title:"駐車場",description:"駐車場が複数ある場合も個別に登録できます。",fields:[{key:"name",label:"名称"},{key:"capacity",label:"台数"},{key:"price",label:"料金"},{key:"location",label:"場所"},{key:"notes",label:"補足"}]},
 {id:"checkout",title:"チェックアウト",description:"時間・方法・鍵の返却場所を分けて登録できます。",fields:[{key:"time",label:"時間"},{key:"method",label:"方法"},{key:"keyReturn",label:"鍵の返却場所"},{key:"notes",label:"補足"}]},
 {id:"shuttle",title:"提携交通情報",description:"提携タクシー会社や送迎サービスを登録できます。",fields:[{key:"company",label:"会社・サービス名"},{key:"phone",label:"連絡先"},{key:"hours",label:"対応時間"},{key:"notes",label:"補足"}]},
 {id:"nearby",title:"周辺施設情報",description:"ホテル近くの施設情報をカテゴリごとに登録できます。",fields:[{key:"name",label:"施設名"},{key:"category",label:"カテゴリ"},{key:"distance",label:"距離"},{key:"location",label:"場所・行き方"},{key:"notes",label:"補足"}]},
 {id:"roomService",title:"ルームサービス",description:"メニューごとに料金と注文方法を登録できます。",fields:[{key:"name",label:"メニュー名"},{key:"price",label:"料金"},{key:"method",label:"注文方法"},{key:"hours",label:"提供時間"},{key:"notes",label:"補足"}]},
 {id:"emergency",title:"緊急時メモ",description:"カテゴリごとに連絡先と対応手順を登録できます。",fields:[{key:"category",label:"カテゴリ"},{key:"contact",label:"連絡先"},{key:"steps",label:"対応手順"},{key:"notes",label:"補足"}]},
 {id:"faq",title:"よくある質問",description:"質問と回答を自由に追加できます。",fields:[{key:"question",label:"質問"},{key:"answer",label:"回答"}]},
 {id:"custom",title:"その他の案内",description:"上の項目にない案内を、項目名と内容の組み合わせで自由に追加できます。",fields:[{key:"label",label:"項目名"},{key:"content",label:"案内内容"}]},
];

// E2E確認用サンプル。クライアント引き渡し前にこの定数と自動投入処理を削除する。
const E2E_SAMPLE_SHEET:Record<string,Entry[]>={
 wifi:[{floor:"全館",ssid:"Roomly-Guest",password:"roomly2026",notes:"接続できない場合はWi-Fiを一度オフにしてから再接続してください。"}],
 breakfast:[{style:"和洋ビュッフェ",hours:"7:00〜9:30（最終入場 9:00）",location:"2階 レストラン 花の間",price:"宿泊料金に含まれます",notes:"アレルギーがある場合はスタッフへご相談ください。"}],
 bath:[{name:"大浴場・露天風呂",hours:"15:00〜24:00 / 6:00〜10:00",location:"1階",notes:"客室のタオルをお持ちください。最終入場は終了30分前です。"}],
 facilities:[{name:"コインランドリー",hours:"24時間",notes:"2階にあります。洗剤は自動投入です。"},{name:"自動販売機・製氷機",hours:"24時間",notes:"各階のエレベーター横にあります。"}],
 amenities:[{name:"歯ブラシ・カミソリ・ヘアブラシ",availability:"1階アメニティバーからお持ちください",price:"無料",notes:"必要な分だけお取りください。"},{name:"追加タオル",availability:"スタッフへご依頼ください",price:"無料",notes:"お部屋までお届けします。"}],
 parking:[{name:"宿泊者専用駐車場",capacity:"20台",price:"無料",location:"正面玄関右側",notes:"予約不要です。満車の場合はフロントへお声がけください。"}],
 checkout:[{time:"10:00",method:"フロントでチェックアウト",keyReturn:"1階フロント",notes:"追加精算がない場合も鍵をご返却ください。"}],
 shuttle:[{company:"最寄り駅 無料送迎",phone:"客室チャットからスタッフへご依頼ください",hours:"8:00〜11:00 / 15:00〜20:00",notes:"ご希望時刻の30分前までにご連絡ください。"}],
 nearby:[{name:"コンビニエンスストア",category:"買い物",distance:"徒歩3分",location:"正面玄関を出て右へ約200m",notes:"24時間営業です。"},{name:"〇〇駅",category:"交通",distance:"徒歩8分",location:"正面玄関を出て左へ直進",notes:"無料送迎も利用できます。"}],
 roomService:[{name:"おにぎりセット",price:"800円",method:"客室チャットからスタッフへご注文ください",hours:"18:00〜21:00",notes:"提供まで約30分かかります。"}],
 emergency:[{category:"体調不良・救急",contact:"客室電話9番 / フロント 03-1234-5678",steps:"緊急の場合は119番へ連絡し、続けてフロントへお知らせください。",notes:"夜間の有人対応は行っていません。命に関わる場合は119番へ連絡してください。"}],
 faq:[{question:"チェックアウトを延長できますか？",answer:"空室状況により承ります。スタッフへご相談ください。"},{question:"荷物を預けられますか？",answer:"チェックイン前とチェックアウト後の当日に限り、フロントでお預かりします。"},{question:"館内は禁煙ですか？",answer:"客室と館内は禁煙です。喫煙所は1階正面玄関横にあります。"}],
 custom:[{label:"門限",content:"門限はありません。24時以降は正面玄関横の夜間入口をご利用ください。"}],
};

const emptyEntry=(section:Section)=>Object.fromEntries(section.fields.map(field=>[field.key,""]));
const emptySheet=()=>Object.fromEntries(sections.map(section=>[section.id,[emptyEntry(section)]])) as Record<string,Entry[]>;
const parseSheet=(value:string|undefined)=>{try{return value?JSON.parse(value) as Record<string,Entry[]>:{}}catch{return {}}};

export function HearingSheetForm(){
 const {state,update}=useDemo();
 const facility=state.facilities.find(item=>item.id===state.activeFacilityId)!;
 const stored=useMemo(()=>parseSheet(facility.info.hearingSheet),[facility.id,facility.info.hearingSheet]);
 const shouldSeed=!facility.info.hearingSheet;
 const initial=shouldSeed?E2E_SAMPLE_SHEET:stored;
 const [sheet,setSheet]=useState<Record<string,Entry[]>>(()=>Object.fromEntries(sections.map(section=>[section.id,initial[section.id]?.length?initial[section.id]:[emptyEntry(section)]])));
 const [expanded,setExpanded]=useState<Record<string,number|null>>({wifi:0});
 const [saved,setSaved]=useState(false);
 const [cleared,setCleared]=useState(false);
 const persist=(next:Record<string,Entry[]>)=>{setSheet(next);update(current=>{const target=current.facilities.find(item=>item.id===facility.id)!;target.info.hearingSheet=JSON.stringify(next);for(const section of sections){const text=(next[section.id]??[]).flatMap(entry=>section.fields.map(field=>entry[field.key]?.trim()).filter(Boolean)).join(" / ");target.info[section.id]=text}return current})};
 useEffect(()=>{if(shouldSeed)persist(E2E_SAMPLE_SHEET)},[facility.id]);
 const add=(section:Section)=>{const next={...sheet,[section.id]:[...(sheet[section.id]??[]),emptyEntry(section)]};persist(next);setExpanded(current=>({...current,[section.id]:next[section.id].length-1}))};
 const change=(section:Section,index:number,key:string,value:string)=>{const rows=(sheet[section.id]??[]).map((entry,rowIndex)=>rowIndex===index?{...entry,[key]:value}:entry);persist({...sheet,[section.id]:rows})};
 const remove=(section:Section,index:number)=>{const rows=(sheet[section.id]??[]).filter((_,rowIndex)=>rowIndex!==index);persist({...sheet,[section.id]:rows.length?rows:[emptyEntry(section)]});setExpanded(current=>({...current,[section.id]:null}))};
 const clearAll=()=>{if(!window.confirm("チャット設定のすべての項目を消去します。施設・客室・宿泊情報・チャット履歴は削除されません。よろしいですか？"))return;persist(emptySheet());setExpanded({});setCleared(true);window.setTimeout(()=>setCleared(false),2200)};
 return <div className="public-hearing chat-settings-sheet">
  <header className="chat-settings-header"><div><p>ROOMLY CHAT SETTINGS</p><h1>AIチャットの回答設定</h1><div>お客様からよく聞かれる内容を登録してください。登録した情報はAIの回答に使用されます。</div></div><button type="button" className="clear-chat-settings" onClick={clearAll}>{cleared?"消去しました":"データを消去"}</button></header>
  <div className="hearing-section-list">{sections.map(section=><section className="sheet-section" key={section.id}><header><div><h2>{section.title}</h2><p>{section.description}</p></div><button type="button" onClick={()=>add(section)}>＋追加</button></header><div className="sheet-rows">{(sheet[section.id]??[]).map((entry,index)=>{const isOpen=expanded[section.id]===index;const summary=section.fields.slice(0,4).map(field=>entry[field.key]?.trim()||"未入力");return <article key={`${section.id}-${index}`}><div className="sheet-row-summary">{summary.map((value,summaryIndex)=><span key={summaryIndex}>{value}</span>)}<button type="button" onClick={()=>setExpanded(current=>({...current,[section.id]:isOpen?null:index}))}>{isOpen?"閉じる":"＋詳細"}</button></div>{isOpen?<div className="sheet-row-fields">{section.fields.map(field=><label key={field.key}>{field.label}<input value={entry[field.key]??""} placeholder={field.placeholder} onChange={event=>change(section,index,field.key,event.target.value)}/></label>)}<button className="sheet-remove" type="button" onClick={()=>remove(section,index)}>この項目を削除</button></div>:null}</article>})}</div></section>)}</div>
  <button className="sheet-submit" type="button" onClick={()=>{setSaved(true);window.setTimeout(()=>setSaved(false),2200)}}>{saved?"保存しました":"チャット設定を保存"}</button>
 </div>;
}
