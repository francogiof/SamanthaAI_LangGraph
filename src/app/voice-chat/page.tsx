/* File: src/app/voice-chat/page.tsx */
'use client';

import { useRef, useState } from 'react';
import './voicechat.css';

export default function VoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [assistantText, setAssistantText] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);

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
      setAssistantText(`🧍 You: ${transcript}`);

      try {
        const replyRes = await fetch('/api/llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: transcript }),
        });

        const reply = await replyRes.json();
        console.log('🤖 LLM reply:', reply.text);
        setAssistantText(prev => `${prev}\n🤖 AI: ${reply.text}`);

        const audioRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply.text }),
        });

        const audioBlob = await audioRes.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play();
        }
      } catch (err) {
        console.error('❌ Error calling LLM or TTS:', err);
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
          <div className={`avatar ${assistantText.includes('🤖 AI:') ? 'talking' : 'idle'}`} />
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
      </div>

      <audio ref={audioRef} hidden />
    </div>
  );
}