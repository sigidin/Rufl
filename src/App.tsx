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
  Copy,
  Check,
  Image as ImageIcon,
  Map as MapIcon,
  Navigation,
  ExternalLink,
  Video
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
  <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/20">
    <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col items-center text-center">
      <div className="text-[8px] text-strong text-bright-blue mb-0.5 tracking-[0.3em]">Неофициальное приложение</div>
      <h1 className="text-2xl text-strong gradient-text">
        РЮФЛ-2026
      </h1>
      <p className="text-[9px] text-navy/60 font-bold uppercase tracking-widest mt-0.5">
        Региональная Юношеская Футбольная Лига • ДВ
      </p>
      <div className="flex items-center gap-2 mt-1 bg-white/50 px-2 py-0.5 rounded-full border border-white/40">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
        <span className="text-[7px] font-black text-navy/40 uppercase tracking-widest">Обновлено: 22.03 14:30</span>
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

  const homeForm = getTeamForm(match.homeTeam);
  const awayForm = getTeamForm(match.awayTeam);

  return (
    <div className="px-4 py-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto"
      >
        <SectionTitle title="Ближайший матч" icon={Calendar} />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          className="glass-card rounded-[32px] p-6 text-navy shadow-2xl relative overflow-hidden border-white/40"
        >
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-6">
              <div className="flex justify-center items-center gap-2 mb-1">
                <span className="text-sm font-bold text-navy/80">{match.date}, {match.time}</span>
                <span className="text-sm font-medium text-navy/40">{match.location}</span>
              </div>
              {match.weather && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-navy/40 uppercase tracking-widest">
                  <span className="w-1 h-1 rounded-full bg-navy/20" />
                  Погода: {match.weather}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 mb-8">
              <div className="flex flex-col items-center flex-1">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border border-slate-100 overflow-hidden"
                >
                  <TeamLogo name={match.homeTeam} size="w-10 h-10" />
                </motion.div>
                <div className="text-strong text-xs text-center leading-tight mb-2 min-h-[32px] flex items-center">
                  {match.homeTeam}
                </div>
                <div className="flex gap-1 justify-center">
                  {homeForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="bg-slate-100/80 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/50 min-w-[120px] flex justify-center">
                  <div className="text-4xl font-black text-navy tracking-tighter whitespace-nowrap">
                    {match.homeScore !== undefined ? match.homeScore : '0'} - {match.awayScore !== undefined ? match.awayScore : '0'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border border-slate-100 overflow-hidden"
                >
                  <TeamLogo name={match.awayTeam} size="w-10 h-10" />
                </motion.div>
                <div className="text-strong text-xs text-center leading-tight mb-2 min-h-[32px] flex items-center">
                  {match.awayTeam}
                </div>
                <div className="flex gap-1 justify-center">
                  {awayForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              {match.broadcastUrl ? (
                <motion.a 
                  href={match.broadcastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-bright-blue text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-bright-blue/30"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Смотреть трансляцию
                </motion.a>
              ) : (
                <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 text-navy/40 rounded-full text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Трансляция недоступна
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
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
    <div className="px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          layout
          whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          className="glass-card rounded-[40px] shadow-2xl border border-white/40 overflow-hidden"
        >
          <div 
            className="p-8 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex flex-col items-center text-center">
              <motion.div 
                layout
                className="w-28 h-28 gradient-bg rounded-[32px] flex items-center justify-center shadow-2xl mb-6 border-4 border-white/20"
              >
                <Shield className="text-white w-16 h-16" />
              </motion.div>
              
              <div className="flex flex-col items-center mb-4">
                <motion.h2 layout className="text-4xl text-strong text-navy leading-none">
                  ДИНАМО
                </motion.h2>
                <motion.span layout className="text-sm font-bold text-navy/60 uppercase tracking-[0.3em] mt-2">
                  Владивосток
                </motion.span>
              </div>
              
              <motion.div layout className="flex items-center gap-2 text-navy/60 font-bold text-sm mb-6">
                <User className="w-4 h-4 text-bright-blue" />
                Тренер: Молоков Евгений Валерьевич
              </motion.div>

              <motion.div layout className="flex items-center gap-6 bg-white/30 backdrop-blur-md px-8 py-4 rounded-3xl border border-white/20">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1">Место</span>
                  <span className="text-2xl text-strong text-bright-blue">{stats.rank}</span>
                </div>
                <div className="w-px h-10 bg-navy/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1">Очки</span>
                  <span className="text-2xl text-strong text-bright-blue">{stats.points}</span>
                </div>
                <div className="w-px h-10 bg-navy/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-navy/40 uppercase tracking-widest mb-1">Последние матчи</span>
                  <div className="flex gap-1.5 mt-1">
                    {stats.lastResults.map((r, i) => <ResultCircle key={i} result={r} />)}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                layout
                className="mt-8 w-12 h-12 rounded-full bg-white/50 flex items-center justify-center text-navy/40 hover:bg-white transition-colors shadow-inner"
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
                className="border-t border-white/20 bg-white/20"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg text-strong text-navy">Состав команды</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('name'); }}
                        className={`text-[9px] font-bold px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${sortBy === 'name' ? 'bg-navy text-white border-navy shadow-lg' : 'bg-white/50 text-navy/60 border-white/40'}`}
                      >
                        <SortAsc className="w-3 h-3" /> А-Я
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('goals'); }}
                        className={`text-[9px] font-bold px-4 py-2 rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap ${sortBy === 'goals' ? 'bg-navy text-white border-navy shadow-lg' : 'bg-white/50 text-navy/60 border-white/40'}`}
                      >
                        <Target className="w-3 h-3" /> Голы
                      </button>
                    </div>
                  </div>

                  <div className="space-y-10">
                    {positionGroups.map(group => {
                      const groupPlayers = groupedPlayers[group.key];
                      if (!groupPlayers || groupPlayers.length === 0) return null;

                      return (
                        <div key={group.key}>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="h-[3px] w-6 gradient-bg rounded-full" />
                            <h4 className="text-xs text-strong text-navy/40">{group.label}</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {groupPlayers.map(player => (
                              <div key={player.id} className="bg-white/60 rounded-2xl p-4 border border-white/40 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-12 h-12 flex-shrink-0">
                                    <img 
                                      src={player.photoUrl} 
                                      alt={player.name} 
                                      className="w-full h-full object-cover rounded-xl border-2 border-white shadow-md"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute -top-1.5 -left-1.5 w-6 h-6 gradient-bg rounded-full flex items-center justify-center text-white text-strong text-[10px] border-2 border-white shadow-lg">
                                      {player.number || '—'}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-navy">{player.name}</div>
                                    <div className="text-[10px] font-bold text-navy/40 uppercase tracking-wider">
                                      {player.position === 'врт' ? 'Вратарь' : 
                                       player.position === 'защ' ? 'Защитник' : 
                                       player.position === 'цп' ? 'Полузащитник' : 
                                       player.position === 'нап' ? 'Нападающий' : player.position}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg text-strong text-bright-blue">{player.goals}</div>
                                  <div className="text-[9px] font-bold text-navy/30 uppercase tracking-tighter">
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
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    className="px-4 mb-6"
  >
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-[20px] rounded-2xl p-3 flex items-center gap-3 border border-white/10 shadow-xl"
    >
      <motion.div 
        whileHover={{ rotate: 15 }}
        className="p-2 gradient-bg rounded-lg shadow-md"
      >
        <Icon className="w-5 h-5 text-white" />
      </motion.div>
      <h3 className="text-lg text-strong text-white drop-shadow-sm uppercase tracking-wider">{title}</h3>
    </motion.div>
  </motion.div>
);

const TournamentTable = ({ data }: { data: TableRow[] }) => (
  <section className="py-10">
    <div className="max-w-4xl mx-auto">
      <SectionTitle title="Турнирная таблица" icon={Trophy} />
      <div className="px-4">
        <div className="glass-card rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-navy/50 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-2 py-3 text-center w-8">#</th>
                <th className="px-4 py-3">Команда</th>
                <th className="px-3 py-3 text-center">И</th>
                <th className="px-3 py-3 text-center">В</th>
                <th className="px-3 py-3 text-center">Н</th>
                <th className="px-3 py-3 text-center">П</th>
                <th className="px-3 py-3 text-center">Мячи</th>
                <th className="px-3 py-3 text-center">+/-</th>
                <th className="px-4 py-3 text-center">О</th>
                <th className="px-4 py-3">Последние матчи</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row) => {
                const isDinamo = row.teamName === 'Динамо-Владивосток';
                return (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                    key={row.teamName} 
                    className={`${isDinamo ? 'bg-bright-blue/10 ring-2 ring-inset ring-accent' : 'transition-colors'}`}
                  >
                    <td className="px-2 py-4 text-center font-bold text-navy/60">{row.rank}</td>
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
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  </section>
);

const TEAM_LOGOS: Record<string, string> = {
  'Динамо-Владивосток': 'https://upload.wikimedia.org/wikipedia/ru/thumb/1/1a/FC_Dynamo_Vladivostok_logo.png/200px-FC_Dynamo_Vladivostok_logo.png',
  // Добавьте сюда ссылки на логотипы других команд
};

const TeamLogo = ({ name, size = "w-6 h-6" }: { name: string, size?: string }) => {
  const logoUrl = TEAM_LOGOS[name];

  if (logoUrl) {
    return (
      <div className={`${size} flex items-center justify-center overflow-hidden rounded-md`}>
        <img 
          src={logoUrl} 
          alt={name} 
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

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
  return (
    <div className="px-4 py-10">
      <SectionTitle title="География турнира" icon={MapIcon} />
      <div className="glass-card rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 overflow-hidden relative min-h-[400px] flex items-center justify-center">
        {/* Placeholder for the Geography Image */}
        <div className="w-full h-full flex items-center justify-center bg-slate-100/50 rounded-2xl overflow-hidden min-h-[300px]">
          <img 
            src="https://picsum.photos/seed/fareast/1200/800" 
            alt="География турнира" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </div>
  );
};

const MatchRow: React.FC<{ match: Match }> = ({ match }) => {
  const isFinished = !!(match.homeScore !== undefined && match.awayScore !== undefined);
  const dayOfWeek = getDayOfWeek(match.date);

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="p-4 transition-colors">
        <div className="mb-3">
          {/* Line 1: Date */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-white/10 text-navy/60 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{dayOfWeek}</span>
            <span className="text-[10px] font-bold text-navy/40 uppercase tracking-wider">{match.date}</span>
          </div>
          
          {/* Line 2: Location + Icons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] font-bold text-bright-blue uppercase tracking-tight">
              <MapPin className="w-2.5 h-2.5" />
              {match.location}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Video Icon */}
              {match.broadcastUrl ? (
                <a 
                  href={match.broadcastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bright-blue hover:scale-110 transition-transform"
                  title="Трансляция"
                >
                  <Video className="w-4 h-4" />
                </a>
              ) : (
                <Video className="w-4 h-4 text-navy/10" />
              )}

              {/* Photo Icon */}
              {match.photoUrl ? (
                <a 
                  href={match.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bright-blue hover:scale-110 transition-transform"
                  title="Фото"
                >
                  <ImageIcon className="w-4 h-4" />
                </a>
              ) : (
                <ImageIcon className="w-4 h-4 text-navy/10" />
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo name={match.homeTeam} />
              <span className={`text-sm ${match.homeTeam === 'Динамо-Владивосток' ? 'font-black text-navy' : 'font-bold text-navy/70'}`}>
                {match.homeTeam}
              </span>
            </div>
            {isFinished && <span className="text-sm font-black text-navy">{match.homeScore}</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamLogo name={match.awayTeam} />
              <span className={`text-sm ${match.awayTeam === 'Динамо-Владивосток' ? 'font-black text-navy' : 'font-bold text-navy/70'}`}>
                {match.awayTeam}
              </span>
            </div>
            {isFinished && <span className="text-sm font-black text-navy">{match.awayScore}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const UpcomingMatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const dayOfWeek = getDayOfWeek(match.date);
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-md rounded-[24px] p-5 shadow-xl border border-white/40 min-w-[280px] flex-shrink-0 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="gradient-bg text-white text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">{dayOfWeek}</span>
          <span className="text-[10px] font-bold text-navy/60 uppercase tracking-widest">{match.date}</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-bold text-bright-blue uppercase tracking-widest">
          <MapPin className="w-3 h-3 text-accent" />
          <span className="truncate max-w-[100px]">{match.location}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex flex-col items-center flex-1 overflow-hidden">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shadow-sm mb-1.5">
            <TeamLogo name={match.homeTeam} size="w-5 h-5" />
          </div>
          <span className="text-[11px] text-strong text-navy truncate w-full text-center">{match.homeTeam}</span>
        </div>
        <div className="flex flex-col items-center px-1">
          <span className="text-[9px] font-black text-navy/20 mb-0.5">VS</span>
          <span className="text-[11px] text-strong text-bright-blue">{match.time}</span>
        </div>
        <div className="flex flex-col items-center flex-1 overflow-hidden">
          <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shadow-sm mb-1.5">
            <TeamLogo name={match.awayTeam} size="w-5 h-5" />
          </div>
          <span className="text-[11px] text-strong text-navy truncate w-full text-center">{match.awayTeam}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
        <div className="flex flex-col items-center gap-1">
          {match.broadcastUrl ? (
            <a 
              href={match.broadcastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] font-black text-bright-blue uppercase tracking-widest hover:underline"
            >
              Трансляция
            </a>
          ) : (
            <span className="text-[9px] font-black text-navy/20 uppercase tracking-widest">Трансляция</span>
          )}
          {match.weather && (
            <span className="text-[8px] font-bold text-navy/30 uppercase tracking-widest">
              {match.weather}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const MatchList = ({ matches, title, icon }: { matches: Match[], title: string, icon: any }) => {
  const isUpcoming = title === "Предстоящие матчи";
  
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
    <div className="px-4 py-10">
      <SectionTitle title={title} icon={icon} />
      {isUpcoming ? (
        <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-4">
          {displayMatches.length > 0 ? (
            displayMatches.slice(0, 5).map(match => <UpcomingMatchCard key={match.id} match={match} />)
          ) : (
            <div className="w-full p-12 text-center text-white/40 text-sm italic glass-card rounded-[32px] border border-white/20">Матчей не найдено</div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-[32px] shadow-2xl border border-white/20 overflow-hidden">
          {filteredMatches.length > 0 ? (
            filteredMatches.map(match => <MatchRow key={match.id} match={match} />)
          ) : (
            <div className="p-12 text-center text-white/40 text-sm italic">Матчей не найдено</div>
          )}
        </div>
      )}
    </div>
  );
};

const PastMatchesList = ({ matches }: { matches: Match[] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pastMatches = matches
    .filter(m => m.status === 'Завершен' && (m.homeTeam === 'Динамо-Владивосток' || m.awayTeam === 'Динамо-Владивосток'))
    .sort((a, b) => b.id - a.id);

  if (pastMatches.length === 0) return null;

  return (
    <section className="py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="glass-card rounded-2xl border border-white/20 overflow-hidden">
          <div 
            className="p-4 flex items-center justify-between bg-white/30 cursor-pointer hover:bg-white/40 transition-colors"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 gradient-bg rounded-lg shadow-md">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm text-strong text-navy uppercase tracking-wider">Прошедшие матчи</h3>
            </div>
            <div className="text-navy/40">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="divide-y divide-white/10"
              >
                {pastMatches.map(match => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

const AppFooter = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <footer className="mt-12 pb-12 px-4 relative z-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* PWA & Support Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Install Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-[32px] p-6 border border-white/40 flex flex-col justify-between"
          >
            <div>
              <h3 className="text-sm text-strong text-navy mb-1">Приложение на главном экране</h3>
              <p className="text-[10px] font-medium text-navy/40 mb-4 leading-relaxed">
                Установите РЮФЛ-2026 как приложение для быстрого доступа к результатам
              </p>
            </div>
            <button 
              onClick={handleInstall}
              className="w-full bg-bright-blue text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-bright-blue/20"
            >
              <Download className="w-3.5 h-3.5" />
              Установить
            </button>
          </motion.div>

          {/* Support Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-[32px] p-6 border border-white/40"
          >
            <h3 className="text-sm text-strong text-navy mb-1">Поддержать проект</h3>
            <p className="text-[10px] font-medium text-navy/40 mb-4 leading-relaxed">
              Ваша поддержка помогает развивать приложение и обновлять данные
            </p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => copyToClipboard('4276500050261351', 'sber')}
                className="flex-1 h-12 bg-white/50 rounded-2xl border border-white/40 flex items-center justify-center relative group overflow-hidden transition-all active:scale-95"
                title="Скопировать номер карты Сбер"
              >
                <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {copied === 'sber' ? (
                  <Check className="w-5 h-5 text-green-600 animate-in zoom-in" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                    </div>
                    <span className="text-[10px] font-black text-navy/60 uppercase tracking-tighter">Сбер</span>
                  </div>
                )}
              </button>
              <button 
                onClick={() => copyToClipboard('2200700717929292', 'tbank')}
                className="flex-1 h-12 bg-white/50 rounded-2xl border border-white/40 flex items-center justify-center relative group overflow-hidden transition-all active:scale-95"
                title="Скопировать номер карты Т-Банк"
              >
                <div className="absolute inset-0 bg-yellow-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                {copied === 'tbank' ? (
                  <Check className="w-5 h-5 text-yellow-600 animate-in zoom-in" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
                      <div className="w-3 h-3 bg-navy rounded-full opacity-80" />
                    </div>
                    <span className="text-[10px] font-black text-navy/60 uppercase tracking-tighter">Т-Банк</span>
                  </div>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Developer & Info */}
        <div className="text-center pt-4">
          <a 
            href="https://t.me/sigidin" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] hover:text-bright-blue transition-colors"
          >
            2026 @ Данил Сигидин
          </a>
        </div>
      </div>
    </footer>
  );
};

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
                photoUrl: row['Фото'],
                broadcastUrl: row['Трансляция'],
                weather: row['Погода']
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
    <div className="min-h-screen flex flex-col pt-[130px] md:pt-[140px] relative">
      <div className="app-background" />
      <Header />
      
      <div className="relative z-10">
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
            title="Предстоящие матчи" 
            icon={Calendar} 
            matches={data.allMatches} 
          />

          <PastMatchesList matches={data.allMatches} />

          <FarEastMap />
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
