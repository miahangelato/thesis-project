"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { ResultsParticipantData } from "@/types/results";

const normalizeText = (text: string) => text.replace(/\r\n/g, "\n").trim();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const computeNextDelayMs = (nextChar: string, lookbehind: string) => {
  // Base pace: faster typing
  let delay = 15;

  // Small random jitter
  delay += Math.floor(Math.random() * 10); // +0..9

  // Add pauses around punctuation and line breaks (reduced)
  const prevChar = lookbehind.slice(-1);
  if (nextChar === "\n") delay += 100;
  if (prevChar === "\n") delay += 50;
  if ([".", "!", "?"].includes(prevChar)) delay += 150;
  if ([",", ":", ";"].includes(prevChar)) delay += 80;
  if (prevChar === " ") delay += 5;

  return clamp(delay, 5, 400);
};

const hashText = (text: string) => {
  // Small stable hash (djb2) so we can key sessionStorage per explanation.
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33) ^ text.charCodeAt(i);
  }
  // Convert to unsigned and base36 for compactness.
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

  // Reset typing when explanation changes.
  useEffect(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;

    if (!rawExplanation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTypedCount(0);
      return;
    }

    // If we've already finished this exact explanation in this session,
    // skip the animation and show it immediately.
    try {
      if (completionKey && window.sessionStorage.getItem(completionKey) === "1") {
        setTypedCount(rawExplanation.length);
        return;
      }
    } catch {
      // Ignore storage errors and fall back to animating.
    }

    setTypedCount(0);
  }, [completionKey, rawExplanation]);

  // Thinking-style typewriter (variable delays + punctuation pauses).
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

  // Mark as completed so it won't animate again this session.
  useEffect(() => {
    if (!rawExplanation) return;
    if (!isComplete) return;
    if (!completionKey) return;

    try {
      window.sessionStorage.setItem(completionKey, "1");
    } catch {
      // ignore
    }
  }, [completionKey, isComplete, rawExplanation]);

  // Keep scroll pinned to bottom while typing.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isComplete) return;
    el.scrollTop = el.scrollHeight;
  }, [isComplete, typedCount]);

  const displayText = rawExplanation.slice(0, typedCount);

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* AI Health Insights */}
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
