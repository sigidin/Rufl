/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Calendar, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Info, 
  ArrowUpRight,
  Shield,
  Circle,
  ChevronDown,
  ChevronUp,
  User,
  SortAsc,
  Target,
  Download,
  Image as ImageIcon,
  Map as MapIcon,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as d3 from 'd3';
import { MOCK_DATA } from './mockData';
import { TournamentData, Match, TableRow, Player } from './types';

const MATCHES_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7TDrZwYgX3nA_CTjCHnf7VbNv4T4kHRG1nSMJ-TSgEhxrPKduWOP9XRovOK2t44g0lD28uxspnxyY/pub?gid=80457916&single=true&output=csv';
// Замените эту ссылку на вашу новую ссылку для листа "Игроки"
const PLAYERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7TDrZwYgX3nA_CTjCHnf7VbNv4T4kHRG1nSMJ-TSgEhxrPKduWOP9XRovOK2t44g0lD28uxspnxyY/pub?gid=164242498&single=true&output=csv'; 

// --- Components ---

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col items-center text-center">
      <div className="text-[9px] uppercase font-bold text-accent/80 tracking-widest mb-0.5">Неофициальное приложение</div>
      <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-tight">
        РЮФЛ-2026
      </h1>
      <p className="text-[10px] md:text-xs text-blue-200 font-medium mt-0.5">
        Региональная Юношеская Футбольная Лига • Дальний Восток
      </p>
      <div className="flex items-center gap-1.5 mt-1 opacity-60">
        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[9px] uppercase tracking-wider">Обновлено: 22.03 14:30</span>
      </div>
    </div>
  </header>
);

const ResultCircle = ({ result }: { result: 'W' | 'D' | 'L', key?: React.Key }) => {
  const colors = {
    W: 'bg-green-500',
    D: 'bg-yellow-400',
    L: 'bg-red-500'
  };
  return (
    <div className={`w-3 h-3 rounded-full ${colors[result]}`} title={result === 'W' ? 'Победа' : result === 'D' ? 'Ничья' : 'Поражение'} />
  );
};

const NextMatchCard = ({ match, table }: { match: Match | null, table: TableRow[] }) => {
  if (!match) return null;

  const getTeamForm = (teamName: string) => {
    const row = table.find(r => r.teamName === teamName);
    return row ? row.lastGames : [];
  };

  const getDayOfWeek = (dateStr: string) => {
    try {
      const parts = dateStr.split('.');
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : 2026;
      const date = new Date(year, month, day);
      const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
      return days[date.getDay()];
    } catch (e) {
      return '';
    }
  };

  const homeForm = getTeamForm(match.homeTeam);
  const awayForm = getTeamForm(match.awayTeam);

  return (
    <div className="px-4 py-6 bg-white border-b border-slate-200">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-sm">
            <Calendar className="text-navy w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-navy uppercase tracking-tight">Ближайший матч</h2>
        </div>

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-navy rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-bright-blue/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full -ml-12 -mb-12 blur-xl" />

          <div className="relative z-10">
            <div className="flex flex-col items-center mb-6">
              <div className="text-accent font-black text-sm uppercase tracking-widest mb-1">
                {getDayOfWeek(match.date)}
              </div>
              <div className="text-2xl font-black mb-1">{match.date} • {match.time}</div>
              <div className="flex items-center gap-1.5 text-blue-200/80 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                {match.location}
              </div>
            </div>

            <div className="grid grid-cols-3 items-center gap-4">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3 border border-white/10 shadow-inner">
                  <Shield className="text-white w-10 h-10" />
                </div>
                <div className="font-black text-xs uppercase leading-tight mb-2 h-8 flex items-center justify-center">
                  {match.homeTeam}
                </div>
                <div className="flex gap-1 justify-center">
                  {homeForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="text-4xl font-black text-accent italic">VS</div>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-3 border border-white/10 shadow-inner">
                  <Shield className="text-white w-10 h-10" />
                </div>
                <div className="font-black text-xs uppercase leading-tight mb-2 h-8 flex items-center justify-center">
                  {match.awayTeam}
                </div>
                <div className="flex gap-1 justify-center">
                  {awayForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const DinamoSpecialCard = ({ stats, players }: { stats: TournamentData['dinamoStats'], players: Player[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'goals'>('goals');

  const positionGroups = [
    { key: 'врт', label: 'Вратари' },
    { key: 'защ', label: 'Защитники' },
    { key: 'цп', label: 'Полузащитники' },
    { key: 'нап', label: 'Нападающие' }
  ];

  const getGroupedPlayers = () => {
    const grouped: Record<string, Player[]> = {};
    players.forEach(p => {
      let groupKey = 'нап';
      if (p.position.includes('врт')) groupKey = 'врт';
      else if (p.position.includes('защ')) groupKey = 'защ';
      else if (p.position.includes('цп')) groupKey = 'цп';
      else if (p.position.includes('нап')) groupKey = 'нап';

      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(p);
    });

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return b.goals - a.goals;
      });
    });
    return grouped;
  };

  const groupedPlayers = getGroupedPlayers();

  return (
    <div className="px-4 py-4 bg-slate-50">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          layout
          className="bg-white rounded-[32px] shadow-xl border border-slate-200 overflow-hidden"
        >
          <div 
            className="p-6 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div 
                layout
                className="w-24 h-24 bg-bright-blue rounded-3xl flex items-center justify-center shadow-lg mb-4 border-4 border-light-blue"
              >
                <Shield className="text-white w-14 h-14" />
              </motion.div>
              
              <motion.h2 layout className="text-2xl font-black text-navy uppercase tracking-tight mb-1">
                ДИНАМО-Владивосток-2012
              </motion.h2>
              
              <motion.div layout className="flex items-center gap-2 text-navy/60 font-bold text-sm mb-4">
                <User className="w-4 h-4 text-bright-blue" />
                Тренер: Молоков Евгений Валерьевич
              </motion.div>

              <motion.div layout className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest">Место</span>
                  <span className="text-xl font-black text-bright-blue">{stats.rank}</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest">Очки</span>
                  <span className="text-xl font-black text-bright-blue">{stats.points}</span>
                </div>
                <div className="w-px h-8 bg-slate-200" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest">Форма</span>
                  <div className="flex gap-1 mt-1">
                    {stats.lastResults.map((r, i) => <ResultCircle key={i} result={r} />)}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                layout
                className="mt-6 w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-navy/40"
              >
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-100 bg-slate-50/50"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-navy uppercase tracking-widest">Состав команды</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('name'); }}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${sortBy === 'name' ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-slate-200'}`}
                      >
                        <SortAsc className="w-3 h-3" /> А-Я
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('goals'); }}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${sortBy === 'goals' ? 'bg-navy text-white border-navy' : 'bg-white text-navy/60 border-slate-200'}`}
                      >
                        <Target className="w-3 h-3" /> Голы
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {positionGroups.map(group => {
                      const groupPlayers = groupedPlayers[group.key];
                      if (!groupPlayers || groupPlayers.length === 0) return null;

                      return (
                        <div key={group.key}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-[2px] w-4 bg-bright-blue" />
                            <h4 className="text-[11px] font-black uppercase text-navy/40 tracking-widest">{group.label}</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {groupPlayers.map(player => (
                              <div key={player.id} className="bg-white rounded-xl p-3 border border-slate-100 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-10 h-10 flex-shrink-0">
                                    <img 
                                      src={player.photoUrl} 
                                      alt={player.name} 
                                      className="w-full h-full object-cover rounded-lg border border-white shadow-sm"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-bright-blue rounded-full flex items-center justify-center text-white font-black text-[9px] border border-white shadow-sm">
                                      {player.number || '—'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-navy">{player.name}</div>
                                    <div className="text-[10px] font-bold text-navy/40 uppercase">
                                      {player.position === 'врт' ? 'Вратарь' : 
                                       player.position === 'защ' ? 'Защитник' : 
                                       player.position === 'цп' ? 'Полузащитник' : 
                                       player.position === 'нап' ? 'Нападающий' : player.position}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-black text-bright-blue">{player.goals}</div>
                                  <div className="text-[9px] font-bold text-navy/30 uppercase">
                                    {player.position.includes('врт') ? 'Пропущено' : 'Голы'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, icon: Icon }: { title: string; icon: any }) => (
  <div className="flex items-center gap-2 mb-4 px-4">
    <div className="p-2 bg-navy rounded-lg">
      <Icon className="w-5 h-5 text-accent" />
    </div>
    <h3 className="text-xl font-extrabold uppercase text-navy">{title}</h3>
  </div>
);

const TournamentTable = ({ data }: { data: TableRow[] }) => (
  <section className="py-8">
    <SectionTitle title="Турнирная таблица" icon={Trophy} />
    <div className="px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-navy/50 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Команда</th>
                <th className="px-3 py-3 text-center">И</th>
                <th className="px-3 py-3 text-center">В</th>
                <th className="px-3 py-3 text-center">Н</th>
                <th className="px-3 py-3 text-center">П</th>
                <th className="px-3 py-3 text-center">Мячи</th>
                <th className="px-3 py-3 text-center">+/-</th>
                <th className="px-4 py-3 text-center">О</th>
                <th className="px-4 py-3">Форма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const isDinamo = row.teamName === 'Динамо-Владивосток';
                return (
                  <tr 
                    key={row.teamName} 
                    className={`${isDinamo ? 'bg-light-blue/50 ring-2 ring-inset ring-accent' : 'hover:bg-slate-50 transition-colors'}`}
                  >
                    <td className="px-4 py-4 text-center font-bold text-navy/60">{row.rank}</td>
                    <td className="px-4 py-4 font-bold text-navy whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Shield className={`w-4 h-4 ${isDinamo ? 'text-bright-blue' : 'text-slate-400'}`} />
                        {row.teamName}
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center font-medium">{row.played}</td>
                    <td className="px-3 py-4 text-center text-green-600 font-bold">{row.won}</td>
                    <td className="px-3 py-4 text-center text-yellow-600 font-bold">{row.drawn}</td>
                    <td className="px-3 py-4 text-center text-red-500 font-bold">{row.lost}</td>
                    <td className="px-3 py-4 text-center text-navy/60">{row.goalsFor}-{row.goalsAgainst}</td>
                    <td className="px-3 py-4 text-center font-medium">{row.goalsFor - row.goalsAgainst}</td>
                    <td className="px-4 py-4 text-center font-black text-navy text-base">{row.points}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        {row.lastGames.map((r, i) => <ResultCircle key={i} result={r} />)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);

const TeamLogo = ({ name, size = "w-6 h-6" }: { name: string, size?: string }) => {
  // Placeholder logic for icons based on team name
  const getIcon = () => {
    if (name.includes('Динамо')) return <Shield className="text-bright-blue" />;
    if (name.includes('СКА')) return <Trophy className="text-red-500" />;
    if (name.includes('Сахалин')) return <Navigation className="text-emerald-500" />;
    if (name.includes('Благовещенск')) return <MapPin className="text-orange-500" />;
    if (name.includes('Искра')) return <ArrowUpRight className="text-yellow-500" />;
    if (name.includes('СШОР')) return <Info className="text-slate-500" />;
    return <Circle className="text-slate-300" />;
  };

  return (
    <div className={`${size} flex items-center justify-center`}>
      {getIcon()}
    </div>
  );
};

const getDayOfWeek = (dateStr: string) => {
  try {
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  } catch (e) {
    return '';
  }
};

const FarEastMap = () => {
  const cities = [
    { name: 'Владивосток', x: 72, y: 88 },
    { name: 'Уссурийск', x: 73, y: 83 },
    { name: 'Хабаровск', x: 78, y: 68 },
    { name: 'Комсомольск', x: 82, y: 60 },
    { name: 'Ю.-Сахалинск', x: 92, y: 75 },
    { name: 'Благовещенск', x: 62, y: 58 },
  ];

  return (
    <div className="px-4 mb-12">
      <SectionTitle title="География турнира" icon={MapIcon} />
      <div className="bg-slate-900 rounded-3xl p-4 md:p-8 shadow-2xl border border-white/5 overflow-hidden relative min-h-[400px] flex items-center justify-center">
        {/* Map Background Image */}
        <div className="absolute inset-0 opacity-40 pointer-events-none">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Far_Eastern_Federal_District_%28full%29.svg/1200px-Far_Eastern_Federal_District_%28full%29.svg.png" 
            alt="Карта Дальнего Востока" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-transparent to-slate-900/40" />
        </div>

        <div className="relative w-full max-w-[600px] aspect-[4/3]">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(0,102,255,0.3)]">
            {cities.map((city, index) => (
              <motion.g 
                key={city.name}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.15 
                }}
              >
                <circle cx={city.x} cy={city.y} r="1.2" fill="#0066FF" className="animate-pulse" />
                <circle cx={city.x} cy={city.y} r="3" fill="#0066FF" opacity="0.1" />
                
                <g transform={`translate(${city.x + 2}, ${city.y - 1})`}>
                  <rect x="-0.5" y="-2.5" width="22" height="6" rx="1" fill="rgba(15, 23, 42, 0.8)" />
                  <text 
                    fontSize="2.5" 
                    className="font-black fill-white uppercase tracking-tighter"
                  >
                    {city.name}
                  </text>
                </g>
              </motion.g>
            ))}
          </svg>
        </div>
        
        <div className="absolute top-6 right-6 flex flex-col items-end">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            <Navigation className="w-3 h-3 text-accent" />
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">География РЮФЛ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchRow: React.FC<{ match: Match }> = ({ match }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isFinished = !!(match.homeScore !== undefined && match.awayScore !== undefined);
  const dayOfWeek = getDayOfWeek(match.date);

  return (
    <div className="border-b border-slate-50 last:border-0">
      <div 
        className={`p-4 flex items-center justify-between transition-colors ${isFinished ? 'cursor-pointer hover:bg-slate-50/50' : ''}`}
        onClick={() => isFinished && setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-slate-100 text-navy/60 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{dayOfWeek}</span>
            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-wider">{match.date}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-wider">{match.time}</span>
            <span className="w-1 h-1 rounded-full bg-slate-200" />
            <div className="flex items-center gap-1 text-[10px] font-bold text-bright-blue uppercase tracking-tight">
              <MapPin className="w-2.5 h-2.5" />
              {match.location}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo name={match.homeTeam} />
                <span className={`text-sm font-bold ${match.homeTeam === 'Динамо-Владивосток' ? 'text-bright-blue underline decoration-2 underline-offset-4' : 'text-navy'}`}>
                  {match.homeTeam}
                </span>
              </div>
              {isFinished && <span className="text-sm font-black text-navy">{match.homeScore}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TeamLogo name={match.awayTeam} />
                <span className={`text-sm font-bold ${match.awayTeam === 'Динамо-Владивосток' ? 'text-bright-blue underline decoration-2 underline-offset-4' : 'text-navy'}`}>
                  {match.awayTeam}
                </span>
              </div>
              {isFinished && <span className="text-sm font-black text-navy">{match.awayScore}</span>}
            </div>
          </div>
        </div>

        <div className="ml-4 flex flex-col items-end gap-2">
          {match.photoUrl && (
            <a 
              href={match.photoUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-bright-blue/10 rounded-lg text-bright-blue hover:bg-bright-blue/20 transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
            </a>
          )}
          {isFinished && (
            <div className="text-navy/20">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && isFinished && (match.homeScorers || match.awayScorers) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4 bg-slate-50/50 overflow-hidden"
          >
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-[10px] text-navy/60 leading-relaxed">
                <div className="font-bold mb-1 uppercase tracking-tighter text-navy/30">Голы {match.homeTeam}</div>
                {match.homeScorers || '—'}
              </div>
              <div className="text-[10px] text-navy/60 leading-relaxed text-right">
                <div className="font-bold mb-1 uppercase tracking-tighter text-navy/30">Голы {match.awayTeam}</div>
                {match.awayScorers || '—'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UpcomingMatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const dayOfWeek = getDayOfWeek(match.date);
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 min-w-[320px] flex-shrink-0">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="bg-navy text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{dayOfWeek}</span>
          <span className="text-[10px] font-bold text-navy/40 uppercase tracking-wider">{match.date}</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-bright-blue uppercase tracking-tight">
          <MapPin className="w-3 h-3 text-accent" />
          <span className="truncate max-w-[100px]">{match.location}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <TeamLogo name={match.homeTeam} size="w-6 h-6" />
          <span className="text-xs font-bold text-navy truncate">{match.homeTeam}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-black text-navy/20">VS</span>
          <span className="text-[10px] font-black text-bright-blue">{match.time}</span>
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end overflow-hidden">
          <span className="text-xs font-bold text-navy truncate text-right">{match.awayTeam}</span>
          <TeamLogo name={match.awayTeam} size="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

const MatchList = ({ matches, title, icon }: { matches: Match[], title: string, icon: any }) => {
  const isUpcoming = title === "Ближайшие матчи";
  
  // Filter matches for Dinamo Vladivostok if it's the upcoming section
  const filteredMatches = isUpcoming 
    ? matches.filter(m => (m.homeTeam === 'Динамо-Владивосток' || m.awayTeam === 'Динамо-Владивосток') && m.status === 'Ожидается')
    : matches;

  // Sort upcoming matches by date
  const displayMatches = isUpcoming
    ? [...filteredMatches].sort((a, b) => {
        const dateA = new Date(a.date.split('.').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('.').reverse().join('-')).getTime();
        return dateA - dateB;
      })
    : filteredMatches;

  return (
    <div className="px-4 mb-8">
      <SectionTitle title={title} icon={icon} />
      {isUpcoming ? (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-4">
          {displayMatches.length > 0 ? (
            displayMatches.slice(0, 5).map(match => <UpcomingMatchCard key={match.id} match={match} />)
          ) : (
            <div className="w-full p-8 text-center text-navy/40 text-sm italic bg-white rounded-2xl border border-slate-100">Матчей не найдено</div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => <MatchRow key={match.id} match={match} />)
          ) : (
            <div className="p-8 text-center text-navy/40 text-sm italic">Матчей не найдено</div>
          )}
        </div>
      )}
    </div>
  );
};

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
      });
    } else {
      alert('Чтобы установить приложение, нажмите "Поделиться" в браузере и выберите "На экран Домой"');
    }
  };

  return (
    <div className="px-4 py-8 mt-4 bg-navy text-white text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-bright-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-bright-blue/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-2">Установите приложение</h3>
        <p className="text-sm text-white/60 mb-6">Следите за результатами «Динамо» прямо с главного экрана вашего телефона</p>
        <button 
          onClick={handleInstall}
          className="w-full bg-bright-blue hover:bg-bright-blue/90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <Download className="w-5 h-5" />
          Установить на телефон
        </button>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="py-12 px-4 text-center bg-slate-100 border-t border-slate-200">
    <div className="max-w-7xl mx-auto">
      <div className="w-12 h-12 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
        <Trophy className="text-accent w-6 h-6" />
      </div>
      <h4 className="text-navy font-black uppercase tracking-tight mb-1">Молодёжное первенство ДФО</h4>
      <p className="text-xs text-navy/50 font-medium mb-2">Региональная Юношеская Футбольная Лига 2026</p>
      <p className="text-[10px] text-accent font-bold uppercase tracking-widest mb-6">Неофициальное приложение</p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 text-[10px] font-bold text-navy/60 uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Данные обновлены: 22.03 14:30
      </div>
    </div>
  </footer>
);

// --- Main App ---

export default function App() {
  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Matches
        const matchesResponse = await fetch(MATCHES_SHEET_URL);
        const matchesCsv = await matchesResponse.text();
        
        // Fetch Players (if URL exists)
        let playersData: Player[] = [];
        if (PLAYERS_SHEET_URL) {
          const playersResponse = await fetch(PLAYERS_SHEET_URL);
          const playersCsv = await playersResponse.text();
          const parsedPlayers = Papa.parse(playersCsv, { header: true, skipEmptyLines: true });
          playersData = (parsedPlayers.data as any[]).map((row, idx) => ({
            id: idx,
            number: row['номер'] || '',
            name: row['имя'] || 'Без имени',
            position: row['позиция'] || 'защ',
            goals: parseInt(row['голы']) || 0,
            photoUrl: `https://picsum.photos/seed/${row['имя'] || idx}/200`
          }));
        } else {
          // Fallback static data if URL is not provided yet
          playersData = [
            { id: 1, number: '1', name: 'Иванов Иван', position: 'Вратарь', goals: 5, photoUrl: 'https://picsum.photos/seed/ivan/200' },
            { id: 2, number: '2', name: 'Петров Петр', position: 'Защитник', goals: 2, photoUrl: 'https://picsum.photos/seed/petr/200' },
            { id: 3, number: '3', name: 'Сидоров Сидор', position: 'Полузащитник', goals: 4, photoUrl: 'https://picsum.photos/seed/sidor/200' },
            { id: 4, number: '4', name: 'Алексеев Алексей', position: 'Нападающий', goals: 12, photoUrl: 'https://picsum.photos/seed/alex/200' }
          ];
        }

        Papa.parse(matchesCsv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const matches: Match[] = results.data.map((row: any) => {
              const homeScore = row['Счет_Х'] !== '' && row['Счет_Х'] !== undefined ? parseInt(row['Счет_Х']) : undefined;
              const awayScore = row['Счет_Г'] !== '' && row['Счет_Г'] !== undefined ? parseInt(row['Счет_Г']) : undefined;
              
              return {
                id: parseInt(row['ID']),
                date: row['Дата'],
                time: row['Время'],
                homeTeam: row['Хозяева'],
                awayTeam: row['Гости'],
                homeScore,
                awayScore,
                status: (homeScore !== undefined && awayScore !== undefined) ? 'Завершен' : 'Ожидается',
                location: row['Место'],
                homeScorers: row['Авторы_Х'],
                awayScorers: row['Авторы_Г'],
                photoUrl: row['Фото']
              };
            });

            // Calculate Table
            const teams = Array.from(new Set(matches.flatMap(m => [m.homeTeam, m.awayTeam])));
            const table: TableRow[] = teams.map(team => {
              const teamMatches = matches.filter(m => (m.homeTeam === team || m.awayTeam === team) && m.status === 'Завершен');
              
              let won = 0, drawn = 0, lost = 0, goalsFor = 0, goalsAgainst = 0;
              const lastGames: ('W' | 'D' | 'L')[] = [];

              teamMatches.forEach(m => {
                const isHome = m.homeTeam === team;
                const score = isHome ? m.homeScore! : m.awayScore!;
                const oppScore = isHome ? m.awayScore! : m.homeScore!;
                
                goalsFor += score;
                goalsAgainst += oppScore;

                if (score > oppScore) {
                  won++;
                  lastGames.push('W');
                } else if (score === oppScore) {
                  drawn++;
                  lastGames.push('D');
                } else {
                  lost++;
                  lastGames.push('L');
                }
              });

              return {
                teamName: team,
                played: teamMatches.length,
                won,
                drawn,
                lost,
                goalsFor,
                goalsAgainst,
                points: won * 3 + drawn,
                lastGames: lastGames.slice(-5),
                rank: 0 
              };
            });

            table.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
            table.forEach((row, idx) => row.rank = idx + 1);

            const dinamoStats = table.find(t => t.teamName === 'Динамо-Владивосток') || { rank: '-', points: 0, lastResults: [] };
            const nextMatch = matches.find(m => m.status === 'Ожидается' && (m.homeTeam === 'Динамо-Владивосток' || m.awayTeam === 'Динамо-Владивосток')) || null;
            const upcomingMatches = matches.filter(m => m.status === 'Ожидается').sort((a, b) => a.id - b.id).slice(0, 5);

            setData({
              table,
              allMatches: matches,
              dinamoMatches: matches.filter(m => m.homeTeam === 'Динамо-Владивосток' || m.awayTeam === 'Динамо-Владивосток'),
              recentMatches: [], // Removed
              nextMatch,
              dinamoStats: {
                rank: dinamoStats.rank,
                points: dinamoStats.points,
                lastResults: (dinamoStats as any).lastGames || []
              },
              dinamoPlayers: playersData
            });
            setLoading(false);
          }
        });
      } catch (error) {
        console.error('Error fetching sheet data:', error);
        setData(MOCK_DATA);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-light-blue border-t-bright-blue rounded-full mb-4"
        />
        <p className="text-navy font-bold uppercase tracking-widest text-xs animate-pulse">Загрузка данных турнира...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen flex flex-col pt-[84px] md:pt-[92px]">
      <Header />
      
      <NextMatchCard 
        match={data.nextMatch} 
        table={data.table}
      />

      <DinamoSpecialCard 
        stats={data.dinamoStats} 
        players={data.dinamoPlayers} 
      />
      
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <TournamentTable data={data.table} />
        
        <MatchList 
          title="Ближайшие матчи" 
          icon={Calendar} 
          matches={data.allMatches} 
        />

        <FarEastMap />
      </main>

      <InstallPWA />
      
      <Footer />
    </div>
  );
}
