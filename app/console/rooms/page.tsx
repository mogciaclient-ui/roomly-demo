"use client";
import {useEffect,useState} from "react";
import QRCode from "qrcode";
import {jsPDF} from "jspdf";
import {auth} from "@/lib/firebase";
import {useDemo} from "@/components/demo-provider";
import {Page} from "../stays/page";
import {formatRoomLabel} from "@/lib/room-label";

const W=1240,H=1754;
type RoomRecord={id:string;roomNumber:string;roomToken:string|null};

export default function Rooms(){
 const {state,update}=useDemo();
 const facility=state.facilities.find(x=>x.id===state.activeFacilityId);
 const production=process.env.NEXT_PUBLIC_ROOMLY_MODE!=="demo";
 const [rooms,setRooms]=useState<RoomRecord[]>([]);
 const [roomNumber,setRoomNumber]=useState("");
 const [previewRoom,setPreviewRoom]=useState<RoomRecord|null>(null),[previewQr,setPreviewQr]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(""),[origin,setOrigin]=useState("");

 useEffect(()=>{setOrigin(window.location.origin)},[]);
 useEffect(()=>{if(!facility)return;if(!production){setRooms(facility.rooms.map(room=>({id:room,roomNumber:room,roomToken:`demo-${facility.id.at(-1)}-${room}`})));return}void refresh(facility.id)},[facility?.id,facility?.rooms.join("|"),production]);

 async function request(method:"GET"|"POST",facilityId:string,body?:unknown){const user=auth.currentUser;if(!user)throw new Error("ログインが必要です");const token=await user.getIdToken();const response=await fetch(`/api/admin/rooms${method==="GET"?`?facilityId=${encodeURIComponent(facilityId)}`:""}`,{method,headers:{authorization:`Bearer ${token}`,...(body?{"content-type":"application/json"}:{})},body:body?JSON.stringify(body):undefined});const data=await response.json();if(!response.ok)throw new Error(data.error==="invalid_stay"?"チェックイン・チェックアウト日時を確認してください":data.error==="stay_overlap"?"同じ客室の宿泊期間が重複しています":"処理に失敗しました");return data}
 async function refresh(facilityId:string){try{const data=await request("GET",facilityId);setRooms(data.rooms)}catch(error){setMessage(error instanceof Error?error.message:"読み込みに失敗しました")}}
 async function register(numbers:string[]){if(!facility||!numbers.length)return;setBusy(true);setMessage("");try{if(production){await request("POST",facility.id,{action:"registerRooms",facilityId:facility.id,roomNumbers:numbers});await refresh(facility.id)}else update(state=>{const target=state.facilities.find(x=>x.id===facility.id)!;for(const number of numbers)if(!target.rooms.includes(number))target.rooms.push(number);return state});setRoomNumber("");setMessage("客室を登録しました")}catch(error){setMessage(error instanceof Error?error.message:"登録に失敗しました")}finally{setBusy(false)}}
 if(!facility)return <div className="app-loading"><p>施設情報を読み込み中...</p></div>;

 const roomUrl=(room:RoomRecord)=>`${origin}/r/${room.roomToken}`;
 const makeSheet=async(room:RoomRecord)=>{const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;const c=canvas.getContext("2d")!;c.fillStyle="#fffaf9";c.fillRect(0,0,W,H);c.textAlign="center";c.font="600 68px 'Noto Sans JP',sans-serif";const brand="Roomly",brandWidth=c.measureText(brand).width;c.fillStyle="#201613";c.fillText(brand,W/2-10,150);c.fillStyle="#ad2218";c.fillText(".",W/2+brandWidth/2+5,150);c.fillStyle="#786c66";c.font="500 30px 'Noto Sans JP',sans-serif";c.fillText(facility.name,W/2,245);c.fillStyle="#201613";c.font="600 80px 'Noto Sans JP',sans-serif";c.fillText(formatRoomLabel(room.roomNumber),W/2,360);const qr=document.createElement("canvas");await QRCode.toCanvas(qr,roomUrl(room),{width:650,margin:3,color:{dark:"#201613",light:"#ffffff"},errorCorrectionLevel:"H"});c.fillStyle="#fff";c.fillRect(245,430,750,750);c.drawImage(qr,295,480,650,650);c.fillStyle="#201613";c.font="500 32px 'Noto Sans JP',sans-serif";c.fillText("スマートフォンでQRコードを読み取ってください",W/2,1290);c.fillStyle="#81736d";c.font="400 25px 'Noto Sans JP',sans-serif";c.fillText("このQRコードは客室に常設できます。",W/2,1380);c.fillText("宿泊者が変わっても交換する必要はありません。",W/2,1425);return canvas.toDataURL("image/jpeg",.96)};
 const downloadOne=async(room:RoomRecord)=>{if(!room.roomToken)return;const pdf=new jsPDF({unit:"mm",format:"a4",orientation:"portrait"});pdf.addImage(await makeSheet(room),"JPEG",0,0,210,297);pdf.save(`${facility.name}-${room.roomNumber}-QR.pdf`)};
 const showQr=async(room:RoomRecord)=>{if(!room.roomToken)return;setPreviewRoom(room);setPreviewQr("");setPreviewQr(await QRCode.toDataURL(roomUrl(room),{width:720,margin:3,color:{dark:"#201613",light:"#ffffff"},errorCorrectionLevel:"H"}))};

 return <Page title="客室・QR設定" sub="導入時に客室を登録し、客室へ設置する常設QRを発行します">
  <div className="room-setup-note"><span>初期設定</span><div><b>一度設定すれば、通常はこのページを操作する必要はありません</b><p>日々のチェックイン・チェックアウトや宿泊者の管理は「宿泊管理」で行います。</p></div></div>
  {message&&<p className="form-message">{message}</p>}
  <section className="room-register-panel"><header><div><p>ROOM REGISTRATION</p><h2>客室を追加</h2><span>101のほか「桜」「Villa A」など、施設に合わせた名前で登録できます</span></div></header><div className="room-register-forms single"><div><label>客室名・番号<input value={roomNumber} onChange={e=>setRoomNumber(e.target.value)} placeholder="例：101、桜、Villa A"/></label><button disabled={busy||!roomNumber.trim()} onClick={()=>void register([roomNumber.trim()])}>客室を登録</button></div></div></section>
  <section className="room-board"><header><div><p>ROOM QR</p><h2>登録済みの客室</h2><span>{rooms.length}室登録済み · QRは客室に常設できます</span></div></header><div className="room-board-grid">{rooms.map(room=><article className="room-board-card room-qr-card" key={room.id}><div className="room-card-title"><div><small>ROOM {room.roomNumber}</small><h3>{formatRoomLabel(room.roomNumber)}</h3></div><span className="qr-ready">QR発行済み</span></div><p>この客室専用のQRです。宿泊者が変わっても交換する必要はありません。</p><div className="room-card-actions"><button onClick={()=>void showQr(room)} disabled={!room.roomToken}>QRコードを表示</button><button onClick={()=>void downloadOne(room)} disabled={!room.roomToken}>PDFをダウンロード</button></div></article>)}{rooms.length===0?<p className="room-board-empty">客室がまだ登録されていません</p>:null}</div></section>
  {previewRoom?<div className="modal-bg" role="dialog" aria-modal="true" aria-label={`${formatRoomLabel(previewRoom.roomNumber)}のQRコード`}><div className="qr-preview-modal"><button className="modal-close" aria-label="閉じる" onClick={()=>{setPreviewRoom(null);setPreviewQr("")}}>×</button><div className="roomly-logo">Roomly<span>.</span><small>ROOM QR</small></div><p>{facility.name}</p><h2>{formatRoomLabel(previewRoom.roomNumber)}</h2>{previewQr?<img src={previewQr} alt={`${formatRoomLabel(previewRoom.roomNumber)}のQRコード`}/>:<div className="qr-preview-loading">QRコードを作成中...</div>}<p className="qr-preview-note">このQRコードは客室に常設できます。<br/>宿泊者が変わっても交換する必要はありません。</p><div className="qr-preview-actions"><button onClick={()=>{setPreviewRoom(null);setPreviewQr("")}}>閉じる</button><button className="primary" onClick={()=>void downloadOne(previewRoom)}>PDFをダウンロード</button></div></div></div>:null}
 </Page>;
}
