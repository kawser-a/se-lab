'use client';
import React from 'react';
import {startAssistant,stopAssistant} from '../../../ai/vapi'

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';



const vapi_interview = () => {
  return (
    <div>
        Welcome to the ai interview board
        <div>
        <button className="bg-blue-500" onClick={startAssistant}>start</button>
        <button onClick={stopAssistant}>stop</button>
        </div>

        <Button onClick={console.log('hello')}>start</Button>
        
    </div>
  )
}

export default vapi_interview