"use client";

import { useRef, type CSSProperties } from "react";
import Image from "next/image";
import {
  BookOpenIcon,
  CheckIcon,
  GraduationCapIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";

import type { AuthBrandStats } from "@/features/auth/lib/auth-brand-stats";

const highlights = [
  {
    icon: GraduationCapIcon,
    text: "Track curriculum and academic progress",
  },
  {
    icon: ShieldCheckIcon,
    text: "Secure, role-based access for students and staff",
  },
  {
    icon: SparklesIcon,
    text: "Smart prerequisite and advising insights",
  },
] as const;

interface AuthBrandPanelProps {
  stats: AuthBrandStats;
}

export function AuthBrandPanel({ stats }: AuthBrandPanelProps) {
  const spotlightRef = useRef<HTMLDivElement>(null);
  const progressPct = Math.min(100, Math.max(0, stats.progressPct));

  return (
    <aside
      className="relative hidden overflow-hidden bg-(--pass-cod) text-(--pass-iron) lg:flex lg:flex-col lg:justify-between"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        if (spotlightRef.current) {
          spotlightRef.current.style.background = `radial-gradient(520px circle at ${x}% ${y}%, rgb(235 196 46 / 0.22), transparent 42%)`;
        }
      }}
    >
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(520px circle at 28% 32%, rgb(235 196 46 / 0.22), transparent 42%)",
        }}
        aria-hidden
      />
      <div
        className="auth-mesh pointer-events-none absolute inset-0"
        aria-hidden
      />
      <div
        className="auth-orb pointer-events-none absolute -left-16 -top-10 size-80 rounded-full bg-(--auth-orb-red-strong) blur-3xl"
        aria-hidden
      />
      <div
        className="auth-orb-delayed pointer-events-none absolute -right-10 top-1/3 size-72 rounded-full bg-(--auth-orb-gold-strong) blur-3xl"
        aria-hidden
      />
      <div
        className="auth-orb-slow pointer-events-none absolute -bottom-20 left-1/4 size-64 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="auth-grid-drift pointer-events-none absolute -inset-8 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-1 flex-col justify-center px-10 py-12 xl:px-14">
        <div className="auth-fade-up mb-10 flex items-center gap-4">
          <span className="relative shrink-0">
            <span
              className="auth-brand-glow absolute inset-0 rounded-2xl bg-(--pass-gold)/55 blur-md"
              aria-hidden
            />
            <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-2xl bg-(--pass-iron) ring-1 ring-(--pass-gold)/50">
              <Image
                src="/passlogo-small.png"
                alt="PASS College"
                width={56}
                height={56}
                className="size-12 object-contain"
                priority
              />
            </span>
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-(--pass-gold)">
              PASS College
            </p>
            <p className="mt-0.5 text-sm text-(--pass-iron)/70">
              Prerequisite Academic Support
            </p>
          </div>
        </div>

        <h1
          className="auth-fade-up font-heading text-4xl font-semibold leading-tight tracking-tight xl:text-5xl"
          style={{ animationDelay: "0.08s" }}
        >
          Plan your path
          <span className="block text-(--pass-gold)">with confidence.</span>
        </h1>
        <p
          className="auth-fade-up mt-4 max-w-md text-sm leading-relaxed text-(--pass-iron)/80"
          style={{ animationDelay: "0.16s" }}
        >
          Evaluate grades, track curriculum progress, and discover which subjects
          you are ready to take — all in one place.
        </p>

        <ul className="auth-stagger mt-10 space-y-3">
          {highlights.map(({ icon: Icon, text }) => (
            <li
              key={text}
              className="auth-highlight flex items-start gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/10"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-(--pass-gold)/20 text-(--pass-gold) ring-1 ring-(--pass-gold)/30">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="pt-1 text-sm leading-snug text-(--pass-iron)/90">
                {text}
              </span>
            </li>
          ))}
        </ul>

        <div className="auth-float mt-12 max-w-sm rounded-2xl border border-white/10 bg-white/10 p-4 shadow-[0_18px_40px_rgb(0_0_0/0.25)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-(--pass-red)/80 text-white">
                <BookOpenIcon className="size-4" aria-hidden />
              </span>
              <p className="text-sm font-medium">Curriculum progress</p>
            </div>
            <span className="text-xs font-semibold tabular-nums text-(--pass-gold)">
              {progressPct}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
            <div
              className="auth-progress-fill h-full rounded-full bg-linear-to-r from-(--pass-red) to-(--pass-gold)"
              style={{ "--auth-progress": `${progressPct}%` } as CSSProperties}
            />
          </div>
          {stats.subjects.length > 0 ? (
            <ul className="auth-stagger mt-3 space-y-1.5">
              {stats.subjects.map((subject) => (
                <li
                  key={subject.code}
                  className="flex items-start gap-2 text-xs text-(--pass-iron)/80"
                >
                  <span className="auth-subject-check mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-(--pass-gold)/20 text-(--pass-gold)">
                    <CheckIcon className="size-2.5" aria-hidden />
                  </span>
                  <span className="min-w-0 truncate leading-snug">
                    <span className="font-medium text-(--pass-iron)">{subject.code}</span>
                    <span className="text-(--pass-iron)/60">
                      {" "}
                      {subject.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-(--pass-iron)/65">{stats.readyLabel}</p>
        </div>
      </div>

      <p className="relative z-10 px-10 py-6 text-xs text-(--pass-iron)/50 xl:px-14">
        PASS College · e-Advising System
      </p>
    </aside>
  );
}
