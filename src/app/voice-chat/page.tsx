/* File: src/app/voice-chat/page.tsx */
'use client';

import { useRef, useState } from 'react';
import './voicechat.css';

interface TechAgentState {
  lastQuestionId: number | null;
  question: string | null;
  finished: boolean;
  message: string | null;
}

export default function VoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const [techAgent, setTechAgent] = useState<TechAgentState>({
    lastQuestionId: null,
    question: null,
    finished: false,
    message: null,
  });
  const [interviewMode, setInterviewMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

  // New: Start interview with TechInterviewerAgent
  const startTechInterview = async () => {
    console.log('🟢 [TechInterview] Start button pressed');
    setInterviewMode(true);
    setAssistantText('');
    const res = await fetch('http://localhost:8000/tech-interviewer/next', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer: null, last_question_id: null, user_id: 1, requirement_id: 1 }),
    });
    const data = await res.json();
    console.log('🟢 [TechInterview] First question response:', data);
    setTechAgent({
      lastQuestionId: data.question_id,
      question: data.question,
      finished: data.finished,
      message: data.message,
    });
    if (data.question) setAssistantText(`🤖 Interviewer: ${data.question}`);
    else if (data.message) setAssistantText(`🤖 Interviewer: ${data.message}`);

    // TTS: Speak the first question or message immediately
    let ttsText = '';
    if (data.question) {
      ttsText = data.question;
    } else if (data.message) {
      ttsText = data.message;
    }
    if (ttsText) {
      try {
        const audioRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: ttsText }),
        });
        if (!audioRes.ok) {
          throw new Error('TTS API error');
        }
        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
        }
      } catch (err) {
        console.error('❌ Error playing TTS audio (first question):', err);
      }
    }
  };

  const startListening = () => {
    console.log('🎤 Start Listening clicked');

    const SpeechRecognition =
      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

    if (!SpeechRecognition) {
      alert('Your browser does not support Speech Recognition.');
      console.error('SpeechRecognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => console.log('✅ Speech recognition started');
    recognition.onend = () => {
      console.log('🛑 Speech recognition ended');
      setIsListening(false);
    };
    recognition.onerror = (e: any) => {
      console.error('⚠️ Speech recognition error:', e.error);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('🧍 You said:', transcript);
      setAssistantText(prev => `${prev}\n🧍 You: ${transcript}`);

      if (interviewMode && techAgent.lastQuestionId) {
        // Send answer to tech-interviewer agent
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

        // TTS: Speak the new question or message immediately after receiving it
        let ttsText = '';
        if (reply.question) {
          ttsText = reply.question;
        } else if (reply.message) {
          ttsText = reply.message;
        }
        if (ttsText) {
          try {
            // Stop any currently playing audio before playing new one
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
            const audioRes = await fetch('/api/tts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: ttsText }),
            });
            if (!audioRes.ok) {
              throw new Error('TTS API error');
            }
            const audioBlob = await audioRes.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) {
              audioRef.current.src = audioUrl;
              await audioRef.current.play();
            }
          } catch (err) {
            console.error('❌ Error playing TTS audio (question):', err);
          }
        }
      } else {
        // ...existing LLM logic...
        const replyRes = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript }),
        });
        const reply = await replyRes.json();
        setAssistantText(prev => `${prev}\n🤖 AI: ${reply.text}`);
        // TTS for generic LLM response
        let ttsText = reply.text;
        try {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
          const audioRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: ttsText }),
          });
          if (!audioRes.ok) {
            throw new Error('TTS API error');
          }
          const audioBlob = await audioRes.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          if (audioRef.current) {
            audioRef.current.src = audioUrl;
            await audioRef.current.play();
          }
        } catch (err) {
          console.error('❌ Error playing TTS audio:', err);
        }
      }
    };

    try {
      recognition.start();
      console.log('🔄 Recognition started');
      setIsListening(true);
    } catch (err) {
      console.error('❌ Error starting recognition:', err);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      console.log('⛔ Manually stopped listening');
    }
  };

  return (
    <div className="voicechat-container">
      <h1>🗣️ Virtual Interviewer </h1>
      <div className="participants">
        <div className="user">
          <div className={`avatar ${isListening ? 'talking' : 'idle'}`} />
          <div className="label">You</div>
        </div>
        <div className="user">
          <div className={`avatar ${assistantText.includes('🤖') ? 'talking' : 'idle'}`} />
          <div className="label">LemonFox</div>
        </div>
      </div>
      <div className="cc">
        <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{assistantText}</pre>
      </div>
      <div className="controls">
        <button className="btn" onClick={isListening ? stopListening : startListening}>
          {isListening ? '🛑 Stop Listening' : '🎙️ Start Listening'}
        </button>
        <button className="btn" onClick={startTechInterview} disabled={interviewMode}>
          🧑‍💻 Start Tech Interview
        </button>
      </div>
      <audio ref={audioRef} hidden />
    </div>
  );
}