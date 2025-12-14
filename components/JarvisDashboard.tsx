import React, { useState, useEffect, useRef } from 'react';
import { CameraFeed } from './CameraFeed';
import { ArcReactor } from './ArcReactor';
import { KestraMonitor } from './KestraMonitor';
import { DialingInterface } from './DialingInterface';
import { analyzeImage, checkSafety, askLocationQuery, runKestraAgentAnalysis } from '../services/geminiService';
import { speak, stopSpeech } from '../services/ttsService';
import { AssistantMode, LogEntry, KestraFlow, AgentResult } from '../types';
import { Eye, Hand, Mic, StopCircle, Play, Activity, Users, Navigation, Terminal, Scan, MapPin, Compass, AlertTriangle } from 'lucide-react';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const JarvisDashboard: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AssistantMode>(AssistantMode.VISUAL_AID);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [spokenText, setSpokenText] = useState<string>(""); 
  const [isDialing, setIsDialing] = useState(false);
  
  // Navigation State
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [navInstruction, setNavInstruction] = useState<string | null>(null);

  // Agent State
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);

  // Sign Language State
  const [signBuffer, setSignBuffer] = useState<string[]>([]);
  const lastSignRef = useRef<string>("");

  const logsEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const lastSafetyWarningRef = useRef<number>(0);

  // Kestra State
  const [flows, setFlows] = useState<KestraFlow[]>([
    { id: 'f1', name: 'DAILY_BRIEFING', status: 'IDLE', tasks: [{id: 't1', name: 'EXTRACT_NEWS', status: 'PENDING'}, {id: 't2', name: 'SUMMARIZE', status: 'PENDING'}, {id: 't3', name: 'TTS_PLAYBACK', status: 'PENDING'}] },
    { id: 'f2', name: 'EMERGENCY_PROTOCOL', status: 'IDLE', tasks: [{id: 't1', name: 'GPS_LOCATE', status: 'PENDING'}, {id: 't2', name: 'CONTACT_SERVICES', status: 'PENDING'}, {id: 't3', name: 'LOCK_DEVICE', status: 'PENDING'}] },
    { id: 'f3', name: 'IOT_DATA_FUSION', status: 'IDLE', tasks: [{id: 't1', name: 'FETCH_SENSORS', status: 'PENDING'}, {id: 't2', name: 'AI_AGENT_REASONING', status: 'PENDING'}, {id: 't3', name: 'EXECUTE_DECISION', status: 'PENDING'}] },
  ]);

  const addLog = (message: string, sender: 'JARVIS' | 'USER' | 'SYSTEM' | 'KESTRA', type: 'info' | 'alert' | 'success' | 'transcription' | 'workflow' = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      sender,
      message,
      type
    }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Mode Change Cleanup
  useEffect(() => {
    setIsActive(false);
    stopSpeech();
    if (recognitionRef.current) recognitionRef.current.stop();
    setSpokenText("");
    setSignBuffer([]);
    setNavInstruction(null);
    addLog(`Mode switched: ${activeMode.replace('_', ' ')}`, 'SYSTEM', 'alert');
    
    // Start GPS tracking if in Navigation mode
    if (activeMode === AssistantMode.NAVIGATION) {
       addLog("Initializing GPS Subsystems...", 'SYSTEM', 'info');
       if (navigator.geolocation) {
         navigator.geolocation.watchPosition(
           (pos) => {
               const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
               setLocation(newLoc);
               if (!location) addLog(`GPS Locked: ${newLoc.lat.toFixed(4)}, ${newLoc.lng.toFixed(4)}`, 'SYSTEM', 'success');
           },
           (err) => addLog("GPS Error: " + err.message, 'SYSTEM', 'alert'),
           { enableHighAccuracy: true }
         );
       } else {
           addLog("GPS Hardware Unavailable", 'SYSTEM', 'alert');
       }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode]);

  // --- Kestra Simulation ---
  const generateMockMetrics = () => {
    // Generate data that might trigger a warning occasionally
    const hr = 60 + Math.floor(Math.random() * 80); // 60-140
    const battery = Math.floor(Math.random() * 100);
    const temp = 97 + Math.random() * 4; // 97-101
    return {
        timestamp: new Date().toISOString(),
        biometrics: { heartRate: hr, bodyTemp: temp.toFixed(1) },
        system: { batteryLevel: battery, networkLatency: '45ms' },
        external: { weather: 'Storm Warning', airQualityIndex: 120 }
    };
  };

  const triggerFlow = (flowId: string) => {
    addLog(`Initiating Kestra Flow: ${flowId}`, 'KESTRA', 'workflow');
    setFlows(prev => prev.map(f => f.id === flowId ? { ...f, status: 'RUNNING', tasks: f.tasks.map(t => ({...t, status: 'PENDING'})) } : f));
    
    // Task 1: Start
    setTimeout(() => updateTask(flowId, 0, 'RUNNING'), 500);
    
    setTimeout(async () => {
        updateTask(flowId, 0, 'COMPLETED');
        updateTask(flowId, 1, 'RUNNING');
        
        // --- Agent Logic for Flow 3 ---
        if (flowId === 'f3') {
           const mockData = generateMockMetrics();
           addLog("Aggregating Sensor Data...", 'KESTRA', 'info');
           
           try {
             // Real Gemini Call simulating Kestra AI Agent
             const result = await runKestraAgentAnalysis(mockData);
             setAgentResult({ ...result, data_source: 'IOT_SENSOR_NET' });
             addLog(`Agent Decision: ${result.decision}`, 'KESTRA', result.decision === 'CRITICAL' ? 'alert' : 'success');
             
             // Move to task 3 with the context of the decision
             setTimeout(() => {
                 updateTask(flowId, 1, 'COMPLETED');
                 updateTask(flowId, 2, 'RUNNING');
                 
                 if (result.decision === 'CRITICAL') {
                    speak(`Critical alert. ${result.summary}. Initiating safety protocols.`);
                    addLog("Executing CRITICAL_RESPONSE_PLAYBOOK", 'KESTRA', 'alert');
                 } else if (result.decision === 'WARNING') {
                    speak(`System warning. ${result.summary}.`);
                 } else {
                    addLog("Systems nominal. No action required.", 'KESTRA', 'success');
                 }
                 
                 setTimeout(() => finishFlow(flowId), 2000);
             }, 1500);
             
           } catch (e) {
             console.error(e);
             finishFlow(flowId, 'FAILED');
           }
           return;
        }

        // --- Logic for Flow 2 (Emergency) ---
        if (flowId === 'f2') {
           setIsDialing(true);
           speak("Initiating emergency contact protocol.");
           setTimeout(() => {
               updateTask(flowId, 1, 'COMPLETED');
               updateTask(flowId, 2, 'RUNNING');
               setIsDialing(false);
               setTimeout(() => finishFlow(flowId), 2000);
           }, 3000);
           return;
        }

        // --- Standard Default Flow ---
        setTimeout(() => {
            updateTask(flowId, 1, 'COMPLETED');
            updateTask(flowId, 2, 'RUNNING');
            setTimeout(() => finishFlow(flowId), 1500);
        }, 1500);

    }, 1500);
  };

  const finishFlow = (flowId: string, finalStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS') => {
      updateTask(flowId, 2, 'COMPLETED');
      setFlows(prev => prev.map(f => f.id === flowId ? { ...f, status: finalStatus } : f));
      addLog(`Workflow ${flowId} ${finalStatus.toLowerCase()}.`, 'KESTRA', finalStatus === 'SUCCESS' ? 'success' : 'alert');
  };

  const updateTask = (flowId: string, taskIdx: number, status: 'PENDING' | 'RUNNING' | 'COMPLETED') => {
    setFlows(prev => prev.map(f => {
        if (f.id !== flowId) return f;
        const newTasks = [...f.tasks];
        newTasks[taskIdx] = { ...newTasks[taskIdx], status };
        return { ...f, tasks: newTasks };
    }));
  };

  // --- Vision & Nav Logic ---
  const handleFrameCapture = async (base64: string) => {
    if (isProcessing) return;

    // --- LOGIC 1: SIGN LANGUAGE ---
    if (activeMode === AssistantMode.SIGN_INTERPRETER) {
        setIsProcessing(true);
        try {
          const signPrompt = `Analyze the hand gesture strictly:
          - If the hand is an "Open Palm" (fingers spread), output "How".
          - If only "Two Fingers" are extended (like a peace sign or V), output "Are".
          - If the finger is "Pointing" at the camera (Index finger), output "You".
          - If none of these specific gestures are clear, output "WAITING".
          Return ONLY the single word string.`;

          const text = await analyzeImage(base64, signPrompt, "You are a specialized sign language translator.");
          const cleanedText = text.replace(/[^a-zA-Z]/g, '').trim();

          if (['How', 'Are', 'You'].includes(cleanedText) && cleanedText !== lastSignRef.current) {
               setSignBuffer(prev => {
                   const newState = [...prev, cleanedText];
                   if (newState.join(' ') === "How Are You" || (newState.length >= 3 && newState.slice(-3).join(' ') === "How Are You")) {
                       speak("How are you?");
                       addLog("Sentence Formed: How are you?", 'JARVIS', 'success');
                       return [];
                   }
                   return newState;
               });
               addLog(`Gesture Detected: ${cleanedText}`, 'JARVIS', 'info');
               lastSignRef.current = cleanedText;
          }
        } catch (e) { console.error(e); }
        setIsProcessing(false);
        return;
    }

    // --- LOGIC 2: NAVIGATION SAFETY ---
    if (activeMode === AssistantMode.NAVIGATION) {
       const now = Date.now();
       if (now - lastSafetyWarningRef.current > 12000) {
          setIsProcessing(true);
          const hazard = await checkSafety(base64);
          if (hazard) {
             addLog(hazard, 'JARVIS', 'alert');
             speak(hazard);
          }
          lastSafetyWarningRef.current = now;
          setIsProcessing(false);
       }
       // Continue to check for user questions even if safety check ran
    }

    // --- LOGIC 3: USER DEMAND ---
    const userQuestion = spokenText.trim();
    if (!userQuestion) return; 

    setIsProcessing(true);
    try {
      const isMapQuery = activeMode === AssistantMode.NAVIGATION && 
                        (userQuestion.toLowerCase().includes('where') || 
                         userQuestion.toLowerCase().includes('find') || 
                         userQuestion.toLowerCase().includes('go to') ||
                         userQuestion.toLowerCase().includes('location'));
                         
      if (isMapQuery) {
          if (location) {
             addLog("Accessing Satellite Navigation...", 'SYSTEM', 'info');
             const mapAnswer = await askLocationQuery(userQuestion, location.lat, location.lng);
             
             addLog("Nav Data Received", 'JARVIS', 'success');
             speak(mapAnswer);
             setNavInstruction(mapAnswer);
          } else {
             speak("I am currently acquiring GPS satellites. Please wait a moment.");
             addLog("GPS Signal Required", 'SYSTEM', 'alert');
          }
          setSpokenText("");
      } else {
          let prompt = `User Question: "${userQuestion}". Answer strictly based on the image.`;
          let sysInstruction = "You are Jarvis. Be concise, helpful, and direct.";
          if (activeMode === AssistantMode.SOCIAL_EYE) prompt += " Focus on emotions and social cues.";

          const text = await analyzeImage(base64, prompt, sysInstruction);
          if (text) {
              addLog(text, 'JARVIS', 'success');
              speak(text);
              setSpokenText(""); 
          }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerManualScan = () => setSpokenText("Describe what you see.");

  const toggleAudioMode = () => {
    if (isActive) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsActive(false);
      return;
    }
    if (!SpeechRecognition) {
      addLog("Speech API unavailable.", 'SYSTEM', 'alert');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => { 
        addLog("Listening...", 'SYSTEM');
        setIsActive(true);
    };
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }
      if (finalTranscript) {
          setSpokenText(finalTranscript);
          addLog(`"${finalTranscript}"`, 'USER', 'transcription');
      }
    };
    recognition.onend = () => { if (isActive) recognition.start(); }
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div className="flex flex-col lg:flex-row h-[90vh] w-full max-w-[1600px] mx-auto p-4 gap-4">
      
      {/* --- LEFT SIDE: VIEWSCREEN --- */}
      <div className="w-full lg:w-2/3 h-[50vh] lg:h-full relative bg-black rounded-3xl border-2 border-jarvis-blue/30 shadow-[0_0_40px_rgba(0,243,255,0.1)] overflow-hidden flex flex-col group transition-colors duration-500">
        
        {/* Top Status Bar */}
        <div className="absolute top-0 w-full p-4 bg-gradient-to-b from-black/90 to-transparent z-20 flex justify-between">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full animate-ping bg-red-500"></div>
                <span className="text-jarvis-blue font-mono font-bold tracking-widest text-sm">
                    LIVE FEED // {activeMode}
                </span>
             </div>
             <div className="flex items-center gap-2">
                {activeMode === AssistantMode.NAVIGATION && (
                    <div className={`flex items-center gap-2 text-xs font-mono px-2 py-1 rounded border ${location ? 'text-yellow-500 bg-black/50 border-yellow-500/30' : 'text-red-500 bg-red-900/20 border-red-500/30 animate-pulse'}`}>
                        <MapPin size={10} />
                        {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'ACQUIRING GPS...'}
                    </div>
                )}
                <ArcReactor isActive={isActive} isProcessing={isProcessing} />
             </div>
        </div>

        {/* Camera Feed */}
        <div className="relative flex-1 bg-gray-900">
             {activeMode === AssistantMode.AUDITORY_ASSISTANT ? (
                 <div className="absolute inset-0 flex items-center justify-center bg-black">
                     <Activity className="w-24 h-24 text-jarvis-blue mx-auto animate-pulse" />
                 </div>
             ) : (
                <CameraFeed 
                    isActive={true} 
                    onFrameCapture={handleFrameCapture} 
                    intervalMs={activeMode === AssistantMode.NAVIGATION ? 2000 : 1000} 
                />
             )}
             
             {/* Crosshair */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                 <div className="w-16 h-1 bg-jarvis-blue"></div>
                 <div className="h-16 w-1 bg-jarvis-blue -mt-1 ml-[30px]"></div>
             </div>

             {/* SIGN LANGUAGE OVERLAY */}
             {activeMode === AssistantMode.SIGN_INTERPRETER && (
                 <div className="absolute top-1/2 left-4 right-4 text-center pointer-events-none z-30">
                     <div className="inline-flex gap-2 items-center justify-center flex-wrap">
                         {signBuffer.length === 0 && <div className="text-white/30 text-xl font-mono">WAITING FOR GESTURE...</div>}
                         {signBuffer.map((word, idx) => (
                             <span key={idx} className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(0,0,0,1)] animate-fade-in bg-black/60 px-4 py-2 rounded-xl border border-white/10">
                                 {word}
                             </span>
                         ))}
                     </div>
                 </div>
             )}

             {/* NAVIGATION OVERLAY */}
             {activeMode === AssistantMode.NAVIGATION && navInstruction && (
                 <div className="absolute top-20 left-4 right-4 bg-black/80 border-l-4 border-yellow-500 p-4 rounded text-white font-mono animate-slide-in z-30">
                     <div className="flex items-center gap-2 text-yellow-500 mb-1 font-bold"><Compass size={16}/> COURSE CORRECTION</div>
                     {navInstruction}
                 </div>
             )}
             
             {/* DIALING OVERLAY */}
             {isDialing && (
                 <DialingInterface 
                    contactName="EMERGENCY CONTACT" 
                    contactNumber="+1 (555) 019-2834" 
                    onEndCall={() => setIsDialing(false)} 
                 />
             )}
        </div>

        {/* Bottom Command Bar */}
        <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-20">
            <div className="flex items-center gap-4">
                 <button 
                    onClick={toggleAudioMode}
                    className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${isActive ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-jarvis-blue/20 border border-jarvis-blue text-jarvis-blue hover:bg-jarvis-blue hover:text-black'}`}
                 >
                    {isActive ? <StopCircle size={24} /> : <Mic size={24} />}
                 </button>

                 <div className="flex-1 h-14 bg-black/60 backdrop-blur border border-white/10 rounded-full flex items-center px-6 relative overflow-hidden">
                     {isActive && <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-scan"></div>}
                     <span className="font-mono text-cyan-500 mr-4 shrink-0">{isActive ? 'LISTENING >>' : 'STANDBY >>'}</span>
                     <p className="text-white font-mono truncate text-lg">
                        {spokenText || <span className="text-gray-600 italic text-sm">Waiting for voice command...</span>}
                     </p>
                 </div>

                 <button 
                    onClick={triggerManualScan}
                    className="h-14 px-8 rounded-full bg-jarvis-blue text-black font-bold font-mono tracking-wider hover:bg-white transition-colors flex items-center gap-2"
                 >
                    <Scan size={18} /> SCAN
                 </button>
            </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: DASHBOARD --- */}
      <div className="w-full lg:w-1/3 h-auto lg:h-full flex flex-col gap-4">
        
        {/* 1. Mode Selectors */}
        <div className="bg-black/60 border border-jarvis-blue/20 p-4 rounded-2xl backdrop-blur-md">
            <h3 className="text-jarvis-blue font-mono text-xs font-bold mb-3 flex items-center gap-2">
                <Terminal size={12} /> OPERATIONAL MODES
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <ModeBtn mode={AssistantMode.VISUAL_AID} icon={<Eye size={16}/>} label="VISION" active={activeMode} set={setActiveMode} />
                <ModeBtn mode={AssistantMode.SOCIAL_EYE} icon={<Users size={16}/>} label="SOCIAL" active={activeMode} set={setActiveMode} />
                <ModeBtn mode={AssistantMode.NAVIGATION} icon={<Navigation size={16}/>} label="NAVIGATE" active={activeMode} set={setActiveMode} />
                <ModeBtn mode={AssistantMode.SIGN_INTERPRETER} icon={<Hand size={16}/>} label="SIGN" active={activeMode} set={setActiveMode} />
                <ModeBtn mode={AssistantMode.AUDITORY_ASSISTANT} icon={<Activity size={16}/>} label="AUDIO" active={activeMode} set={setActiveMode} />
            </div>
        </div>

        {/* 2. Logs Terminal */}
        <div className="flex-1 bg-black rounded-2xl border border-jarvis-blue/20 p-4 overflow-hidden flex flex-col relative">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-jarvis-blue via-purple-500 to-jarvis-blue opacity-50"></div>
             <h3 className="text-gray-500 font-mono text-[10px] mb-2 tracking-widest">NEURAL LINK LOGS</h3>
             <div className="flex-1 overflow-y-auto space-y-3 pr-2 font-mono text-xs">
                {logs.length === 0 && <div className="text-gray-700 italic text-center mt-10">System Initialized.</div>}
                {logs.map((log) => (
                    <div key={log.id} className="flex gap-2">
                        <span className={`shrink-0 font-bold ${
                            log.sender === 'JARVIS' ? 'text-cyan-400' : 
                            log.sender === 'USER' ? 'text-green-400' : 
                            log.sender === 'KESTRA' ? 'text-purple-400' : 'text-yellow-500'
                        }`}>{log.sender}:</span>
                        <span className="text-gray-300 break-words">{log.message}</span>
                    </div>
                ))}
                <div ref={logsEndRef} />
             </div>
        </div>

        {/* 3. Kestra Workflow Panel */}
        <div className="h-1/3 bg-black/80 rounded-2xl overflow-hidden border border-purple-500/30">
             <KestraMonitor flows={flows} triggerFlow={triggerFlow} agentResult={agentResult} />
        </div>

      </div>

    </div>
  );
};

const ModeBtn = ({ mode, icon, label, active, set }: any) => (
    <button 
        onClick={() => set(mode)}
        className={`p-3 rounded-lg flex items-center justify-center gap-2 border transition-all duration-200 ${
            active === mode 
            ? 'bg-jarvis-blue/10 border-jarvis-blue text-jarvis-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
            : 'border-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300'
        }`}
    >
        {icon}
        <span className="text-[10px] font-bold tracking-wider">{label}</span>
    </button>
);