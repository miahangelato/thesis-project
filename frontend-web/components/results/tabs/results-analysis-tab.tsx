"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Info } from "lucide-react";
import type { ResultsParticipantData } from "@/types/results";

const normalizeText = (text: string) => text.replace(/\r\n/g, "\n").trim();

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const computeNextDelayMs = (nextChar: string, lookbehind: string) => {
  // Base pace: slower to feel like it's "thinking"
  let delay = 38;

  // Small random jitter so it doesn't feel robotic
  delay += Math.floor(Math.random() * 22); // +0..21

  // Add pauses around punctuation and line breaks
  const prevChar = lookbehind.slice(-1);
  if (nextChar === "\n") delay += 260;
  if (prevChar === "\n") delay += 140;
  if ([".", "!", "?"].includes(prevChar)) delay += 420;
  if ([",", ":", ";"].includes(prevChar)) delay += 220;
  if (prevChar === " ") delay += 12;

  return clamp(delay, 18, 900);
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
      setTypedCount(0);
      return;
    }

    // If we've already finished this exact explanation in this session,
    // skip the animation and show it immediately.
    try {
      if (
        completionKey &&
        window.sessionStorage.getItem(completionKey) === "1"
      ) {
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
    const lookbehind = rawExplanation.slice(
      Math.max(0, typedCount - 8),
      typedCount
    );
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
        <div className="bg-linear-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="font-bold text-xl text-purple-900 flex items-center">
              <Info className="w-6 h-6 mr-2" />
              AI-Generated Health Insights
            </h3>
          </div>

          <div className="relative flex-1 min-h-0">
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto max-w-none text-black whitespace-pre-wrap leading-relaxed text-xl"
            >
              {displayText}
              {!isComplete && (
                <span className="inline-block animate-pulse">▍</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
