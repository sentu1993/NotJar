'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { Play, Pause, RotateCcw, Monitor } from 'lucide-react';

export default function SessionReplayPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [events, setEvents] = useState<{ id: string; timestamp: string; type: string; data: any }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [clicks, setClicks] = useState<{ x: number; y: number; id: string }[]>([]);
  const playbackRef = useRef<any>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await api.get(`/track/sessions/${id}/events`);
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEvents();
    }
  }, [id, fetchEvents]);

  useEffect(() => {
    if (isPlaying && events.length > 0) {
      const startTime = new Date(events[0].timestamp).getTime();
      const endTime = new Date(events[events.length - 1].timestamp).getTime();
      const duration = endTime - startTime;

      playbackRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 100; // 100ms step
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          
          // Find the current cursor position
          const currentTimestamp = startTime + next;
          const currentEvent = events.findLast((e) => 
            new Date(e.timestamp).getTime() <= currentTimestamp && (e.type === 'mousemove' || e.type === 'click')
          );
          
          if (currentEvent) {
            setCursorPos({ x: currentEvent.data.x, y: currentEvent.data.y });
            if (currentEvent.type === 'click') {
              setClicks((prevClicks) => [...prevClicks, { ...currentEvent.data, id: currentEvent.id }]);
              setTimeout(() => {
                setClicks((prevClicks) => prevClicks.filter(c => c.id !== currentEvent.id));
              }, 500);
            }
          }
          
          return next;
        });
      }, 100);
    } else {
      clearInterval(playbackRef.current);
    }

    return () => clearInterval(playbackRef.current);
  }, [isPlaying, events]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const reset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    setClicks([]);
  };

  const duration = events.length > 0 
    ? new Date(events[events.length - 1].timestamp).getTime() - new Date(events[0].timestamp).getTime()
    : 0;

  return (
    <div className="min-h-screen bg-white p-8 text-black">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border">
        <div className="bg-gray-900 p-4 text-white flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Monitor className="w-5 h-5 text-gray-400" />
            <h1 className="text-lg font-bold">Session Replay: {id?.toString().substring(0, 8)}</h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-sm font-mono">
              {Math.floor(currentTime / 1000)}s / {Math.floor(duration / 1000)}s
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={reset} className="hover:text-indigo-400 transition">
                <RotateCcw className="w-5 h-5" />
              </button>
              <button onClick={togglePlay} className="p-2 bg-indigo-600 rounded-full hover:bg-indigo-700 transition">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="relative bg-white border-b overflow-hidden" style={{ height: '600px' }}>
          {/* Representative Page Content Placeholder */}
          <div className="absolute inset-0 p-12 opacity-10 select-none">
            <div className="h-8 bg-gray-200 w-1/4 mb-4 rounded" />
            <div className="h-4 bg-gray-200 w-full mb-2 rounded" />
            <div className="h-4 bg-gray-200 w-full mb-2 rounded" />
            <div className="h-4 bg-gray-200 w-2/3 mb-8 rounded" />
            
            <div className="grid grid-cols-3 gap-8 mb-8">
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
              <div className="h-32 bg-gray-200 rounded" />
            </div>
            
            <div className="h-8 bg-gray-200 w-1/4 mb-4 rounded" />
            <div className="h-4 bg-gray-200 w-full mb-2 rounded" />
            <div className="h-4 bg-gray-200 w-2/3 mb-2 rounded" />
          </div>

          {/* Cursor Replay */}
          <div 
            className="absolute pointer-events-none transition-all duration-100 ease-linear"
            style={{ 
              left: cursorPos.x, 
              top: cursorPos.y,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-4 h-4 bg-red-500 rounded-full opacity-50 shadow-sm" />
            <div className="w-2 h-2 bg-red-600 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Click Replay Visuals */}
          {clicks.map((click) => (
            <div 
              key={click.id}
              className="absolute pointer-events-none animate-ping"
              style={{ left: click.x, top: click.y, transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-12 h-12 border-2 border-red-500 rounded-full opacity-75" />
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Event Log</h2>
          <div className="space-y-2 max-h-40 overflow-y-auto font-mono text-xs">
            {events.filter(e => new Date(e.timestamp).getTime() <= (new Date(events[0].timestamp).getTime() + currentTime)).map((e) => (
              <div key={e.id} className="flex space-x-4 border-b border-gray-100 pb-1">
                <span className="text-gray-400">[{new Date(e.timestamp).toLocaleTimeString()}]</span>
                <span className="font-bold text-indigo-600">{e.type.toUpperCase()}</span>
                <span className="text-gray-600">{JSON.stringify(e.data)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
