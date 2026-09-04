"use client";

import { CirclePlay, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { officialMedia } from "@/lib/knowledge-hub";

const series = ["All", ...new Set(officialMedia.map((item) => item.series))];

export function MediaLibrary() {
  const [query, setQuery] = useState("");
  const [selectedSeries, setSelectedSeries] = useState("All");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return officialMedia.filter((item) =>
      (selectedSeries === "All" || item.series === selectedSeries) &&
      (!needle || `${item.title} ${item.topics.join(" ")}`.toLocaleLowerCase().includes(needle)),
    );
  }, [query, selectedSeries]);

  return (
    <main className="kk-media-library">
      <header className="kk-media-intro">
        <p className="kk-label">Official English channel</p>
        <h1>Teachings in voice and witness</h1>
        <p>A reviewed media catalog built from the Tariqa Karkariya English channel. Video sources remain canonical; transcripts appear only after editorial review.</p>
      </header>
      <div className="kk-media-controls">
        <label><Search aria-hidden /><span className="sr-only">Search media</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teachings and topics" /></label>
        <div className="kk-media-filters" aria-label="Filter by series">
          {series.map((name) => <button key={name} type="button" data-active={selectedSeries === name || undefined} onClick={() => setSelectedSeries(name)}>{name}</button>)}
        </div>
      </div>
      <div className="kk-media-grid" aria-live="polite">
        {filtered.map((item) => (
          <article key={item.id} className="kk-media-card">
            <a href={`https://www.youtube.com/watch?v=${item.id}`} target="_blank" rel="noreferrer" className="kk-media-thumbnail">
              <Image src={`https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`} alt="" width={480} height={360} />
              <span><CirclePlay aria-hidden /> Watch</span>
            </a>
            <div className="kk-media-card-body"><div><span>{item.series}</span><span>{item.transcriptStatus}</span></div><h2>{item.title}</h2><p>{item.topics.map((topic) => `#${topic}`).join("  ")}</p></div>
          </article>
        ))}
      </div>
      {filtered.length === 0 && <p className="kk-media-empty">No teaching matches this search.</p>}
    </main>
  );
}
