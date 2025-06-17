/* File: src/app/voice-chat/page.tsx */
'use client';

import { useRef, useState } from 'react';
import { useTechInterviewer } from './agents/techInterviewerAgent';
import './voicechat.css';

export default function VoiceChat() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const recognitionRef = useRef<any>(null);
  const {
    techAgent,
    interviewMode,
    setInterviewMode,
    assistantText,
    setAssistantText,
    startTechInterview,
    handleTechAnswer,
  } = useTechInterviewer(audioRef);

  const [isListening, setIsListening] = useState(false);

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

    recognition.onstart = () => {
      console.log('✅ Speech recognition started');
      setIsListening(true);
    };
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
        await handleTechAnswer(transcript);
      } else {
        // If you add more agents, handle them here
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