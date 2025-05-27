
'use client';
import Vapi from "@vapi-ai/web"
import React from 'react';
import { getUser } from "@/actions/user";

 const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_API_KEY);
 const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;  
 console.log(getUser);
export const startAssistant= async ()=>{

    return await vapi.start(assistantId)

};

export const stopAssistant= ()=>{
    return vapi.stop()
}