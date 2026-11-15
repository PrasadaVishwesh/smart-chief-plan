import { useEffect, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface SpeechRecognitionAlternative { transcript: string }
interface SpeechRecognitionResultLike extends ArrayLike<SpeechRecognitionAlternative> { isFinal: boolean }
interface SpeechRecognitionEventLike { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike> }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
interface SpeechRecognitionConstructor { new (): SpeechRecognitionLike }
type SpeechWindow = Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };

const languages = [
  ["en-US", "English (US)"], ["en-IN", "English (India)"], ["hi-IN", "Hindi"], ["bn-IN", "Bengali"],
  ["ta-IN", "Tamil"], ["te-IN", "Telugu"], ["kn-IN", "Kannada"], ["ml-IN", "Malayalam"], ["mr-IN", "Marathi"],
  ["gu-IN", "Gujarati"], ["pa-IN", "Punjabi"], ["ur-IN", "Urdu"], ["or-IN", "Odia"], ["as-IN", "Assamese"],
  ["es-ES", "Spanish"], ["fr-FR", "French"], ["de-DE", "German"], ["pt-BR", "Portuguese"], ["ar-SA", "Arabic"],
  ["zh-CN", "Chinese (Mandarin)"], ["ja-JP", "Japanese"], ["ko-KR", "Korean"], ["it-IT", "Italian"], ["ru-RU", "Russian"],
] as const;

interface VoiceInputProps {
  disabled?: boolean;
  onTranscript: (text: string) => void;
}

export default function VoiceInput({ disabled = false, onTranscript }: VoiceInputProps) {
  const [language, setLanguage] = useState(() => {
    const browserLanguage = typeof navigator === "undefined" ? "en-US" : navigator.language;
    return languages.some(([code]) => code.toLowerCase() === browserLanguage.toLowerCase()) ? browserLanguage : "en-US";
  });
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const speechWindow = window as SpeechWindow;
    setSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
  }, []);

  const toggleListening = () => {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      toast.error("Voice typing is not available in this browser.");
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from({ length: event.results.length - event.resultIndex }, (_, index) => {
        const result = event.results[event.resultIndex + index];
        return result?.isFinal ? result[0]?.transcript : "";
      }).filter(Boolean).join(" ").trim();
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted" && event.error !== "no-speech") toast.error("Could not capture speech. Check microphone permission and try again.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      toast.error("Could not start voice typing.");
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-1">
      <Select value={language} onValueChange={setLanguage} disabled={disabled || listening}>
        <SelectTrigger className="h-9 w-[112px]" aria-label="Voice typing language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {languages.map(([code, label]) => <SelectItem key={code} value={code}>{label}</SelectItem>)}
        </SelectContent>
      </Select>
      {supported && (
        <Button type="button" size="icon" variant={listening ? "destructive" : "outline"} disabled={disabled} onClick={toggleListening} aria-label={listening ? "Stop voice typing" : "Start voice typing"} title={listening ? "Stop voice typing" : "Start voice typing"}>
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}