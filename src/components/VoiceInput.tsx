import { useEffect, useRef, useState } from "react";
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
  ["es-ES", "Spanish (Spain)"], ["es-MX", "Spanish (Mexico)"], ["fr-FR", "French"], ["de-DE", "German"],
  ["pt-BR", "Portuguese (Brazil)"], ["pt-PT", "Portuguese (Portugal)"], ["ar-SA", "Arabic (Saudi Arabia)"], ["ar-EG", "Arabic (Egypt)"],
  ["zh-CN", "Chinese (Mandarin)"], ["zh-TW", "Chinese (Taiwan)"], ["ja-JP", "Japanese"], ["ko-KR", "Korean"],
  ["it-IT", "Italian"], ["ru-RU", "Russian"], ["uk-UA", "Ukrainian"], ["pl-PL", "Polish"], ["cs-CZ", "Czech"],
  ["sk-SK", "Slovak"], ["sl-SI", "Slovenian"], ["hr-HR", "Croatian"], ["sr-RS", "Serbian"], ["bg-BG", "Bulgarian"],
  ["ro-RO", "Romanian"], ["hu-HU", "Hungarian"], ["el-GR", "Greek"], ["he-IL", "Hebrew"], ["fa-IR", "Persian"],
  ["tr-TR", "Turkish"], ["nl-NL", "Dutch"], ["da-DK", "Danish"], ["sv-SE", "Swedish"], ["nb-NO", "Norwegian"],
  ["fi-FI", "Finnish"], ["is-IS", "Icelandic"], ["et-EE", "Estonian"], ["lv-LV", "Latvian"], ["lt-LT", "Lithuanian"],
  ["id-ID", "Indonesian"], ["ms-MY", "Malay"], ["fil-PH", "Filipino"], ["th-TH", "Thai"], ["vi-VN", "Vietnamese"],
  ["sw-KE", "Swahili (Kenya)"], ["sw-TZ", "Swahili (Tanzania)"], ["am-ET", "Amharic"], ["ne-NP", "Nepali"], ["si-LK", "Sinhala"],
  ["km-KH", "Khmer"], ["lo-LA", "Lao"], ["my-MM", "Burmese"], ["uz-UZ", "Uzbek"], ["az-AZ", "Azerbaijani"],
  ["ka-GE", "Georgian"], ["hy-AM", "Armenian"], ["af-ZA", "Afrikaans"], ["zu-ZA", "Zulu"], ["yo-NG", "Yoruba"],
  ["ha-NG", "Hausa"], ["ig-NG", "Igbo"], ["ps-AF", "Pashto"], ["ckb-IQ", "Kurdish (Central)"], ["sq-AL", "Albanian"],
  ["mk-MK", "Macedonian"], ["ca-ES", "Catalan"], ["eu-ES", "Basque"], ["gl-ES", "Galician"], ["ga-IE", "Irish"],
  ["cy-GB", "Welsh"], ["en-GB", "English (UK)"], ["en-AU", "English (Australia)"], ["en-CA", "English (Canada)"],
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
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
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
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };
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