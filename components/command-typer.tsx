"use client";

import { useState, useEffect, useRef } from "react";

const COMMANDS = [
  "/count",
  "/optimize",
  "/preview",
  "/breakdown",
  "/pin",
  "/unpin",
  "/model",
  "/compaction",
  "/instructions",
  "/reset",
  "/exit",
];

const MENTION = "@tokalator";
const TYPING_SPEED = 65;      // ms per character
const PAUSE_AFTER = 1800;     // ms to hold the completed command
const DELETE_SPEED = 30;       // ms per character when erasing
const PAUSE_BEFORE = 400;     // ms before typing next command

export function CommandTyper() {
  const [cmdIndex, setCmdIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCmd = COMMANDS[cmdIndex];

  useEffect(() => {
    if (!deleting) {
      // Typing forward
      if (charIndex < currentCmd.length) {
        timeoutRef.current = setTimeout(() => {
          setCharIndex((c) => c + 1);
        }, TYPING_SPEED);
      } else {
        // Finished typing — pause, then start deleting
        timeoutRef.current = setTimeout(() => {
          setDeleting(true);
        }, PAUSE_AFTER);
      }
    } else {
      // Deleting
      if (charIndex > 0) {
        timeoutRef.current = setTimeout(() => {
          setCharIndex((c) => c - 1);
        }, DELETE_SPEED);
      } else {
        // Finished deleting — move to next command
        timeoutRef.current = setTimeout(() => {
          setDeleting(false);
          setCmdIndex((i) => (i + 1) % COMMANDS.length);
        }, PAUSE_BEFORE);
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [charIndex, deleting, currentCmd]);

  const visibleCmd = currentCmd.slice(0, charIndex);

  return (
    <div className="command-typer" aria-live="polite" aria-label="Chat command demo">
      <span className="command-typer-mention">{MENTION}</span>
      <span className="command-typer-space"> </span>
      <span className="command-typer-cmd">{visibleCmd}</span>
      <span className="command-typer-cursor" aria-hidden>|</span>
    </div>
  );
}
