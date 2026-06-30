"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { GlobeHero } from "@/components/ui/globe-hero";
import { ArrowRight, Zap } from "lucide-react";
import { Head, Link } from "@inertiajs/react";

/**
 * GlobeHeroDemo
 *
 * Landing hero using the 3D globe backdrop. All copy, tokens,
 * and typography are Sentinel-IoT SOC-brand aligned.
 *
 * Place this at the top of `welcome.tsx` to replace the current
 * text-only hero section, or use it as a standalone demo page.
 */
export default function GlobeHeroDemo() {
  const reduce = useReducedMotion();

  return (
    <>
      <Head title="Sentinel-IoT · Globe Demo" />

      <GlobeHero
        rotationSpeed={0.004}
        className="bg-gradient-to-br from-background via-background/95 to-muted/10"
      >
        {/* Ambient overlays */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/30" />
        <div className="pointer-events-none absolute left-1/4 top-1/4 size-96 motion-safe:animate-pulse rounded-full bg-sentinel-teal/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-1/4 right-1/4 size-64 motion-safe:animate-pulse rounded-full bg-sentinel-purple/5 blur-3xl" />

        {/* Grid background */}
        <div className="pointer-events-none absolute inset-0 sentinel-grid-bg opacity-40" />

        <div className="relative z-10 mx-auto max-w-5xl space-y-12 px-6 py-12 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Status pill */}
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative inline-flex items-center gap-3 rounded-full border border-sentinel-teal/30 bg-sentinel-teal/8 px-6 py-3 backdrop-blur-xl"
            >
              <div className="size-2 motion-safe:animate-ping rounded-full bg-sentinel-teal" />
              <span className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-sentinel-teal">
                Live · operational
              </span>
              <div className="size-2 motion-safe:animate-ping rounded-full bg-sentinel-teal animation-delay-500" />
            </motion.div>

            {/* Headline */}
            <div className="space-y-6">
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="select-none font-mono text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              >
                <span className="block text-3xl font-light text-foreground/70 sm:text-4xl lg:text-5xl">
                  Defend every
                </span>
                <span className="relative block">
                  <span className="relative z-10 bg-linear-to-r from-sentinel-teal via-sentinel-cyan to-sentinel-purple bg-clip-text font-semibold text-transparent">
                    connected device.
                  </span>
                  <div
                    className="absolute inset-0 scale-105 bg-linear-to-r from-sentinel-teal via-sentinel-cyan to-sentinel-purple bg-clip-text font-semibold text-transparent opacity-50 blur-2xl"
                    aria-hidden
                  >
                    connected device.
                  </div>
                </span>
              </motion.h1>
            </div>

            {/* Subtext */}
            <motion.div
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mx-auto max-w-2xl space-y-4"
            >
              <p className="text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl">
                An autonomous Security Operations Center for IoT fleets.
                Stream telemetry, detect anomalies, audit MQTT traffic,
                and resolve incidents through an AI co-pilot.
              </p>
            </motion.div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row sm:gap-6"
          >
            <motion.div
              whileHover={reduce ? {} : { scale: 1.05, y: -2 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
            >
              <Link
                href="/login"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-sentinel-teal px-6 py-3 text-sm font-semibold text-[#020617] shadow-[0_0_28px_rgba(31,230,208,0.35)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-teal focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-4 sm:text-base"
              >
                <span className="relative z-10 tracking-wide">
                  Enter Console
                </span>
                <ArrowRight className="relative z-10 size-4 transition-transform duration-300 group-hover:translate-x-1 sm:size-5" />
              </Link>
            </motion.div>

            <motion.div
              whileHover={reduce ? {} : { scale: 1.05, y: -2 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
            >
              <a
                href="https://github.com/nabiilnuryassar/sentinel-iot"
                target="_blank"
                rel="noreferrer"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl border border-border/40 bg-card/40 px-6 py-3 text-sm font-medium text-foreground backdrop-blur-xl transition-all duration-200 hover:border-sentinel-cyan/40 hover:text-sentinel-cyan focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-8 sm:py-4 sm:text-base"
              >
                <Zap className="relative z-10 size-4 transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 sm:size-5" />
                <span className="relative z-10 tracking-wide">
                  View Source
                </span>
              </a>
            </motion.div>
          </motion.div>

          {/* Live metric ticker strip */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-xs text-muted-foreground sm:gap-x-10"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sentinel-emerald" />
              1,102 devices
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sentinel-teal" />
              428 threats blocked
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sentinel-cyan" />
              184k events/day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-sentinel-purple" />
              99.97% uptime
            </span>
          </motion.div>
        </div>
      </GlobeHero>
    </>
  );
}
