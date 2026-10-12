'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Minimal slice of the Web Speech API we use (not in TypeScript's DOM lib everywhere). */
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const getRecognitionCtor = (): SpeechRecognitionCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

interface UseSpeechInputOptions {
  /** Called once with the final transcript; typically submits the question. */
  onFinal: (transcript: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export interface SpeechInput {
  /** False during SSR and in browsers without the Web Speech API: hide the mic. */
  isSupported: boolean;
  isListening: boolean;
  /** Live interim transcript while the user is speaking. */
  interim: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

/**
 * Voice input via the browser Web Speech API. Shows interim text while the
 * user speaks and hands the final transcript to `onFinal`.
 */
export const useSpeechInput = ({
  onFinal,
  onError,
  lang = 'en-US',
}: UseSpeechInputOptions): SpeechInput => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  // Latest callbacks without re-creating the recognizer on every render.
  const onFinalRef = useRef(onFinal);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onFinalRef.current = onFinal;
    onErrorRef.current = onError;
  }, [onFinal, onError]);

  // Detected after mount so server and first client render match.
  useEffect(() => {
    setIsSupported(getRecognitionCtor() !== null);
    return () => recognitionRef.current?.abort();
  }, []);

  const stop = useCallback((): void => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback((): void => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    let finalText = '';
    recognition.onresult = (event) => {
      let live = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else live += result[0].transcript;
      }
      setInterim((finalText + live).trim());
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted' && event.error !== 'no-speech')
        onErrorRef.current?.(event.error);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      setInterim('');
      const text = finalText.trim();
      if (text) onFinalRef.current(text);
    };
    recognitionRef.current = recognition;
    setInterim('');
    setIsListening(true);
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [lang]);

  const toggle = useCallback((): void => {
    if (recognitionRef.current) stop();
    else start();
  }, [start, stop]);

  return { isSupported, isListening, interim, start, stop, toggle };
};
