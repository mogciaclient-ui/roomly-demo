"use client";
import {createContext,useContext} from "react";import {DemoState} from "@/lib/types";
export type RoomlyContextValue={state:DemoState;update:(fn:(s:DemoState)=>DemoState)=>void;reset:()=>void;sendGuest:(threadId:string,text:string,type?:"question"|"request")=>void;sendStaff:(threadId:string,text:string,facility?:boolean)=>void;syncMode:"firebase"|"local"};
export const RoomlyContext=createContext<RoomlyContextValue|null>(null);
export const useRoomly=()=>{const value=useContext(RoomlyContext);if(!value)throw new Error("RoomlyProvider missing");return value};
