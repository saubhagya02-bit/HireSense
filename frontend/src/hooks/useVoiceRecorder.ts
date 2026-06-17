import { useState, useRef, useCallback } from "react";

interface VoiceState {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
}

export function useVoiceRecorder() {
  const [state, setState] = useState<VoiceState>({
    isRecording: false,
    transcript: "",
    interimTranscript: "",
    error: null,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState((s) => ({
        ...s,
        error: "Speech recognition not supported in this browser. Use Chrome.",
      }));
      return;
    }

    // Start audio recording for storage
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) =>
        audioChunksRef.current.push(e.data);
      mediaRecorder.start(100);
      mediaRecorderRef.current = mediaRecorder;
    } catch {}
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + " ";
        else interim += t;
      }
      setState((s) => ({
        ...s,
        transcript: s.transcript + final,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      setState((s) => ({
        ...s,
        error: `Recognition error: ${e.error}`,
        isRecording: false,
      }));
    };

    recognition.start();
    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    setState((s) => ({ ...s, isRecording: true, error: null }));
  }, []);

  const stopRecording = useCallback((): {
    transcript: string;
    durationSeconds: number;
    audioBlob: Blob | null;
  } => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    let audioBlob: Blob | null = null;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      mediaRecorderRef.current = null;
    }

    const duration = (Date.now() - startTimeRef.current) / 1000;
    const finalTranscript = state.transcript + state.interimTranscript;

    setState((s) => ({
      ...s,
      isRecording: false,
      interimTranscript: "",
    }));

    return {
      transcript: finalTranscript.trim(),
      durationSeconds: duration,
      audioBlob,
    };
  }, [state.transcript, state.interimTranscript]);

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      transcript: "",
      interimTranscript: "",
      error: null,
    });
  }, []);

  return { ...state, startRecording, stopRecording, reset };
}
