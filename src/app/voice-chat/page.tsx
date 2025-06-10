'use client';

import { useRef, useState } from 'react';

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
    <div style={{ padding: 20 }}>
      <h1>🗣️ Voice Chat with LemonFox</h1>
      <button
        onClick={isListening ? stopListening : startListening}
        style={{
          background: isListening ? '#f87171' : '#4ade80',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '16px',
          cursor: 'pointer',
          marginBottom: '1rem',
        }}
      >
        {isListening ? '🛑 Stop Listening' : '🎙️ Start Listening'}
      </button>

      <pre style={{ whiteSpace: 'pre-wrap' }}>{assistantText}</pre>
      <audio ref={audioRef} hidden />
    </div>
  );
}
