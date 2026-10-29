"use client";
import {useState} from "react";
import {useDemo} from "@/components/demo-provider";
import {Page} from "../stays/page";
import {HearingSheetForm} from "@/components/hearing-sheet-form";

const sections=[
 {id:"basic",title:"基本情報",description:"施設名と所在地",fields:[]},
 {id:"guide",title:"館内案内",description:"Wi-Fi・温泉・朝食など",fields:[["wifi","Wi-Fi設定"],["bath","大浴場・温泉"],["breakfast","朝食"],["checkout","チェックアウト"]]},
 {id:"service",title:"設備・サービス",description:"設備・貸出品・駐車場",fields:[["facilities","館内設備・場所"],["amenities","アメニティ・貸出品"],["parking","駐車場"],["roomService","ルームサービス"]]},
 {id:"area",title:"移動・周辺",description:"送迎・交通・周辺施設",fields:[["shuttle","送迎・交通手段"],["nearby","周辺施設・観光案内"]]},
 {id:"rules",title:"FAQ・緊急時",description:"個別ルールと連絡先",fields:[["faq","よくある質問と回答"],["emergency","緊急時の連絡先・対応"]]},
] as const;

function CategoryFacility(){
 const {state,update}=useDemo();
 const facility=state.facilities.find(value=>value.id===state.activeFacilityId)!;
 const [activeId,setActiveId]=useState<(typeof sections)[number]["id"]>("guide");
 const [saved,setSaved]=useState(false);
 const setInfo=(key:string,value:string)=>update(current=>{current.facilities.find(item=>item.id===facility.id)!.info[key]=value;return current});
 const active=sections.find(section=>section.id===activeId)!;
 const filledCount=(section:(typeof sections)[number])=>section.id==="basic"?Number(Boolean(facility.name))+Number(Boolean(facility.address)):section.fields.filter(([key])=>Boolean(facility.info[key]?.trim())).length;
 return <Page title="AIヒアリングシート" sub="AIがお客様へ回答する情報をカテゴリごとに登録します">
  <div className="hearing-rule"><span>回答ルール</span><p><b>登録済みの内容</b>はAIが回答します。<b>未登録の質問・人が動く依頼</b>はホテルへ通知します。</p></div>
  <div className="hearing-workspace">
   <nav className="hearing-nav" aria-label="ヒアリング項目">{sections.map(section=>{const count=filledCount(section),total=section.id==="basic"?2:section.fields.length;return <button className={section.id===activeId?"active":""} key={section.id} onClick={()=>setActiveId(section.id)}><span><b>{section.title}</b><small>{section.description}</small></span><em>{count}/{total}</em></button>})}</nav>
   <div className="content-card hearing-panel">
    <header><div><span>AI HEARING SHEET</span><h2>{active.title}</h2><p>{active.description}について、お客様へ案内する正確な内容を入力してください。</p></div><em>{filledCount(active)}項目 入力済み</em></header>
    <div className="hearing-panel-body">{active.id==="basic"?<div className="hearing-fields"><label>施設名<input value={facility.name} onChange={event=>update(current=>{current.facilities.find(item=>item.id===facility.id)!.name=event.target.value;return current})}/></label><label>住所<input value={facility.address} onChange={event=>update(current=>{current.facilities.find(item=>item.id===facility.id)!.address=event.target.value;return current})}/></label></div>:<div className="hearing-fields">{active.fields.map(([key,label])=><label key={key}>{label}<textarea value={facility.info[key]??""} onChange={event=>setInfo(key,event.target.value)} placeholder={`${label}について、お客様へ案内する正確な内容を入力`}/></label>)}</div>}</div>
    <footer><span>{saved?"✓ 保存しました。AIの回答へ反映されます":"変更内容は入力後に自動保存されます"}</span><button className="primary" onClick={()=>{setSaved(true);window.setTimeout(()=>setSaved(false),2000)}}>変更を保存</button></footer>
   </div>
  </div>
 </Page>;
}

export default function Facility(){return <div className="page-wrap"><HearingSheetForm/></div>}
