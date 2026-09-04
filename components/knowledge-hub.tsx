import Link from "next/link";
import { ArrowRight, BookOpen, CirclePlay, Route } from "lucide-react";
import { learningPaths } from "@/lib/knowledge-hub";

export function KnowledgeHub() {
  return (
    <main className="kk-knowledge-hub">
      <header className="kk-knowledge-intro">
        <p className="kk-label">A guided entrance</p>
        <h1>Begin with a path, not a pile of pages.</h1>
        <p>Alkarkari is a living map of the Karkariya order: its lineage, foundations, teachings, vocabulary, books, and witnesses. Choose the depth that meets you.</p>
        <div className="kk-knowledge-actions">
          <Link href="/media"><CirclePlay /> Watch the teachings</Link>
          <Link href="/books"><BookOpen /> Enter the library</Link>
          <Link href="/graph"><Route /> Explore connections</Link>
        </div>
      </header>
      <div className="kk-learning-paths">
        {learningPaths.map((path, pathIndex) => (
          <section key={path.title} className="kk-learning-path">
            <div className="kk-learning-path-head">
              <span className="kk-learning-number">{String(pathIndex + 1).padStart(2, "0")}</span>
              <div><p className="kk-label">{path.eyebrow}</p><h2>{path.title}</h2><p>{path.description}</p></div>
            </div>
            <ol>{path.steps.map((step) => (
              <li key={step.href}><Link href={step.href}><span><strong>{step.title}</strong><small>{step.description}</small></span><ArrowRight aria-hidden /></Link></li>
            ))}</ol>
          </section>
        ))}
      </div>
    </main>
  );
}
