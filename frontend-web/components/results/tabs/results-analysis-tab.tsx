"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ResultsParticipantData } from "@/types/results";

import { Info } from "lucide-react";

const normalizeText = (text: string) => text.replace(/\r\n/g, "\n").trim();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const computeNextDelayMs = (nextChar: string, lookbehind: string) => {
  let delay = 15;

  delay += Math.floor(Math.random() * 10);

  const prevChar = lookbehind.slice(-1);
  if (nextChar === "\n") delay += 100;
  if (prevChar === "\n") delay += 50;
  if ([".", "!", "?"].includes(prevChar)) delay += 150;
  if ([",", ":", ";"].includes(prevChar)) delay += 80;
  if (prevChar === " ") delay += 5;

  return clamp(delay, 5, 400);
};

const hashText = (text: string) => {
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

export function ResultsAnalysisTab({
  participantData,
}: {
  participantData: ResultsParticipantData;
}) {
  const rawExplanation = normalizeText(participantData?.explanation ?? "");
  const [typedCount, setTypedCount] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const completionKey = useMemo(() => {
    if (!rawExplanation) return "";
    return `analysis_typewriter_done:${hashText(rawExplanation)}`;
  }, [rawExplanation]);

  const isComplete = typedCount >= rawExplanation.length;

  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    if (!rawExplanation) {
      setTypedCount(0);
      return;
    }

    try {
      if (completionKey && window.sessionStorage.getItem(completionKey) === "1") {
        setTypedCount(rawExplanation.length);
        return;
      }
    } catch {}

    setTypedCount(0);
  }, [completionKey, rawExplanation]);

  useEffect(() => {
    if (!rawExplanation) return;
    if (isComplete) return;

    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    const nextIndex = Math.min(rawExplanation.length, typedCount + 1);
    const nextChar = rawExplanation.charAt(typedCount);
    const lookbehind = rawExplanation.slice(Math.max(0, typedCount - 8), typedCount);
    const delay = computeNextDelayMs(nextChar, lookbehind);

    timeoutRef.current = window.setTimeout(() => {
      setTypedCount(nextIndex);
    }, delay);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };
  }, [isComplete, rawExplanation, typedCount]);

  useEffect(() => {
    if (!rawExplanation) return;
    if (!isComplete) return;
    if (!completionKey) return;

    try {
      window.sessionStorage.setItem(completionKey, "1");
    } catch {}
  }, [completionKey, isComplete, rawExplanation]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isComplete) return;
    el.scrollTop = el.scrollHeight;
  }, [isComplete, typedCount]);

  const displayText = rawExplanation.slice(0, typedCount);

  return (
    <div className="h-full min-h-0 flex flex-col">
      {participantData?.explanation && (
        <div className="flex flex-col flex-1 min-h-0 h-full">
          <div className="flex items-start justify-between gap-4 mb-4 p-6 pb-0">
            <h3 className="font-bold text-2xl text-teal-800 flex items-center">
              <Info className="w-8 h-8 mr-3 text-teal-600" />
              AI-Generated Health Insights
            </h3>
          </div>

          <div className="relative flex-1 min-h-0">
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-xl px-6 pb-6"
            >
              {displayText}
              {!isComplete && (
                <span className="inline-block animate-pulse text-teal-500">▍</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
