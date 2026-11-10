import React, { useState } from 'react';
import { Broker } from '../../../shared/src/types.ts';
import { BrokerSymbol } from './BrokerSymbol.tsx';

export interface AnimalAvatarPreset {
  id: string;
  label: string;
  archetype: string;
  accentColor: string;
  secondaryColor: string;
  url: string;
}

interface TraderAvatarProps {
  username: string;
  avatarUrl?: string;
  broker?: Broker;
  symbol?: string;
  size?: number;
  showOnlineRing?: boolean;
  showBrokerBadge?: boolean;
  isChampion?: boolean;
}

const svgToDataUri = (svg: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.trim().replace(/\s+/g, ' '))}`;

/**
 * 12 bespoke institutional animal avatar crests — each with a unique color palette,
 * multi-layered geometric facet design, glowing eyes, and metallic/neon rim lighting.
 */
export const INSTITUTIONAL_ANIMAL_PRESETS: AnimalAvatarPreset[] = [
  {
    id: 'bull',
    label: 'Golden Bull',
    archetype: 'Macro Breakout',
    accentColor: '#fbbf24',
    secondaryColor: '#f59e0b',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-bull" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#451a03"/>
            <stop offset="60%" stop-color="#1c0a02"/>
            <stop offset="100%" stop-color="#090401"/>
          </radialGradient>
          <linearGradient id="gold-main" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="45%" stop-color="#fbbf24"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
          <linearGradient id="gold-dark" x1="60" y1="30" x2="60" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#d97706"/>
            <stop offset="100%" stop-color="#78350f"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-bull)"/>
        <circle cx="60" cy="60" r="50" stroke="#fbbf24" stroke-opacity="0.22" stroke-width="1.5" stroke-dasharray="6 4"/>
        <polygon points="60,10 104,35 104,85 60,110 16,85 16,35" stroke="#f59e0b" stroke-opacity="0.3" stroke-width="1.5" fill="#fbbf24" fill-opacity="0.04"/>
        <!-- Sweeping Bull Horns -->
        <path d="M14 22 C12 42, 24 52, 38 48 L34 36 C24 36, 20 30, 14 22 Z" fill="url(#gold-main)" stroke="#fef08a" stroke-width="1.2"/>
        <path d="M106 22 C108 42, 96 52, 82 48 L86 36 C96 36, 100 30, 106 22 Z" fill="url(#gold-main)" stroke="#fef08a" stroke-width="1.2"/>
        <!-- Ears -->
        <polygon points="22,52 36,48 32,60" fill="url(#gold-dark)"/>
        <polygon points="98,52 84,48 88,60" fill="url(#gold-dark)"/>
        <!-- Head Facets -->
        <polygon points="36,36 60,28 84,36 90,62 76,92 60,100 44,92 30,62" fill="url(#gold-dark)" stroke="#fbbf24" stroke-width="1.5"/>
        <polygon points="60,28 84,36 78,66 60,78 42,66 36,36" fill="url(#gold-main)"/>
        <polygon points="60,28 60,78 42,66 36,36" fill="#fde047" fill-opacity="0.28"/>
        <!-- Forehead Diamond Crest -->
        <polygon points="60,35 67,46 60,57 53,46" fill="#090401" stroke="#fef08a" stroke-width="1.5"/>
        <!-- Glowing Eyes -->
        <polygon points="38,56 51,61 42,65" fill="#00f0ff"/>
        <polygon points="82,56 69,61 78,65" fill="#00f0ff"/>
        <!-- Armored Snout & Nose Ring -->
        <polygon points="44,74 60,68 76,74 72,93 60,99 48,93" fill="#451a03" stroke="#fbbf24" stroke-width="1.5"/>
        <polygon points="49,81 55,84 51,89" fill="#fbbf24"/>
        <polygon points="71,81 65,84 69,89" fill="#fbbf24"/>
        <path d="M48 95 C48 107, 72 107, 72 95" stroke="#fef08a" stroke-width="3.5" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'wolf',
    label: 'Tiffany Wolf',
    archetype: 'Alpha Pack Leader',
    accentColor: '#00f0ff',
    secondaryColor: '#0abab5',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-wolf" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#083a42"/>
            <stop offset="60%" stop-color="#041920"/>
            <stop offset="100%" stop-color="#020b0e"/>
          </radialGradient>
          <linearGradient id="wolf-main" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#ccfbf1"/>
            <stop offset="50%" stop-color="#2dd4bf"/>
            <stop offset="100%" stop-color="#0d9488"/>
          </linearGradient>
          <linearGradient id="wolf-dark" x1="60" y1="20" x2="60" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#0f766e"/>
            <stop offset="100%" stop-color="#115e59"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-wolf)"/>
        <circle cx="60" cy="60" r="50" stroke="#00f0ff" stroke-opacity="0.25" stroke-width="1.5"/>
        <polygon points="60,8 106,34 106,86 60,112 14,86 14,34" stroke="#0abab5" stroke-opacity="0.3" stroke-width="1.2"/>
        <!-- Sharp Wolf Ears -->
        <polygon points="26,14 48,36 22,48" fill="url(#wolf-main)" stroke="#99f6e4" stroke-width="1.5"/>
        <polygon points="94,14 72,36 98,48" fill="url(#wolf-main)" stroke="#99f6e4" stroke-width="1.5"/>
        <polygon points="30,22 44,36 27,44" fill="#042f2e"/>
        <polygon points="90,22 76,36 93,44" fill="#042f2e"/>
        <!-- Cheek Ruff Facets -->
        <polygon points="16,58 32,44 98,58 88,44 104,58 90,82 60,106 30,82" fill="url(#wolf-dark)" stroke="#2dd4bf" stroke-width="1.4"/>
        <!-- Main Face Shield -->
        <polygon points="32,38 60,30 88,38 94,64 60,104 26,64" fill="url(#wolf-main)" stroke="#ccfbf1" stroke-width="1.2"/>
        <!-- Center Bridge & Snout -->
        <polygon points="60,30 72,56 60,94 48,56" fill="#042f2e" fill-opacity="0.65"/>
        <!-- Glowing Cyber Eyes -->
        <polygon points="35,55 50,61 39,65" fill="#fef08a"/>
        <polygon points="85,55 70,61 81,65" fill="#fef08a"/>
        <!-- Nose & Fang Mark -->
        <polygon points="52,86 68,86 60,98" fill="#020b0e" stroke="#00f0ff" stroke-width="1.5"/>
        <path d="M50 98 L60 104 L70 98" stroke="#99f6e4" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'bear',
    label: 'Crimson Bear',
    archetype: 'Short Liquidity Hunter',
    accentColor: '#f43f5e',
    secondaryColor: '#fb7185',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-bear" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#4c0519"/>
            <stop offset="60%" stop-color="#1f030b"/>
            <stop offset="100%" stop-color="#0b0104"/>
          </radialGradient>
          <linearGradient id="bear-main" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fda4af"/>
            <stop offset="45%" stop-color="#f43f5e"/>
            <stop offset="100%" stop-color="#9f1239"/>
          </linearGradient>
          <linearGradient id="bear-dark" x1="60" y1="25" x2="60" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#be123c"/>
            <stop offset="100%" stop-color="#4c0519"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-bear)"/>
        <circle cx="60" cy="60" r="50" stroke="#f43f5e" stroke-opacity="0.25" stroke-width="1.5" stroke-dasharray="8 4"/>
        <!-- Rounded Armored Bear Ears -->
        <circle cx="28" cy="30" r="13" fill="url(#bear-main)" stroke="#fda4af" stroke-width="1.5"/>
        <circle cx="92" cy="30" r="13" fill="url(#bear-main)" stroke="#fda4af" stroke-width="1.5"/>
        <circle cx="28" cy="30" r="6" fill="#4c0519"/>
        <circle cx="92" cy="30" r="6" fill="#4c0519"/>
        <!-- Heavy Jaw & Skull -->
        <polygon points="24,42 60,24 96,42 104,72 84,102 60,108 36,102 16,72" fill="url(#bear-dark)" stroke="#fb7185" stroke-width="1.5"/>
        <polygon points="32,38 60,28 88,38 94,68 76,94 44,94 26,68" fill="url(#bear-main)"/>
        <!-- Brow Scar / Crest -->
        <polygon points="40,46 60,54 80,46 76,38 60,44 44,38" fill="#4c0519"/>
        <!-- Glowing Eyes -->
        <polygon points="34,54 49,59 38,63" fill="#fde047"/>
        <polygon points="86,54 71,59 82,63" fill="#fde047"/>
        <!-- Powerful Muzzle & Fangs -->
        <polygon points="42,66 60,60 78,66 82,92 60,102 38,92" fill="#2e020d" stroke="#fda4af" stroke-width="1.5"/>
        <polygon points="51,70 69,70 60,81" fill="#fb7185"/>
        <!-- Lower Fangs -->
        <polygon points="45,92 50,83 54,93" fill="#ffffff"/>
        <polygon points="75,92 70,83 66,93" fill="#ffffff"/>
        <path d="M46 92 H74" stroke="#f43f5e" stroke-width="2"/>
      </svg>
    `),
  },
  {
    id: 'lion',
    label: 'Imperial Lion',
    archetype: 'Sovereign Crown',
    accentColor: '#c084fc',
    secondaryColor: '#fbbf24',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-lion" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#3b0764"/>
            <stop offset="65%" stop-color="#170329"/>
            <stop offset="100%" stop-color="#08010f"/>
          </radialGradient>
          <linearGradient id="lion-mane" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#e9d5ff"/>
            <stop offset="45%" stop-color="#a855f7"/>
            <stop offset="100%" stop-color="#581c87"/>
          </linearGradient>
          <linearGradient id="lion-face" x1="35" y1="30" x2="85" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="50%" stop-color="#f59e0b"/>
            <stop offset="100%" stop-color="#b45309"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-lion)"/>
        <!-- Starburst Geometric Mane -->
        <polygon points="60,8 78,16 98,18 104,38 112,58 102,78 96,98 78,104 60,114 42,104 24,98 18,78 8,58 16,38 22,18 42,16" fill="url(#lion-mane)" stroke="#e9d5ff" stroke-width="1.5"/>
        <!-- Crown Top -->
        <polygon points="42,24 50,34 60,19 70,34 78,24 75,38 45,38" fill="#fef08a" stroke="#f59e0b" stroke-width="1.2"/>
        <!-- Regal Golden Face -->
        <polygon points="36,38 60,32 84,38 88,68 74,94 60,100 46,94 32,68" fill="url(#lion-face)" stroke="#fef08a" stroke-width="1.4"/>
        <!-- Nose Bridge -->
        <polygon points="60,36 68,68 60,78 52,68" fill="#78350f" fill-opacity="0.45"/>
        <!-- Glowing Eyes -->
        <polygon points="38,55 51,60 41,64" fill="#00f0ff"/>
        <polygon points="82,55 69,60 79,64" fill="#00f0ff"/>
        <!-- Muzzle -->
        <polygon points="46,76 60,72 74,76 70,92 60,96 50,92" fill="#2e1065" stroke="#fde047" stroke-width="1.4"/>
        <polygon points="53,76 67,76 60,85" fill="#fbbf24"/>
      </svg>
    `),
  },
  {
    id: 'viper',
    label: 'Emerald Viper',
    archetype: 'Precision Scalper',
    accentColor: '#10b981',
    secondaryColor: '#4ade80',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-viper" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#064e3b"/>
            <stop offset="65%" stop-color="#022c22"/>
            <stop offset="100%" stop-color="#01110d"/>
          </radialGradient>
          <linearGradient id="viper-hood" x1="15" y1="20" x2="105" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#6ee7b7"/>
            <stop offset="50%" stop-color="#10b981"/>
            <stop offset="100%" stop-color="#047857"/>
          </linearGradient>
          <linearGradient id="viper-head" x1="40" y1="25" x2="80" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#bbf7d0"/>
            <stop offset="50%" stop-color="#22c55e"/>
            <stop offset="100%" stop-color="#15803d"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-viper)"/>
        <circle cx="60" cy="60" r="50" stroke="#10b981" stroke-opacity="0.25" stroke-width="1.5"/>
        <!-- Cobra Outer Hood -->
        <path d="M60 12 L98 32 L106 64 L84 96 L60 108 L36 96 L14 64 L22 32 Z" fill="url(#viper-hood)" stroke="#a7f3d0" stroke-width="1.5"/>
        <!-- Hood Markings -->
        <polygon points="24,48 36,42 32,68 20,62" fill="#022c22"/>
        <polygon points="96,48 84,42 88,68 100,62" fill="#022c22"/>
        <!-- Viper Diamond Head -->
        <polygon points="60,20 86,42 78,78 60,92 42,78 34,42" fill="url(#viper-head)" stroke="#dcfce7" stroke-width="1.5"/>
        <!-- Scales Pattern -->
        <polygon points="60,28 68,40 60,52 52,40" fill="#022c22" stroke="#4ade80" stroke-width="1"/>
        <!-- Slit Venom Eyes -->
        <polygon points="39,52 54,59 42,63" fill="#fde047"/>
        <polygon points="81,52 66,59 78,63" fill="#fde047"/>
        <!-- Razor Fangs & Forked Tongue -->
        <polygon points="47,82 51,98 55,85" fill="#ffffff"/>
        <polygon points="73,82 69,98 65,85" fill="#ffffff"/>
        <path d="M60 92 V103 M60 103 L54 110 M60 103 L66 110" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `),
  },
  {
    id: 'falcon',
    label: 'Solar Falcon',
    archetype: 'High-Frequency Momentum',
    accentColor: '#38bdf8',
    secondaryColor: '#fb923c',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-falcon" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#0c4a6e"/>
            <stop offset="65%" stop-color="#082f49"/>
            <stop offset="100%" stop-color="#03111c"/>
          </radialGradient>
          <linearGradient id="falcon-wing" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#bae6fd"/>
            <stop offset="50%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#1e3a8a"/>
          </linearGradient>
          <linearGradient id="falcon-beak" x1="60" y1="55" x2="60" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="55%" stop-color="#fb923c"/>
            <stop offset="100%" stop-color="#ea580c"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-falcon)"/>
        <circle cx="60" cy="60" r="50" stroke="#38bdf8" stroke-opacity="0.28" stroke-width="1.5"/>
        <!-- Swept Crest Feathers -->
        <polygon points="14,24 44,32 60,14 76,32 106,24 94,58 104,76 60,106 16,76 26,58" fill="url(#falcon-wing)" stroke="#7dd3fc" stroke-width="1.5"/>
        <!-- Inner White/Ice Plume -->
        <polygon points="34,40 60,26 86,40 82,70 60,90 38,70" fill="#e0f2fe"/>
        <polygon points="34,40 60,52 86,40 78,32 60,38 42,32" fill="#0c4a6e"/>
        <!-- Piercing Raptor Eyes -->
        <polygon points="36,52 52,58 40,62" fill="#fb923c"/>
        <polygon points="84,52 68,58 80,62" fill="#fb923c"/>
        <!-- Hooked Golden Beak -->
        <polygon points="48,64 60,56 72,64 60,104" fill="url(#falcon-beak)" stroke="#fef08a" stroke-width="1.5"/>
        <line x1="60" y1="56" x2="60" y2="102" stroke="#9a3412" stroke-width="1.5"/>
      </svg>
    `),
  },
  {
    id: 'panther',
    label: 'Stealth Panther',
    archetype: 'Dark Pool Execution',
    accentColor: '#e879f9',
    secondaryColor: '#818cf8',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-panther" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#2e1065"/>
            <stop offset="60%" stop-color="#0f0720"/>
            <stop offset="100%" stop-color="#05020a"/>
          </radialGradient>
          <linearGradient id="panther-armor" x1="25" y1="20" x2="95" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#4c1d95"/>
            <stop offset="50%" stop-color="#1e1b4b"/>
            <stop offset="100%" stop-color="#090614"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-panther)"/>
        <polygon points="60,8 106,34 106,86 60,112 14,86 14,34" stroke="#e879f9" stroke-opacity="0.35" stroke-width="1.5"/>
        <!-- Sleek Panther Ears -->
        <polygon points="24,18 46,32 26,48" fill="url(#panther-armor)" stroke="#e879f9" stroke-width="1.6"/>
        <polygon points="96,18 74,32 94,48" fill="url(#panther-armor)" stroke="#e879f9" stroke-width="1.6"/>
        <!-- Faceted Obsidian Skull -->
        <polygon points="28,36 60,26 92,36 98,66 80,96 60,104 40,96 22,66" fill="url(#panther-armor)" stroke="#c084fc" stroke-width="1.6"/>
        <!-- Neon Chrome Cheek Contours -->
        <path d="M28 62 L46 74 M92 62 L74 74" stroke="#e879f9" stroke-width="2" stroke-linecap="round"/>
        <polygon points="60,32 66,46 60,60 54,46" fill="#e879f9" fill-opacity="0.35"/>
        <!-- Glowing Magenta Eyes -->
        <polygon points="34,54 50,59 38,64" fill="#f0abfc"/>
        <polygon points="86,54 70,59 82,64" fill="#f0abfc"/>
        <!-- Muzzle & Fangs -->
        <polygon points="46,74 60,68 74,74 70,94 60,100 50,94" fill="#090514" stroke="#818cf8" stroke-width="1.5"/>
        <polygon points="53,76 67,76 60,84" fill="#e879f9"/>
        <polygon points="49,92 52,99 55,93" fill="#ffffff"/>
        <polygon points="71,92 68,99 65,93" fill="#ffffff"/>
      </svg>
    `),
  },
  {
    id: 'shark',
    label: 'Abyssal Shark',
    archetype: 'Whale Orderflow',
    accentColor: '#22d3ee',
    secondaryColor: '#38bdf8',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-shark" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#083344"/>
            <stop offset="65%" stop-color="#041824"/>
            <stop offset="100%" stop-color="#01090f"/>
          </radialGradient>
          <linearGradient id="shark-body" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#cffafe"/>
            <stop offset="45%" stop-color="#06b6d4"/>
            <stop offset="100%" stop-color="#0e7490"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-shark)"/>
        <circle cx="60" cy="60" r="50" stroke="#22d3ee" stroke-opacity="0.28" stroke-width="1.5" stroke-dasharray="5 5"/>
        <!-- Dorsal & Pectoral Crest -->
        <polygon points="60,10 92,48 108,68 88,74 82,98 60,108 38,98 32,74 12,68 28,48" fill="url(#shark-body)" stroke="#a5f3fc" stroke-width="1.5"/>
        <!-- Gill Slits -->
        <path d="M26 56 L34 62 M24 62 L32 68 M94 56 L86 62 M96 62 L88 68" stroke="#083344" stroke-width="2.2" stroke-linecap="round"/>
        <!-- Angry Predator Eyes -->
        <polygon points="36,48 50,54 38,57" fill="#fef08a"/>
        <polygon points="84,48 70,54 82,57" fill="#fef08a"/>
        <!-- Razor Jaw Cavern -->
        <polygon points="40,70 60,62 80,70 74,96 60,102 46,96" fill="#020b12" stroke="#22d3ee" stroke-width="1.5"/>
        <!-- Serrated Teeth -->
        <polygon points="44,70 49,78 54,70 60,79 66,70 71,78 76,70" fill="#ffffff"/>
        <polygon points="47,94 52,86 57,94 60,86 63,94 68,86 73,94" fill="#ffffff"/>
      </svg>
    `),
  },
  {
    id: 'fox',
    label: 'Cyber Kitsune',
    archetype: 'Algorithmic Arbitrage',
    accentColor: '#fb923c',
    secondaryColor: '#f43f5e',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-fox" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#431407"/>
            <stop offset="65%" stop-color="#1c0802"/>
            <stop offset="100%" stop-color="#0a0301"/>
          </radialGradient>
          <linearGradient id="fox-main" x1="20" y1="15" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fed7aa"/>
            <stop offset="45%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#dc2626"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-fox)"/>
        <circle cx="60" cy="60" r="50" stroke="#fb923c" stroke-opacity="0.25" stroke-width="1.5"/>
        <!-- Tall Kitsune Ears -->
        <polygon points="20,12 50,36 24,54" fill="url(#fox-main)" stroke="#fed7aa" stroke-width="1.5"/>
        <polygon points="100,12 70,36 96,54" fill="url(#fox-main)" stroke="#fed7aa" stroke-width="1.5"/>
        <polygon points="25,20 44,36 28,48" fill="#1c0802"/>
        <polygon points="95,20 76,36 92,48" fill="#1c0802"/>
        <!-- Angular Fox Mask -->
        <polygon points="20,54 60,30 100,54 60,106" fill="url(#fox-main)" stroke="#ffedd5" stroke-width="1.5"/>
        <!-- White Cheek Plates -->
        <polygon points="20,54 48,72 60,106 32,82" fill="#fff7ed"/>
        <polygon points="100,54 72,72 60,106 88,82" fill="#fff7ed"/>
        <!-- Glowing Cyan Eyes -->
        <polygon points="35,55 50,62 39,65" fill="#00f0ff"/>
        <polygon points="85,55 70,62 81,65" fill="#00f0ff"/>
        <!-- Nose Point -->
        <polygon points="53,92 67,92 60,105" fill="#0a0301"/>
      </svg>
    `),
  },
  {
    id: 'owl',
    label: 'Quantum Owl',
    archetype: 'Night Session Quant',
    accentColor: '#a5b4fc',
    secondaryColor: '#38bdf8',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-owl" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#1e1b4b"/>
            <stop offset="65%" stop-color="#0f0d26"/>
            <stop offset="100%" stop-color="#05040d"/>
          </radialGradient>
          <linearGradient id="owl-plume" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#e0e7ff"/>
            <stop offset="50%" stop-color="#6366f1"/>
            <stop offset="100%" stop-color="#312e81"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-owl)"/>
        <!-- Swept Brow Horns -->
        <polygon points="16,20 52,38 60,28 68,38 104,20 96,52 94,86 60,108 26,86 24,52" fill="url(#owl-plume)" stroke="#c7d2fe" stroke-width="1.5"/>
        <!-- Radar Ocular Rings -->
        <circle cx="43" cy="58" r="15" fill="#0f0d26" stroke="#38bdf8" stroke-width="2.2"/>
        <circle cx="77" cy="58" r="15" fill="#0f0d26" stroke="#38bdf8" stroke-width="2.2"/>
        <circle cx="43" cy="58" r="7" fill="#00f0ff"/>
        <circle cx="77" cy="58" r="7" fill="#00f0ff"/>
        <circle cx="45" cy="56" r="2.5" fill="#ffffff"/>
        <circle cx="79" cy="56" r="2.5" fill="#ffffff"/>
        <!-- Brow V-Crest -->
        <polygon points="24,26 60,52 96,26 88,22 60,42 32,22" fill="#e0e7ff"/>
        <!-- Diamond Beak -->
        <polygon points="60,64 68,76 60,94 52,76" fill="#fbbf24" stroke="#fef08a" stroke-width="1.4"/>
      </svg>
    `),
  },
  {
    id: 'dragon',
    label: 'Jade Dragon',
    archetype: 'Asian Session Sovereign',
    accentColor: '#2dd4bf',
    secondaryColor: '#facc15',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-dragon" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#134e4a"/>
            <stop offset="65%" stop-color="#042f2e"/>
            <stop offset="100%" stop-color="#021212"/>
          </radialGradient>
          <linearGradient id="dragon-jade" x1="20" y1="15" x2="100" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#99f6e4"/>
            <stop offset="50%" stop-color="#14b8a6"/>
            <stop offset="100%" stop-color="#0f766e"/>
          </linearGradient>
          <linearGradient id="dragon-gold" x1="20" y1="10" x2="100" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fef08a"/>
            <stop offset="100%" stop-color="#f59e0b"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-dragon)"/>
        <!-- Imperial Golden Antlers/Horns -->
        <polygon points="22,10 44,32 34,38 14,18" fill="url(#dragon-gold)" stroke="#fef08a" stroke-width="1.2"/>
        <polygon points="98,10 76,32 86,38 106,18" fill="url(#dragon-gold)" stroke="#fef08a" stroke-width="1.2"/>
        <!-- Side Fin Spines -->
        <polygon points="10,44 32,42 26,64 12,60" fill="url(#dragon-gold)"/>
        <polygon points="110,44 88,42 94,64 108,60" fill="url(#dragon-gold)"/>
        <!-- Scaled Dragon Head -->
        <polygon points="34,32 60,22 86,32 92,66 76,98 60,108 44,98 28,66" fill="url(#dragon-jade)" stroke="#99f6e4" stroke-width="1.5"/>
        <!-- Forehead Pearl -->
        <circle cx="60" cy="38" r="6" fill="#facc15" stroke="#fef08a" stroke-width="1.5"/>
        <!-- Dragonfire Eyes -->
        <polygon points="36,54 52,60 40,64" fill="#fde047"/>
        <polygon points="84,54 68,60 80,64" fill="#fde047"/>
        <!-- Snout & Whiskers -->
        <path d="M36 78 C18 76, 14 88, 22 96 M84 78 C102 76, 106 88, 98 96" stroke="#facc15" stroke-width="2.5" stroke-linecap="round"/>
        <polygon points="46,74 60,68 74,74 70,96 60,102 50,96" fill="#042f2e" stroke="#facc15" stroke-width="1.4"/>
      </svg>
    `),
  },
  {
    id: 'tiger',
    label: 'Blaze Tiger',
    archetype: 'Apex Volatility Striker',
    accentColor: '#ff6b00',
    secondaryColor: '#fde047',
    url: svgToDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="bg-tiger" cx="50%" cy="35%" r="75%">
            <stop offset="0%" stop-color="#431407"/>
            <stop offset="65%" stop-color="#1f0902"/>
            <stop offset="100%" stop-color="#0c0300"/>
          </radialGradient>
          <linearGradient id="tiger-coat" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="45%" stop-color="#f97316"/>
            <stop offset="100%" stop-color="#c2410c"/>
          </linearGradient>
        </defs>
        <rect width="120" height="120" rx="26" fill="url(#bg-tiger)"/>
        <!-- Tiger Ears -->
        <circle cx="28" cy="28" r="12" fill="url(#tiger-coat)" stroke="#fde047" stroke-width="1.5"/>
        <circle cx="92" cy="28" r="12" fill="url(#tiger-coat)" stroke="#fde047" stroke-width="1.5"/>
        <!-- Main Tiger Head -->
        <polygon points="24,40 60,24 96,40 104,68 84,98 60,108 36,98 16,68" fill="url(#tiger-coat)" stroke="#fef08a" stroke-width="1.5"/>
        <!-- White Jaw Ruffs -->
        <polygon points="16,68 38,68 44,96 28,90" fill="#fffbeb"/>
        <polygon points="104,68 82,68 76,96 92,90" fill="#fffbeb"/>
        <!-- Obsidian Tiger Stripes -->
        <polygon points="26,44 44,48 30,52" fill="#0c0300"/>
        <polygon points="94,44 76,48 90,52" fill="#0c0300"/>
        <polygon points="20,62 36,64 22,70" fill="#0c0300"/>
        <polygon points="100,62 84,64 98,70" fill="#0c0300"/>
        <polygon points="56,28 64,28 60,46" fill="#0c0300"/>
        <!-- Ice Blue Eyes -->
        <polygon points="36,54 50,59 39,63" fill="#00f0ff"/>
        <polygon points="84,54 70,59 81,63" fill="#00f0ff"/>
        <!-- Muzzle & Fangs -->
        <polygon points="44,72 60,66 76,72 72,94 60,100 48,94" fill="#1c0a00" stroke="#fde047" stroke-width="1.4"/>
        <polygon points="52,72 68,72 60,82" fill="#fb7185"/>
        <polygon points="48,92 52,100 55,92" fill="#ffffff"/>
        <polygon points="72,92 68,100 65,92" fill="#ffffff"/>
      </svg>
    `),
  },
];

// Deterministic mapping for featured leaderboard & community traders
const TRADER_PRESET_MAP: Record<string, string> = {
  'FX_Sniper': INSTITUTIONAL_ANIMAL_PRESETS[0].url,      // Golden Bull
  'GoldBug_JP': INSTITUTIONAL_ANIMAL_PRESETS[10].url,    // Jade Dragon
  'AlphaWave': INSTITUTIONAL_ANIMAL_PRESETS[1].url,      // Tiffany Wolf
  'ZenScalper': INSTITUTIONAL_ANIMAL_PRESETS[4].url,     // Emerald Viper
  'TokyoRider': INSTITUTIONAL_ANIMAL_PRESETS[8].url,     // Cyber Kitsune
  'ApexTrader_FX': INSTITUTIONAL_ANIMAL_PRESETS[3].url,  // Imperial Lion
  'CryptoKing_99': INSTITUTIONAL_ANIMAL_PRESETS[6].url,  // Stealth Panther
  'ApexPredator': INSTITUTIONAL_ANIMAL_PRESETS[7].url,   // Abyssal Shark
  'OsakaTrader': INSTITUTIONAL_ANIMAL_PRESETS[11].url,   // Blaze Tiger
  'NovaFX': INSTITUTIONAL_ANIMAL_PRESETS[5].url,         // Solar Falcon
  'AlphaTrader': INSTITUTIONAL_ANIMAL_PRESETS[9].url,    // Quantum Owl
  'Marcus_V': INSTITUTIONAL_ANIMAL_PRESETS[2].url,       // Crimson Bear
  'Sarah_FX': INSTITUTIONAL_ANIMAL_PRESETS[1].url,       // Tiffany Wolf
  'Hiroshi_K': INSTITUTIONAL_ANIMAL_PRESETS[10].url,     // Jade Dragon
  'Elena_Scalps': INSTITUTIONAL_ANIMAL_PRESETS[4].url,   // Emerald Viper
  'David_Gold': INSTITUTIONAL_ANIMAL_PRESETS[0].url,     // Golden Bull
  'SwissVault': INSTITUTIONAL_ANIMAL_PRESETS[3].url,     // Imperial Lion
  'RiskMaximus': INSTITUTIONAL_ANIMAL_PRESETS[11].url,   // Blaze Tiger
  'LondonFX_James': INSTITUTIONAL_ANIMAL_PRESETS[5].url, // Solar Falcon
  'Sofia_Quant': INSTITUTIONAL_ANIMAL_PRESETS[9].url,    // Quantum Owl
  'Alex_Scalps': INSTITUTIONAL_ANIMAL_PRESETS[8].url,    // Cyber Kitsune
  'Viktor_Metals': INSTITUTIONAL_ANIMAL_PRESETS[2].url,  // Crimson Bear
  'Kenshi_Tokyo': INSTITUTIONAL_ANIMAL_PRESETS[7].url,   // Abyssal Shark
  'Liam_FX': INSTITUTIONAL_ANIMAL_PRESETS[6].url,        // Stealth Panther
};

const resolveSavedUserAvatar = (username: string, explicitUrl?: string): string | undefined => {
  if (explicitUrl) return explicitUrl;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('traderank_auth_user_v1') : null;
    if (!raw) return undefined;
    const saved = JSON.parse(raw);
    if (
      saved?.avatarUrl &&
      (saved.username === username ||
       username.startsWith('Verified_') ||
       username.startsWith('TraderRank-') ||
       username.includes('72423906'))
    ) {
      return saved.avatarUrl;
    }
  } catch {
    // ignore storage read errors
  }
  return undefined;
};

export const getTraderAnimalPreset = (username: string, customUrl?: string): AnimalAvatarPreset => {
  const effectiveUrl = resolveSavedUserAvatar(username, customUrl);
  if (effectiveUrl) {
    const matched = INSTITUTIONAL_ANIMAL_PRESETS.find(
      (p) => p.url === effectiveUrl || effectiveUrl === `preset:${p.id}`
    );
    if (matched) return matched;
  }

  if (TRADER_PRESET_MAP[username]) {
    const matched = INSTITUTIONAL_ANIMAL_PRESETS.find((p) => p.url === TRADER_PRESET_MAP[username]);
    if (matched) return matched;
  }

  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash << 5) - hash + username.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % INSTITUTIONAL_ANIMAL_PRESETS.length;
  return INSTITUTIONAL_ANIMAL_PRESETS[index];
};

export const getTraderProfilePhoto = (username: string, customUrl?: string): string => {
  const effectiveUrl = resolveSavedUserAvatar(username, customUrl);
  // Automatically upgrade legacy Unsplash portrait URLs to institutional animal presets
  if (effectiveUrl && !effectiveUrl.includes('images.unsplash.com/photo-')) {
    if (effectiveUrl.startsWith('preset:')) {
      const id = effectiveUrl.replace('preset:', '');
      const preset = INSTITUTIONAL_ANIMAL_PRESETS.find((p) => p.id === id);
      if (preset) return preset.url;
    }
    return effectiveUrl;
  }

  return getTraderAnimalPreset(username, effectiveUrl).url;
};

export const TraderAvatar: React.FC<TraderAvatarProps> = ({
  username,
  avatarUrl,
  broker,
  size = 36,
  showOnlineRing = true,
  showBrokerBadge = false,
  isChampion = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const preset = getTraderAnimalPreset(username, avatarUrl);
  const photoSrc = getTraderProfilePhoto(username, avatarUrl);

  const getInitials = (name: string) => {
    const parts = name.replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className="trader-avatar-wrap"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        flexShrink: 0,
      }}
      title={`${username} • ${preset.label}`}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: size >= 48 ? '14px' : '10px',
          overflow: 'hidden',
          border: isChampion
            ? '2px solid #fbbf24'
            : `1.5px solid ${preset.accentColor}66`,
          boxShadow: isChampion
            ? '0 0 16px rgba(251, 191, 36, 0.45), 0 2px 8px rgba(0,0,0,0.5)'
            : `0 0 12px ${preset.accentColor}26, 0 2px 8px rgba(0,0,0,0.45)`,
          background: 'linear-gradient(135deg, #09181d 0%, #122b33 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!imageError ? (
          <img
            src={photoSrc}
            alt={username}
            loading="lazy"
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: `${Math.max(10, Math.floor(size * 0.35))}px`,
              fontWeight: 800,
              color: 'var(--text-main)',
            }}
          >
            {getInitials(username)}
          </span>
        )}
      </div>

      {/* Online Activity Green/Tiffany Dot */}
      {showOnlineRing && (
        <span
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: `${Math.max(7, Math.floor(size * 0.24))}px`,
            height: `${Math.max(7, Math.floor(size * 0.24))}px`,
            borderRadius: '50%',
            backgroundColor: '#0abab5',
            border: '2px solid #060d11',
            boxShadow: '0 0 6px #0abab5',
            zIndex: 3,
          }}
        />
      )}

      {/* Optional Broker Mini Badge */}
      {showBrokerBadge && broker && (
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            background: 'rgba(6, 13, 17, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            padding: '1px 3px',
            zIndex: 4,
          }}
        >
          <BrokerSymbol broker={broker} size={10} />
        </div>
      )}
    </div>
  );
};
