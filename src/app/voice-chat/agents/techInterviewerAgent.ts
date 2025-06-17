// Moved from voice-chat/techInterviewerAgent.ts
export * from './techInterviewerAgent';

import { useRef, useState } from 'react';

export interface TechAgentState {
  lastQuestionId: number | null;
  question: string | null;
  finished: boolean;
  message: string | null;
}

export function useTechInterviewer(audioRef: React.RefObject<HTMLAudioElement>) {
  const [techAgent, setTechAgent] = useState<TechAgentState>({
    lastQuestionId: null,
    question: null,
    finished: false,
    message: null,
  });
  const [interviewMode, setInterviewMode] = useState(false);
  const [assistantText, setAssistantText] = useState('');

  // Start interview
  const startTechInterview = async () => {
    setInterviewMode(true);
    setAssistantText('');
    const res = await fetch('http://localhost:8000/tech-interviewer/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: null, last_question_id: null, user_id: 1, requirement_id: 1 }),
    });
    const data = await res.json();
    setTechAgent({
      lastQuestionId: data.question_id,
      question: data.question,
      finished: data.finished,
      message: data.message,
    });
    if (data.question) setAssistantText(`🤖 Interviewer: ${data.question}`);
    else if (data.message) setAssistantText(`🤖 Interviewer: ${data.message}`);
    // TTS
    let ttsText = data.question || data.message || '';
    if (ttsText && audioRef.current) {
      await playTTS(ttsText, audioRef);
    }
  };

  // Handle answer and get next question
  const handleTechAnswer = async (transcript: string) => {
    const replyRes = await fetch('http://localhost:8000/tech-interviewer/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answer: transcript,
        last_question_id: techAgent.lastQuestionId,
        user_id: 1,
        requirement_id: 1,
      }),
    });
    const reply = await replyRes.json();
    setTechAgent({
      lastQuestionId: reply.question_id,
      question: reply.question,
      finished: reply.finished,
      message: reply.message,
    });
    if (reply.question) setAssistantText(prev => `${prev}\n🤖 Interviewer: ${reply.question}`);
    else if (reply.message) setAssistantText(prev => `${prev}\n🤖 Interviewer: ${reply.message}`);
    // TTS
    let ttsText = reply.question || reply.message || '';
    if (ttsText && audioRef.current) {
      await playTTS(ttsText, audioRef);
    }
  };

  return {
    techAgent,
    interviewMode,
    setInterviewMode,
    assistantText,
    setAssistantText,
    startTechInterview,
    handleTechAnswer,
  };
}

// TTS utility
export async function playTTS(text: string, audioRef: React.RefObject<HTMLAudioElement>) {
  try {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audioRes = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!audioRes.ok) throw new Error('TTS API error');
    const audioBlob = await audioRes.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Error playing TTS audio:', err);
  }
}

// Remove the old file after moving to agents/
