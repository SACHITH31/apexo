import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Gamepad2, RotateCcw, Sparkles } from "lucide-react";
import { seasonQueryOptions, teamOf, useSeason, type SeasonData } from "@/lib/f1-data";
import { PageSkeleton } from "@/components/Skeletons";
import { ShareCard } from "@/components/ShareCard";

export const Route = createFileRoute("/playground")({
  head: () => ({
    meta: [
      { title: "F1 Playground · Apexo" },
      {
        name: "description",
        content: "Test your Formula 1 knowledge with offline quizzes built from the current season's grid, teams and circuits.",
      },
      { property: "og:title", content: "F1 Playground · Apexo" },
      { property: "og:description", content: "Quick-fire Formula 1 quizzes and games — playable offline in Apexo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(seasonQueryOptions());
  },
  component: PlaygroundPage,
  pendingComponent: PageSkeleton,
});

interface Question {
  id: string;
  prompt: string;
  hint?: string;
  options: string[];
  answer: string;
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestions(data: SeasonData, count = 8): Question[] {
  const drivers = data.drivers;
  const teamNames = [...new Set(drivers.map((d) => teamOf(data, d.team).name))];
  const circuits = Object.values(data.circuits);
  const qs: Question[] = [];

  for (const d of shuffle(drivers).slice(0, count)) {
    const correct = teamOf(data, d.team).name;
    const roll = Math.random();

    if (roll < 0.4) {
      qs.push({
        id: `team-${d.id}`,
        prompt: `Which team does ${d.firstName} ${d.lastName} drive for?`,
        hint: `${d.flag} ${d.nationality}`,
        options: shuffle([correct, ...shuffle(teamNames.filter((t) => t !== correct)).slice(0, 3)]),
        answer: correct,
      });
    } else if (roll < 0.7) {
      const num = String(d.number);
      const others = shuffle(drivers.filter((x) => x.id !== d.id))
        .slice(0, 3)
        .map((x) => String(x.number));
      qs.push({
        id: `number-${d.id}`,
        prompt: `What is ${d.firstName} ${d.lastName}'s car number?`,
        hint: correct,
        options: shuffle([num, ...others]),
        answer: num,
      });
    } else {
      const c = circuits[Math.floor(Math.random() * circuits.length)];
      if (!c) continue;
      const others = shuffle(circuits.filter((x) => x.id !== c.id))
        .slice(0, 3)
        .map((x) => x.country);
      qs.push({
        id: `circuit-${c.id}-${d.id}`,
        prompt: `Which country hosts ${c.name}?`,
        hint: `${c.location}`,
        options: shuffle([c.country, ...others.filter((o) => o !== c.country)]),
        answer: c.country,
      });
    }
  }

  return qs.slice(0, count).filter((q) => q.options.length >= 2);
}

function PlaygroundPage() {
  const data = useSeason();
  const [seed, setSeed] = useState(0);
  // Questions are randomised, so they are only generated after hydration.
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    setQuestions(buildQuestions(data));
  }, [data, seed]);

  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const q = questions[index];
  const done = questions.length > 0 && index >= questions.length;

  const restart = useCallback(() => {
    setSeed((s) => s + 1);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
  }, []);

  const choose = (option: string) => {
    if (picked) return;
    setPicked(option);
    if (option === q.answer) {
      setScore((s) => s + 1);
      setStreak((s) => {
        const next = s + 1;
        setBest((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setPicked(null);
      setIndex((i) => i + 1);
    }, 900);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-10">
      <header className="relative overflow-hidden rounded-2xl carbon-texture team-aura border border-border p-6 sm:p-8 animate-slide-up">
        <div className="absolute inset-y-0 left-0 w-1 accent-line" />
        <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.04]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            <Gamepad2 className="h-3 w-3" /> Playable offline
          </div>
          <h1 className="mt-1 font-display text-4xl sm:text-6xl leading-none">Playground</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Quick-fire questions generated from the {data.season} grid, teams and circuits.
          </p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Score" value={`${score}/${questions.length}`} />
        <Stat label="Streak" value={String(streak)} highlight={streak >= 3} />
        <Stat label="Best streak" value={String(best)} />
      </div>

      {!questions.length ? (
        <section className="mt-5 glass rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Building your quiz…
        </section>
      ) : !done && q ? (
        <section key={q.id} className="mt-5 glass rounded-2xl p-5 sm:p-7 animate-page-in">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            <span>
              Question {index + 1} / {questions.length}
            </span>
            {q.hint && <span>{q.hint}</span>}
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-surface/70 overflow-hidden">
            <div
              className="h-full accent-line transition-[width] duration-500"
              style={{ width: `${(index / questions.length) * 100}%` }}
            />
          </div>

          <h2 className="mt-4 font-display text-2xl sm:text-3xl leading-tight">{q.prompt}</h2>

          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {q.options.map((o) => {
              const state =
                picked === null ? "idle" : o === q.answer ? "correct" : o === picked ? "wrong" : "dim";
              return (
                <li key={o}>
                  <button
                    onClick={() => choose(o)}
                    disabled={picked !== null}
                    className={
                      "w-full min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-semibold uppercase tracking-wider transition-all active:scale-[0.98] " +
                      (state === "correct"
                        ? "border-accent bg-accent/15 text-accent-glow"
                        : state === "wrong"
                          ? "border-destructive/60 bg-destructive/10 text-destructive"
                          : state === "dim"
                            ? "border-border bg-surface/30 text-muted-foreground opacity-60"
                            : "border-border bg-surface/50 hover:border-accent/50 hover:bg-surface")
                    }
                  >
                    {o}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="mt-5 relative overflow-hidden glass rounded-2xl p-8 text-center animate-page-in">
          <div className="pointer-events-none absolute inset-0 checker-flag opacity-[0.05]" />
          <div className="relative">
            <Sparkles className="mx-auto h-6 w-6 text-accent" />
            <h2 className="mt-3 font-display text-4xl">Chequered flag</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You scored {score} of {questions.length} · best streak {best}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={restart}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-accent-glow hover:bg-accent/15"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Play again
              </button>
              <ShareCard
                eyebrow="F1 Playground"
                title={`${score} / ${questions.length}`}
                subtitle={`${data.season} season quiz`}
                fileName="apexo-quiz"
                stats={[
                  { label: "Score", value: `${score}/${questions.length}` },
                  { label: "Best streak", value: String(best) },
                ]}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={
        "rounded-2xl border p-4 text-center " +
        (highlight ? "carbon-texture border-accent/40" : "border-border bg-surface/40")
      }
    >
      <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className={"mt-1 font-timing tabular-nums text-2xl " + (highlight ? "text-gradient-accent" : "")}>{value}</div>
    </div>
  );
}
