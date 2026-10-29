export type ThreadStatus = "ai" | "waiting" | "staff" | "done";
export type MessageFrom = "guest" | "ai" | "staff" | "facility";
export type Message = { id: string; from: MessageFrom; text: string; createdAt: number; staffName?: string };
export type Thread = { id: string; facilityId: string; roomNumber: string; guestName: string; guests: number; nights: number; status: ThreadStatus; assignee: string; handoverNote: string; unreadByStaff: number; lastMessageAt: number; messages: Message[] };
export type Facility = { id: string; name: string; address: string; rooms: string[]; staffHours: {start:string;end:string}[]; info: Record<string,string>; richMenu: {label:string; icon:string; type:"question"|"request"; prompt:string}[] };
export type DemoState = { facilities: Facility[]; threads: Thread[]; staff: string[]; activeFacilityId: string; currentStaff: string };
