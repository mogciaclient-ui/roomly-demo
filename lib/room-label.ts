export function formatRoomLabel(value:string){
 const label=value.trim();
 return /^\d+$/.test(label)?`${label}号室`:label;
}
