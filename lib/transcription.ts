import { Platform } from 'react-native';

const TRANSCRIBE_URL = (process.env.EXPO_PUBLIC_TRANSCRIBE_URL as string) || (process.env.EXPO_PUBLIC_TOOLKIT_URL ? new URL('/transcribe', process.env.EXPO_PUBLIC_TOOLKIT_URL).toString() : undefined);

type TranscriptionOptions = {
  fileUri?: string;
};

export async function transcribeAudio({ fileUri }: TranscriptionOptions): Promise<string> {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
    return new Promise<string>((resolve, reject) => {
      // @ts-ignore
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new Recognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => {
        const transcript: string = event.results?.[0]?.[0]?.transcript ?? '';
        resolve(transcript);
      };
      recognition.onerror = (e: any) => reject(e?.error || 'recognition-error');
      recognition.onend = () => {};
      recognition.start();
    });
  }

  if (TRANSCRIBE_URL && fileUri) {
    const body = new FormData();
    // @ts-ignore
    body.append('file', { uri: fileUri, name: 'audio.m4a', type: 'audio/m4a' });
    const res = await fetch(TRANSCRIBE_URL, { method: 'POST', body });
    if (!res.ok) throw new Error('Transcription failed');
    const data = await res.json();
    return data.text || '';
  }

  return '';
}