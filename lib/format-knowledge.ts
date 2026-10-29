const knowledgeFormats:Record<string,{title:string;labels:string[];groupSize?:number}>={
 wifi:{title:"Wi-Fi情報",labels:["利用場所","SSID","パスワード","接続できない場合"]},
 bath:{title:"大浴場・温泉",labels:["施設","午後の利用時間","午前の利用時間","場所","ご案内"]},
 breakfast:{title:"朝食",labels:["内容","時間","会場","料金","ご案内"]},
 checkout:{title:"チェックアウト",labels:["時刻","方法","場所","ご案内"]},
 parking:{title:"駐車場",labels:["駐車場","台数","料金","場所","ご案内"]},
 amenities:{title:"アメニティ",labels:["品目","受取方法","料金","ご案内"],groupSize:4},
 facilities:{title:"館内施設",labels:["施設","利用時間","場所・ご案内"],groupSize:3},
 roomService:{title:"ルームサービス",labels:["メニュー","料金","注文方法","提供時間","ご案内"]},
 shuttle:{title:"送迎",labels:["送迎内容","依頼方法","午前の対応時間","午後の対応時間","ご案内"]},
 nearby:{title:"周辺案内",labels:["名称","種類","距離","行き方","ご案内"],groupSize:5},
 emergency:{title:"緊急時のご案内",labels:["内容","客室電話","電話番号","対応方法","夜間対応"]},
};

export function formatKnowledgeAnswer(key:string|null|undefined,answer:string){
 if(!key||!answer.includes(" / ")||/[\n]|SSID[：:]|パスワード[：:]/i.test(answer))return answer;
 const format=knowledgeFormats[key],parts=answer.split("/").map(part=>part.trim()).filter(Boolean);
 if(!format||parts.length<2)return parts.map(part=>`・${part}`).join("\n");
 const size=format.groupSize??format.labels.length,groups:string[]=[];
 for(let index=0;index<parts.length;index+=size){const group=parts.slice(index,index+size);groups.push(group.map((value,itemIndex)=>`${format.labels[itemIndex]??"補足"}：${value}`).join("\n"))}
 return [format.title,...groups].join("\n\n");
}
