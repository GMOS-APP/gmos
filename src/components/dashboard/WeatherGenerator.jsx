import React, { useState } from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const WEATHER = {
  temperate: {
    spring: {
      temp:   ['Cool (45-55°F)', 'Mild (55-65°F)', 'Mild (55-65°F)', 'Warm (65-70°F)', 'Cold (35-45°F)'],
      precip: ['Clear skies', 'Partly cloudy', 'Light rain', 'Heavy rain', 'Thunderstorm', 'Overcast', 'Light drizzle', 'Foggy morning'],
      wind:   ['Calm', 'Light breeze', 'Moderate wind', 'Strong gusts', 'Calm'],
    },
    summer: {
      temp:   ['Warm (70-80°F)', 'Hot (80-90°F)', 'Hot (80-90°F)', 'Scorching (90°F+)', 'Mild (65-70°F)'],
      precip: ['Clear and sunny', 'Clear and sunny', 'Partly cloudy', 'Afternoon thunderstorm', 'Humid haze', 'Passing shower', 'Brilliant sunshine'],
      wind:   ['Calm', 'Calm', 'Light breeze', 'Moderate wind', 'Still and oppressive'],
    },
    fall: {
      temp:   ['Cool (45-55°F)', 'Cold (35-45°F)', 'Mild (55-60°F)', 'Chilly (30-40°F)', 'Cool (45-55°F)'],
      precip: ['Clear skies', 'Overcast', 'Light rain', 'Heavy rain', 'Fog', 'Sleet', 'Dry and crisp'],
      wind:   ['Light breeze', 'Moderate wind', 'Strong gusts', 'Calm', 'Blustery'],
    },
    winter: {
      temp:   ['Cold (25-35°F)', 'Freezing (15-25°F)', 'Cold (30-40°F)', 'Bitter (below 15°F)', 'Cold (25-35°F)'],
      precip: ['Clear and cold', 'Light snow', 'Heavy snowfall', 'Blizzard conditions', 'Overcast', 'Freezing rain', 'Ice fog'],
      wind:   ['Calm', 'Biting wind', 'Strong gusts', 'Howling gale', 'Light breeze'],
    },
  },
  arctic: {
    spring: {
      temp:   ['Freezing (0-20°F)', 'Cold (20-32°F)', 'Bitter (below 0°F)', 'Cold (20-32°F)'],
      precip: ['Clear and blinding', 'Light snow flurries', 'Heavy snow', 'Whiteout blizzard', 'Overcast'],
      wind:   ['Calm', 'Biting wind', 'Strong gusts', 'Howling gale'],
    },
    summer: {
      temp:   ['Cold (32-45°F)', 'Cool (45-55°F)', 'Freezing (25-32°F)', 'Cool (40-50°F)'],
      precip: ['Clear', 'Overcast', 'Light rain', 'Sleet', 'Fog', 'Midnight sun glare'],
      wind:   ['Calm', 'Moderate wind', 'Strong gusts'],
    },
    fall: {
      temp:   ['Freezing (20-32°F)', 'Cold (10-20°F)', 'Bitter (below 10°F)'],
      precip: ['Light snow', 'Heavy snowfall', 'Clear and cold', 'Blizzard conditions'],
      wind:   ['Calm', 'Biting wind', 'Howling gale', 'Strong gusts'],
    },
    winter: {
      temp:   ['Bitter (below -20°F)', 'Extreme cold (-20 to 0°F)', 'Freezing (-10 to 0°F)'],
      precip: ['Whiteout blizzard', 'Heavy snowfall', 'Clear and dangerous', 'Ice storm'],
      wind:   ['Howling gale', 'Biting wind', 'Calm (deceptively still)', 'Strong gusts'],
    },
  },
  tropical: {
    spring: {
      temp:   ['Hot (80-90°F)', 'Hot (85-95°F)', 'Warm (75-85°F)'],
      precip: ['Clear and humid', 'Afternoon downpour', 'Torrential rain', 'Steamy fog', 'Partly cloudy'],
      wind:   ['Calm', 'Light sea breeze', 'Humid stillness', 'Gusty squall'],
    },
    summer: {
      temp:   ['Scorching (95°F+)', 'Hot (85-95°F)', 'Hot (85-95°F)'],
      precip: ['Monsoon downpour', 'Thunderstorm', 'Overcast and humid', 'Tropical storm warning', 'Brief sunshine then rain'],
      wind:   ['Oppressive stillness', 'Gusty squall', 'Strong tropical wind', 'Gale force'],
    },
    fall: {
      temp:   ['Hot (80-90°F)', 'Warm (75-85°F)', 'Hot (85-95°F)'],
      precip: ['Clear and sunny', 'Afternoon shower', 'Heavy downpour', 'Humid haze', 'Thunderstorm'],
      wind:   ['Calm', 'Light breeze', 'Gusty', 'Moderate wind'],
    },
    winter: {
      temp:   ['Warm (70-80°F)', 'Warm (75-85°F)', 'Mild (65-75°F)'],
      precip: ['Clear and pleasant', 'Light shower', 'Partly cloudy', 'Brilliant sunshine', 'Morning mist'],
      wind:   ['Calm', 'Light sea breeze', 'Moderate wind'],
    },
  },
  desert: {
    spring: {
      temp:   ['Warm (70-85°F)', 'Hot (85-95°F)', 'Cool nights (40-55°F)', 'Warm (75-85°F)'],
      precip: ['Clear and dry', 'Sandstorm', 'Dusty haze', 'Rare light rain', 'Clear and parching'],
      wind:   ['Calm', 'Hot dry wind', 'Sandstorm gusts', 'Light breeze'],
    },
    summer: {
      temp:   ['Scorching (100°F+)', 'Extreme heat (110°F+)', 'Hot (95-105°F)'],
      precip: ['Clear and merciless', 'Dust devil swarm', 'Sandstorm', 'Mirages shimmer'],
      wind:   ['Hot dry gale', 'Scorching wind', 'Deceptive calm', 'Sandstorm'],
    },
    fall: {
      temp:   ['Hot (85-95°F)', 'Warm (70-85°F)', 'Cool nights (45-60°F)'],
      precip: ['Clear', 'Dusty haze', 'Light rain (rare)', 'Clear and dry'],
      wind:   ['Calm', 'Light wind', 'Hot dry gusts'],
    },
    winter: {
      temp:   ['Cool (45-60°F)', 'Cold nights (25-40°F)', 'Mild days (60-70°F)'],
      precip: ['Clear and cold', 'Rare frost', 'Partly cloudy', 'Dry and crisp'],
      wind:   ['Calm', 'Cold dry wind', 'Moderate gusts'],
    },
  },
  coastal: {
    spring: {
      temp:   ['Cool (50-60°F)', 'Mild (60-70°F)', 'Cold (40-50°F)'],
      precip: ['Sea fog', 'Partly cloudy', 'Light rain', 'Heavy sea squall', 'Clear and breezy'],
      wind:   ['Strong sea wind', 'Moderate breeze', 'Calm harbor', 'Gusty coastal wind'],
    },
    summer: {
      temp:   ['Warm (70-80°F)', 'Hot (80-90°F)', 'Mild (65-75°F)'],
      precip: ['Clear and sunny', 'Sea haze', 'Afternoon sea breeze', 'Passing squall', 'Brilliant sunshine'],
      wind:   ['Calm', 'Sea breeze', 'Moderate wind', 'Strong onshore wind'],
    },
    fall: {
      temp:   ['Cool (50-65°F)', 'Cold (40-55°F)', 'Mild (55-65°F)'],
      precip: ['Storm clouds', 'Heavy rain', 'Sea fog', 'Clear but cold', 'Gale warning'],
      wind:   ['Strong gusts', 'Howling coastal gale', 'Moderate wind', 'Blustery'],
    },
    winter: {
      temp:   ['Cold (30-45°F)', 'Freezing (20-35°F)', 'Cold (35-45°F)'],
      precip: ['Freezing sea spray', 'Heavy rain', 'Sleet', 'Storm', 'Overcast and grey'],
      wind:   ['Howling gale', 'Strong wind', 'Biting sea wind', 'Calm in harbor'],
    },
  },
};

const SPECIAL = [
  null, null, null, null, null, null, null, null, // mostly null = no special
  'Unseasonal weather — the locals remark on it',
  'An eerie stillness precedes something',
  'A distant smell of smoke or ash on the wind',
  'Animals are behaving strangely',
  'Rainbow visible for hours',
  'Unusual cloud formations',
  'Lightning without thunder',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const CLIMATES = ['temperate', 'arctic', 'tropical', 'desert', 'coastal'];
const SEASONS  = ['spring', 'summer', 'fall', 'winter'];

export default function WeatherGenerator() {
  const [climate, setClimate] = useState('temperate');
  const [season, setSeason]   = useState('summer');
  const [result, setResult]   = useState(null);

  const generate = () => {
    const tables = WEATHER[climate]?.[season] || WEATHER.temperate.spring;
    const special = pick(SPECIAL);
    setResult({
      temp:    pick(tables.temp),
      precip:  pick(tables.precip),
      wind:    pick(tables.wind),
      special,
    });
  };

  return (
    <div className="h-full dark:bg-zinc-900/40 bg-white border dark:border-zinc-800/50 border-zinc-200 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Cloud className="w-4 h-4 text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-widest dark:text-zinc-400 text-zinc-500">Weather</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Select value={climate} onValueChange={setClimate}>
          <SelectTrigger className="h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CLIMATES.map(c => <SelectItem key={c} value={c} className="text-xs capitalize">{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={season} onValueChange={setSeason}>
          <SelectTrigger className="h-8 text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEASONS.map(s => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={generate} variant="outline" size="sm"
        className="w-full text-xs dark:border-zinc-700 dark:text-zinc-300 gap-1.5">
        <RefreshCw className="w-3.5 h-3.5" />
        Generate Weather
      </Button>

      {result && (
        <div className="space-y-2 text-sm">
          <Row icon="🌡️" label="Temperature" value={result.temp} />
          <Row icon="🌧️" label="Conditions"  value={result.precip} />
          <Row icon="💨" label="Wind"         value={result.wind} />
          {result.special && (
            <div className="mt-2 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-400 italic">{result.special}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-base leading-tight flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider dark:text-zinc-600 text-zinc-400 font-semibold">{label}</p>
        <p className="text-xs dark:text-zinc-300 text-zinc-700 leading-snug">{value}</p>
      </div>
    </div>
  );
}
