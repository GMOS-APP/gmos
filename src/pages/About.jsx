import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Map, BookOpen, ExternalLink, Share2, List, Users, Calendar } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';

const FEATURES = [
  {
    icon: Users,
    label: 'World Entities',
    desc: 'Track NPCs, locations, factions, creatures, items, player characters, and more in a searchable world database.',
  },
  {
    icon: BookOpen,
    label: 'Session Tools',
    desc: 'Plan sessions with prep notes, run encounters with initiative tracking, and log what happened for future reference.',
  },
  {
    icon: Map,
    label: 'Campaign Maps',
    desc: 'Import maps from Dyson Logos or upload your own, then pin world entities directly onto the map.',
  },
  {
    icon: List,
    label: 'Random Tables',
    desc: 'Build and roll custom random tables to generate names, encounters, weather, loot, and anything else.',
  },
  {
    icon: Share2,
    label: 'Relationship Map',
    desc: 'Visualize the web of connections between characters, factions, and locations in your world.',
  },
  {
    icon: Calendar,
    label: 'Campaign Timeline',
    desc: 'Track events, milestones, and sessions on a chronological timeline that grows with your campaign.',
  },
];

const ATTRIBUTIONS = [
  {
    name: "Lazy GM's Resource Document",
    author: 'Michael E. Shea (Sly Flourish)',
    url: 'https://slyflourish.com/lazy_gm_resource_document.html',
    description:
      'The Lazy RPG Prep methodology that underpins how GM/OS approaches session planning. The Village of Whitesparrow demo campaign is taken directly from this document.',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    name: 'D&D Systems Reference Document 5.1',
    author: 'Wizards of the Coast',
    url: 'https://dnd.wizards.com/resources/systems-reference-document',
    description:
      'Core game rules, mechanics, and terminology for the D&D 5th Edition system referenced throughout the app.',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  },
  {
    name: 'Open5e',
    author: 'Open5e contributors',
    url: 'https://open5e.com',
    description:
      'Monster stat blocks, spells, and magic items available via the Import tool. Content is published under open licenses; the applicable license varies by entry source.',
    license: 'CC BY 4.0, CC0, and Open Game License v1.0a (varies by entry)',
    licenseUrl: 'https://open5e.com',
  },
  {
    name: 'Dyson Logos Maps',
    author: 'Dyson Logos (dysonlogos.blog)',
    url: 'https://dysonlogos.blog/maps/commercial-maps/',
    description:
      'Dungeon, wilderness, and city maps browseable and importable directly into your campaigns via the Dyson Logos map importer.',
    license: 'Free for personal and commercial use with attribution',
    licenseUrl: 'https://dysonlogos.blog/maps/commercial-maps/',
  },
];

export default function About() {
  return (
    <div className="min-h-screen dark:bg-zinc-950 bg-zinc-50">
      {/* Sticky header */}
      <div className="border-b dark:border-zinc-800/60 border-zinc-200 dark:bg-zinc-950/90 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link
            to={createPageUrl('CampaignList')}
            className="inline-flex items-center gap-1.5 text-xs dark:text-zinc-500 dark:hover:text-zinc-300 text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to campaigns
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 space-y-16">

        {/* Hero */}
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-widest dark:text-zinc-100 text-zinc-900 mb-3 select-none">
            GM<span className="text-amber-600 dark:text-amber-400">/OS</span>
          </h1>
          <p className="dark:text-zinc-500 text-zinc-500 text-sm tracking-wide">
            The operating system for Game Masters.
          </p>
        </div>

        {/* About */}
        <section>
          <h2 className="text-[11px] dark:text-zinc-600 text-zinc-500 uppercase tracking-widest font-semibold mb-4">
            About
          </h2>
          <div className="space-y-3 text-sm dark:text-zinc-400 text-zinc-600 leading-relaxed">
            <p>
              GM/OS is a free campaign management tool built for Game Masters running tabletop RPG campaigns. It helps you track your world — characters, locations, factions, items, sessions, and more — in one place, so you can spend more time at the table and less time buried in notes.
            </p>
            <p>
              GM/OS is built around the Lazy GM prep philosophy from{' '}
              <a
                href="https://slyflourish.com"
                target="_blank"
                rel="noopener noreferrer"
                className="dark:text-zinc-300 text-zinc-700 underline underline-offset-2 hover:dark:text-amber-400 hover:text-amber-600 transition-colors"
              >
                Sly Flourish
              </a>
              : prep just enough to run a great game, and let the table do the rest.
            </p>
          </div>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-[11px] dark:text-zinc-600 text-zinc-500 uppercase tracking-widest font-semibold mb-5">
            Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-start gap-3.5 p-4 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold dark:text-zinc-200 text-zinc-900 mb-0.5">{label}</p>
                  <p className="text-xs dark:text-zinc-500 text-zinc-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Legal attributions */}
        <section>
          <h2 className="text-[11px] dark:text-zinc-600 text-zinc-500 uppercase tracking-widest font-semibold mb-5">
            Legal Attributions
          </h2>
          <p className="text-xs dark:text-zinc-500 text-zinc-600 mb-5 leading-relaxed">
            GM/OS incorporates content from the following open-licensed sources. All rights remain with their respective authors.
          </p>
          <div className="space-y-3">
            {ATTRIBUTIONS.map((a) => (
              <div
                key={a.name}
                className="p-4 rounded-xl dark:bg-zinc-900 bg-white border dark:border-zinc-800 border-zinc-200"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold dark:text-zinc-200 text-zinc-900 hover:dark:text-amber-400 hover:text-amber-600 inline-flex items-center gap-1.5 transition-colors"
                  >
                    {a.name}
                    <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-60" />
                  </a>
                  <span className="text-xs dark:text-zinc-600 text-zinc-500 shrink-0">{a.author}</span>
                </div>
                <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed mb-2.5">{a.description}</p>
                <a
                  href={a.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] dark:text-zinc-600 text-zinc-500 hover:dark:text-zinc-400 hover:text-zinc-700 transition-colors inline-flex items-center gap-1"
                >
                  <span className="dark:text-zinc-700 text-zinc-400 mr-0.5">License:</span>
                  {a.license}
                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Footer nav */}
        <div className="border-t dark:border-zinc-800 border-zinc-200 pt-8 text-center">
          <Link
            to={createPageUrl('CampaignList')}
            className="text-xs dark:text-zinc-600 text-zinc-500 hover:dark:text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            ← Back to campaigns
          </Link>
        </div>

      </div>
    </div>
  );
}
