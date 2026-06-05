"use client";

import { useState, useEffect } from "react";

export function StarCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("gh-stars");
    if (cached) {
      const { stars, ts } = JSON.parse(cached);
      if (Date.now() - ts < 300_000) {
        setCount(stars);
        return;
      }
    }
    fetch("https://api.github.com/repos/vfaraji89/tokalator", {
      headers: { Accept: "application/vnd.github.v3+json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setCount(d.stargazers_count);
        sessionStorage.setItem(
          "gh-stars",
          JSON.stringify({ stars: d.stargazers_count, ts: Date.now() })
        );
      })
      .catch(() => {});
  }, []);

  if (count === null) return null;

  return (
    <span className="star-count-badge" suppressHydrationWarning>
      {count}
    </span>
  );
}
