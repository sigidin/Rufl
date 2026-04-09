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
  Video,
  Users
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

const formatDate = (dateStr: string) => {
  try {
    const [day, month] = dateStr.split('.').map(Number);
    const months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${day} ${months[month - 1]}`;
  } catch (e) {
    return dateStr;
  }
};

const Header = () => (
  <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-bright-blue/30 backdrop-blur-xl">
    <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col items-center text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-bright-blue/5 via-transparent to-neon-pink/5 pointer-events-none" />
      <div className="flex flex-col items-center">
        <div className="text-[10px] text-strong text-bright-blue tracking-[0.4em] animate-pulse mb-1">неофициальное приложение</div>
        <h1 className="text-2xl md:text-3xl text-strong gradient-text glitch-hover cursor-default leading-tight">
          ДИНАМО на РЮФЛ-26!
        </h1>
      </div>
      <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">
        Russian Youth Football League | Дальний Восток
      </p>
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
  const [copied, setCopied] = useState(false);
  const [showStream, setShowStream] = useState(false);
  if (!match) return null;

  const getTeamForm = (teamName: string) => {
    const row = table.find(r => r.teamName === teamName);
    return row ? row.lastGames : [];
  };

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(match.location).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getVkEmbedUrl = (url: string) => {
    const match = url.match(/video(-?\d+)_(\d+)/);
    if (match) {
      return `https://vk.com/video_ext.php?oid=${match[1]}&id=${match[2]}&hd=2`;
    }
    return null;
  };

  const homeForm = getTeamForm(match.homeTeam);
  const awayForm = getTeamForm(match.awayTeam);
  const vkEmbedUrl = match.broadcastUrl ? getVkEmbedUrl(match.broadcastUrl) : null;

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
          whileHover={{ y: -5 }}
          className="glass-card rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden border-bright-blue/30 cyber-border"
        >
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-bright-blue">{formatDate(match.date)}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-xl font-black text-white">{match.time}</span>
                </div>
                <button 
                  onClick={copyAddress}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <Navigation className={`w-3.5 h-3.5 ${copied ? 'text-green-400' : 'text-bright-blue group-hover:animate-bounce'}`} />
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">{match.location}</span>
                  {copied && <Check className="w-3 h-3 text-green-400" />}
                </button>
              </div>
              {match.weather && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-neon-yellow uppercase tracking-[0.2em] mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow animate-pulse" />
                  Погода: {match.weather}
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 md:gap-12 mb-10">
              <div className="flex flex-col items-center flex-1">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-24 h-24 bg-navy/80 rounded-full flex items-center justify-center mb-4 shadow-xl border border-bright-blue/30 neon-glow p-2"
                >
                  <TeamLogo name={match.homeTeam} size="w-16 h-16" />
                </motion.div>
                <div className="text-strong text-sm text-center leading-tight mb-3 min-h-[40px] flex items-center justify-center">
                  {match.homeTeam}
                </div>
                <div className="flex gap-1.5 justify-center">
                  {homeForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <motion.div 
                  whileHover={{ scale: 1.2, textShadow: "0 0 20px rgba(0, 240, 255, 0.8)" }}
                  className="text-5xl font-black text-white tracking-tighter italic transition-all cursor-default select-none"
                >
                  VS
                </motion.div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-24 h-24 bg-navy/80 rounded-full flex items-center justify-center mb-4 shadow-xl border border-bright-blue/30 neon-glow p-2"
                >
                  <TeamLogo name={match.awayTeam} size="w-16 h-16" />
                </motion.div>
                <div className="text-strong text-sm text-center leading-tight mb-3 min-h-[40px] flex items-center justify-center">
                  {match.awayTeam}
                </div>
                <div className="flex gap-1.5 justify-center">
                  {awayForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-center">
                {match.broadcastUrl ? (
                  <motion.button 
                    onClick={() => setShowStream(!showStream)}
                    whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 240, 255, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-3 px-8 py-3.5 ${showStream ? 'bg-white text-navy' : 'bg-bright-blue text-navy'} font-black uppercase tracking-[0.2em] rounded-xl text-xs shadow-lg shadow-bright-blue/30 transition-all`}
                  >
                    <Video className="w-4 h-4" />
                    {showStream ? 'Закрыть трансляцию' : 'Смотреть трансляцию'}
                  </motion.button>
                ) : (
                  <div className="flex items-center gap-3 px-8 py-3.5 bg-white/5 text-white/20 rounded-xl text-xs font-black uppercase tracking-[0.2em] border border-white/10 cursor-not-allowed">
                    <Video className="w-4 h-4" />
                    Трансляция недоступна
                  </div>
                )}
              </div>

              <AnimatePresence>
                {showStream && match.broadcastUrl && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="w-full overflow-hidden"
                  >
                    <div className="relative pt-[56.25%] w-full bg-navy/50 rounded-2xl border border-bright-blue/20 overflow-hidden shadow-2xl">
                      {vkEmbedUrl ? (
                        <iframe 
                          src={vkEmbedUrl} 
                          className="absolute top-0 left-0 w-full h-full"
                          allow="autoplay; encrypted-media; fullscreen; picture-in-picture;" 
                          frameBorder="0" 
                          allowFullScreen
                        />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                          <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">
                            Прямой плеер не поддерживается для этой ссылки
                          </p>
                          <a 
                            href={match.broadcastUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-bright-blue text-[10px] font-black uppercase underline tracking-widest"
                          >
                            Открыть в новом окне
                          </a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
    <div className="px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          layout
          whileHover={{ y: -5 }}
          className="glass-card rounded-[40px] shadow-2xl border border-bright-blue/30 overflow-hidden cyber-border"
        >
          <div 
            className="p-6 cursor-pointer relative"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex flex-col items-center text-center relative z-10">
              <motion.div 
                layout
                className="w-28 h-28 gradient-bg rounded-full flex items-center justify-center shadow-2xl mb-4 border-4 border-bright-blue/20 neon-glow p-4"
              >
                <TeamLogo name="Динамо-Владивосток" size="w-full h-full" scale="w-[170%] h-[170%]" />
              </motion.div>
              
              <div className="flex flex-col items-center mb-4">
                <motion.h2 layout className="text-5xl font-oswald font-extrabold text-white leading-none tracking-tighter">
                  ДИНАМО
                </motion.h2>
                <motion.span layout className="text-sm font-oswald font-extrabold text-bright-blue uppercase tracking-[0.4em] mt-2">
                  Владивосток
                </motion.span>
              </div>
              
              <motion.div layout className="flex items-center gap-3 text-white/60 font-bold text-[10px] mb-6 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10">
                <User className="w-3.5 h-3.5 text-bright-blue" />
                <span>Главный тренер: Молоков Евгений Валерьевич</span>
              </motion.div>

              <motion.div layout className="flex items-center gap-6 md:gap-12 bg-navy/80 backdrop-blur-xl px-8 py-4 rounded-3xl border border-bright-blue/30 shadow-2xl">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Место</span>
                  <span className="text-2xl font-black text-bright-blue">{stats.rank}</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Очки</span>
                  <span className="text-2xl font-black text-bright-blue">{stats.points}</span>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Последние матчи</span>
                  <div className="flex gap-1.5 mt-1">
                    {stats.lastResults.map((r, i) => <ResultCircle key={i} result={r} />)}
                  </div>
                </div>
              </motion.div>

              <motion.div 
                layout
                className="mt-6 w-10 h-10 rounded-full bg-bright-blue/10 flex items-center justify-center text-bright-blue hover:bg-bright-blue hover:text-navy transition-all shadow-lg border border-bright-blue/20"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-bright-blue/20 bg-navy/40"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-10">
                    <h3 className="text-xl text-strong text-white italic">Состав команды</h3>
                    <div className="flex gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('name'); }}
                        className={`text-[10px] font-black px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 uppercase tracking-widest ${sortBy === 'name' ? 'bg-bright-blue text-navy border-bright-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        <SortAsc className="w-3.5 h-3.5" /> А-Я
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('goals'); }}
                        className={`text-[10px] font-black px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 uppercase tracking-widest ${sortBy === 'goals' ? 'bg-bright-blue text-navy border-bright-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        <Target className="w-3.5 h-3.5" /> Голы
                      </button>
                    </div>
                  </div>

                  <div className="space-y-12">
                    {positionGroups.map(group => {
                      const groupPlayers = groupedPlayers[group.key];
                      if (!groupPlayers || groupPlayers.length === 0) return null;

                      return (
                        <div key={group.key}>
                          <div className="flex items-center gap-4 mb-6">
                            <div className="h-[2px] w-8 gradient-bg rounded-full" />
                            <h4 className="text-[11px] font-black text-bright-blue uppercase tracking-[0.3em]">{group.label}</h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {groupPlayers.map(player => (
                              <div key={player.id} className="relative bg-navy/80 rounded-3xl overflow-hidden border border-white/10 shadow-2xl hover:border-bright-blue/50 transition-all group h-32 flex">
                                {/* Background Image for the card */}
                                <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                                  <img 
                                    src="https://files.catbox.moe/b25sk5.png" 
                                    alt="" 
                                    className="w-full h-full object-cover object-top"
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/80 to-transparent" />
                                </div>

                                <div className="relative z-10 flex items-center p-4 w-full">
                                  <div className="relative w-24 h-24 flex-shrink-0 mr-4">
                                    <div className="absolute inset-0 bg-bright-blue/20 rounded-2xl blur-md group-hover:bg-bright-blue/40 transition-all" />
                                    <img 
                                      src={player.photoUrl} 
                                      alt={player.name} 
                                      className="w-full h-full object-cover rounded-2xl border border-white/20 shadow-2xl relative z-10"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute -top-2 -left-2 w-8 h-8 gradient-bg rounded-lg flex items-center justify-center text-white text-strong text-xs border border-white/20 shadow-xl italic z-20">
                                      {player.number || '—'}
                                    </div>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="text-lg font-black text-white group-hover:text-bright-blue transition-colors truncate leading-tight">{player.name}</div>
                                    <div className="text-[10px] font-bold text-bright-blue/60 uppercase tracking-[0.2em] mt-1">
                                      {player.position === 'врт' ? 'Вратарь' : 
                                       player.position === 'защ' ? 'Защитник' : 
                                       player.position === 'цп' ? 'Полузащитник' : 
                                       player.position === 'нап' ? 'Нападающий' : player.position}
                                    </div>
                                    
                                    <div className="mt-3 flex items-center gap-4">
                                      <div className="flex flex-col">
                                        <span className="text-xl text-strong text-white italic leading-none">{player.goals}</span>
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-tighter">
                                          {player.position.includes('врт') ? 'Пропущено' : 'Голы'}
                                        </span>
                                      </div>
                                    </div>
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
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="px-4 mb-8 flex justify-center"
  >
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="bg-navy/60 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 border border-bright-blue/30 shadow-[0_0_20px_rgba(0,240,255,0.15)] cyber-border"
    >
      <motion.div 
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.5 }}
        className="p-2.5 gradient-bg rounded-xl shadow-lg"
      >
        <Icon className="w-6 h-6 text-white" />
      </motion.div>
      <h3 className="text-xl md:text-2xl text-strong text-white uppercase tracking-widest italic">{title}</h3>
    </motion.div>
  </motion.div>
);

const TournamentTable = ({ data }: { data: TableRow[] }) => (
  <section className="py-10">
    <div className="max-w-4xl mx-auto">
      <SectionTitle title="Турнирная таблица" icon={Trophy} />
      <div className="px-2">
        <div className="glass-card rounded-2xl shadow-2xl border border-bright-blue/20 overflow-hidden cyber-border">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-[11px] md:text-sm">
            <thead className="bg-navy/80 text-bright-blue uppercase text-[9px] font-black tracking-widest border-b border-bright-blue/20">
              <tr>
                <th className="px-2 py-4 text-center w-8">#</th>
                <th className="px-3 py-4">Команда</th>
                <th className="px-2 py-4 text-center">О</th>
                <th className="px-2 py-4 text-center">И</th>
                <th className="px-2 py-4 text-center">В</th>
                <th className="px-2 py-4 text-center">Н</th>
                <th className="px-2 py-4 text-center">П</th>
                <th className="px-2 py-4 text-center hidden sm:table-cell">Мячи</th>
                <th className="px-2 py-4 text-center">+/-</th>
                <th className="px-3 py-4">Сыграны</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bright-blue/10">
              {data.map((row) => {
                const isDinamo = row.teamName === 'Динамо-Владивосток';
                const teamParts = row.teamName.split('-');
                return (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ backgroundColor: "rgba(0, 240, 255, 0.05)" }}
                    key={row.teamName} 
                    className={`${isDinamo ? 'bg-bright-blue/10' : ''} transition-colors`}
                  >
                    <td className="px-2 py-4 text-center">
                      <span className={`font-black ${isDinamo ? 'text-bright-blue text-base' : row.rank <= 3 ? 'text-green-400 text-base' : 'text-white/80'}`}>{row.rank}</span>
                    </td>
                    <td className="px-3 py-4 font-bold text-white">
                      <div className="flex items-center gap-2">
                        <TeamLogo name={row.teamName} size="w-7 h-7" />
                        <div className="flex flex-col leading-tight">
                          <span className={`${isDinamo ? 'text-bright-blue' : ''} uppercase text-[11px] md:text-sm`}>{teamParts[0]}</span>
                          {teamParts[1] && <span className="text-[9px] opacity-50 font-medium">{teamParts[1]}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center font-black text-bright-blue text-base md:text-lg">{row.points}</td>
                    <td className="px-2 py-4 text-center font-medium text-white/70">{row.played}</td>
                    <td className="px-2 py-4 text-center text-green-400 font-bold">{row.won}</td>
                    <td className="px-2 py-4 text-center text-neon-yellow font-bold">{row.drawn}</td>
                    <td className="px-2 py-4 text-center text-red-400 font-bold">{row.lost}</td>
                    <td className="px-2 py-4 text-center text-white/50 hidden sm:table-cell">{row.goalsFor}-{row.goalsAgainst}</td>
                    <td className="px-2 py-4 text-center font-medium text-white/70">{row.goalsFor - row.goalsAgainst}</td>
                    <td className="px-3 py-4">
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
  'Динамо-Владивосток': 'https://fcdynamo25.ru/templates/fc-dinamo25/images/logo-blue.png',
  'Академия Динамо': 'https://fcdynamo25.ru/templates/fc-dinamo25/images/logo-blue.png',
  // Добавьте сюда ссылки на логотипы других команд
};

const TeamLogo = ({ name, size = "w-6 h-6", scale = "w-[130%] h-[130%]" }: { name: string, size?: string, scale?: string }) => {
  const logoUrl = TEAM_LOGOS[name];

  if (logoUrl) {
    return (
      <div className={`${size} flex items-center justify-center overflow-hidden rounded-full`}>
        <img 
          src={logoUrl} 
          alt={name} 
          className={`${scale} object-contain max-w-none`}
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
    <div className="px-0 py-10 max-w-4xl mx-auto relative">
      <div className="w-full overflow-hidden relative rounded-3xl shadow-2xl border border-white/10">
        <img 
          src="https://files.catbox.moe/ya1luu.png" 
          alt="География турнира" 
          className="w-full h-auto object-cover"
          referrerPolicy="no-referrer"
        />
        
        {/* Visitor Stats Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-navy/80 backdrop-blur-md border-t border-white/10 p-4">
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Посетителей за месяц</span>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-bright-blue" />
                <span className="text-xs font-black text-white tracking-wider">1,248</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Сейчас онлайн</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-black text-white tracking-wider">42</span>
              </div>
            </div>
          </div>
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
      <div className="p-5 transition-colors hover:bg-white/5">
        <div className="mb-4">
          {/* Line 1: Date */}
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-bright-blue/10 text-bright-blue text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{dayOfWeek}</span>
            <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">{formatDate(match.date)}</span>
          </div>
          
          {/* Line 2: Location + Icons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-black text-bright-blue uppercase tracking-widest italic">
              <MapPin className="w-3 h-3" />
              {match.location}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Video Icon */}
              {match.broadcastUrl ? (
                <a 
                  href={match.broadcastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bright-blue hover:scale-125 transition-transform neon-glow p-1 rounded-md"
                  title="Трансляция"
                >
                  <Video className="w-4.5 h-4.5" />
                </a>
              ) : (
                <Video className="w-4.5 h-4.5 text-white/10" />
              )}

              {/* Photo Icon */}
              {match.photoUrl ? (
                <a 
                  href={match.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bright-blue hover:scale-125 transition-transform neon-glow p-1 rounded-md"
                  title="Фото"
                >
                  <ImageIcon className="w-4.5 h-4.5" />
                </a>
              ) : (
                <ImageIcon className="w-4.5 h-4.5 text-white/10" />
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo name={match.homeTeam} size="w-7 h-7" />
              <span className={`text-base ${match.homeTeam === 'Динамо-Владивосток' ? 'font-black text-bright-blue italic' : 'font-bold text-white/80'}`}>
                {match.homeTeam}
              </span>
            </div>
            {isFinished && <span className="text-xl font-black text-white italic">{match.homeScore}</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo name={match.awayTeam} size="w-7 h-7" />
              <span className={`text-base ${match.awayTeam === 'Динамо-Владивосток' ? 'font-black text-bright-blue italic' : 'font-bold text-white/80'}`}>
                {match.awayTeam}
              </span>
            </div>
            {isFinished && <span className="text-xl font-black text-white italic">{match.awayScore}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

const UpcomingMatchCard: React.FC<{ match: Match }> = ({ match }) => {
  const [copied, setCopied] = useState(false);
  const dayOfWeek = getDayOfWeek(match.date);

  const copyAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(match.location).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatTeamName = (name: string) => {
    if (name.includes('-')) {
      const parts = name.split('-');
      return (
        <div className="flex flex-col items-center">
          <span className="uppercase text-[13px]">{parts[0]}</span>
          <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">{parts[1]}</span>
        </div>
      );
    }
    if (name.includes(' ')) {
      const parts = name.split(' ');
      return (
        <div className="flex flex-col items-center">
          <span className="uppercase text-[13px]">{parts[0]}</span>
          <span className="text-[9px] opacity-60 font-medium uppercase tracking-tighter">{parts[1]}</span>
        </div>
      );
    }
    return <span className="uppercase text-[13px]">{name}</span>;
  };

  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-navy/60 backdrop-blur-xl rounded-[24px] p-6 shadow-2xl border border-bright-blue/20 min-w-[300px] flex-shrink-0 transition-all cyber-border overflow-hidden"
    >
      <div className="flex items-center justify-center mb-5">
        <div className="flex items-center gap-2">
          <span className="gradient-bg text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{dayOfWeek}</span>
          <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">{formatDate(match.date)}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-4 mb-6 relative">
        <div className="flex flex-col items-center flex-1 overflow-hidden">
          <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center shadow-lg mb-2 border border-white/5 neon-glow p-1">
            <TeamLogo name={match.homeTeam} size="w-10 h-10" />
          </div>
          <div className="text-strong text-white w-full text-center leading-tight">
            {formatTeamName(match.homeTeam)}
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-14">
          <span className="text-[10px] font-black text-white/10">VS</span>
        </div>

        <div className="flex flex-col items-center flex-1 overflow-hidden">
          <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center shadow-lg mb-2 border border-white/5 neon-glow p-1">
            <TeamLogo name={match.awayTeam} size="w-10 h-10" />
          </div>
          <div className="text-strong text-white w-full text-center leading-tight">
            {formatTeamName(match.awayTeam)}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-lg font-black text-bright-blue italic">{match.time}</span>
        <button 
          onClick={copyAddress}
          className="flex items-center gap-1.5 text-[8px] font-bold text-bright-blue/60 uppercase tracking-widest hover:text-white transition-colors group"
        >
          <Navigation className={`w-2.5 h-2.5 ${copied ? 'text-green-400' : 'group-hover:animate-pulse'}`} />
          <span className={`truncate max-w-[120px] ${copied ? 'text-green-400' : ''}`}>{copied ? 'OK!' : match.location}</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            {match.broadcastUrl ? (
              <a 
                href={match.broadcastUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[10px] font-black text-bright-blue uppercase tracking-widest hover:underline"
              >
                <Video className="w-3.5 h-3.5" />
                Эфир
              </a>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-black text-white/20 uppercase tracking-widest">
                <Video className="w-3.5 h-3.5" />
                Оффлайн
              </span>
            )}
          </div>
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
        <div 
          className="cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="px-4 mb-8 flex justify-center relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-navy/60 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 border border-bright-blue/30 shadow-[0_0_20px_rgba(0,240,255,0.15)] cyber-border"
            >
              <motion.div 
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="p-2.5 gradient-bg rounded-xl shadow-lg"
              >
                <ChevronDown className="w-6 h-6 text-white" />
              </motion.div>
              <h3 className="text-xl md:text-2xl text-strong text-white uppercase tracking-widest italic">Прошедшие матчи</h3>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="glass-card rounded-[32px] border border-white/20 overflow-hidden divide-y divide-white/10"
            >
              {pastMatches.map(match => (
                <MatchRow key={match.id} match={match} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        alert('Чтобы установить приложение на iPhone: нажмите кнопку "Поделиться" внизу экрана и выберите "На экран Домой"');
      } else {
        alert('Чтобы установить приложение: нажмите в Chrome три точки (меню) и выберите "Добавить на главный экран"');
      }
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
            className="glass-card rounded-[32px] p-6 border border-white/40 flex flex-col items-center text-center"
          >
            <div className="flex flex-col items-center">
              <h3 className="text-sm text-strong text-white mb-1">Приложение на главном экране</h3>
              <p className="text-[10px] font-medium text-white/60 mb-4 leading-relaxed">
                Установите РЮФЛ-2026 как приложение для быстрого доступа к результатам
              </p>
            </div>
            <motion.button 
              onClick={handleInstall}
              whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0, 240, 255, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="w-full max-w-[200px] bg-bright-blue text-navy text-[10px] font-black uppercase tracking-widest py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-bright-blue/20"
            >
              <Download className="w-3.5 h-3.5" />
              Установить
            </motion.button>
          </motion.div>

          {/* Support Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-[32px] p-6 border border-white/40 flex flex-col items-center text-center"
          >
            <h3 className="text-sm text-strong text-white mb-1">Поддержать проект</h3>
            <p className="text-[10px] font-medium text-white/60 mb-4 leading-relaxed">
              Ваша поддержка помогает развивать приложение и обновлять данные
            </p>
            <div className="flex items-center gap-4 w-full">
              <motion.button 
                onClick={() => copyToClipboard('4276500050261351', 'sber')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 h-12 bg-bright-blue/10 rounded-2xl border border-bright-blue/30 flex items-center justify-center relative group overflow-hidden transition-all"
                title="Скопировать номер карты Сбер"
              >
                {copied === 'sber' ? (
                  <Check className="w-5 h-5 text-green-400 animate-in zoom-in" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <div className="w-3 h-3 bg-white rounded-full opacity-80" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Сбер</span>
                  </div>
                )}
              </motion.button>
              <motion.button 
                onClick={() => copyToClipboard('2200700717929292', 'tbank')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 h-12 bg-bright-blue/10 rounded-2xl border border-bright-blue/30 flex items-center justify-center relative group overflow-hidden transition-all"
                title="Скопировать номер карты Т-Банк"
              >
                {copied === 'tbank' ? (
                  <Check className="w-5 h-5 text-green-400 animate-in zoom-in" />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-sm">
                      <div className="w-3 h-3 bg-navy rounded-full opacity-80" />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">Т-Банк</span>
                  </div>
                )}
              </motion.button>
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
            photoUrl: row['фото'] || `https://picsum.photos/seed/${row['имя'] || idx}/200`
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
            const calculateTable = (matchList: Match[]) => {
              const teams = Array.from(new Set(matchList.flatMap(m => [m.homeTeam, m.awayTeam])));
              const tableData = teams.map(team => {
                const teamMatches = matchList.filter(m => (m.homeTeam === team || m.awayTeam === team) && m.status === 'Завершен');
                
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
                  rank: 0,
                  rankChange: 0 
                };
              });

              tableData.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor);
              tableData.forEach((row, idx) => row.rank = idx + 1);
              return tableData;
            };

            const currentTable = calculateTable(matches);
            
            // Calculate Previous Table for Rank Change
            const finishedMatches = matches.filter(m => m.status === 'Завершен');
            if (finishedMatches.length > 0) {
              const dates = Array.from(new Set(finishedMatches.map(m => m.date)));
              dates.sort((a, b) => {
                const [da, ma, ya] = a.split('.').map(Number);
                const [db, mb, yb] = b.split('.').map(Number);
                return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
              });
              
              const lastDate = dates[dates.length - 1];
              const previousMatches = finishedMatches.filter(m => m.date !== lastDate);
              const previousTable = calculateTable(previousMatches);

              currentTable.forEach(row => {
                const prevRow = previousTable.find(p => p.teamName === row.teamName);
                if (prevRow && row.played > prevRow.played) {
                  row.rankChange = prevRow.rank - row.rank;
                } else {
                  row.rankChange = 0;
                }
              });
            }

            const table = currentTable;
            const dinamoRow = table.find(t => t.teamName === 'Динамо-Владивосток');
            const nextMatch = matches.find(m => m.status === 'Ожидается' && (m.homeTeam === 'Динамо-Владивосток' || m.awayTeam === 'Динамо-Владивосток')) || null;
            const upcomingMatches = matches.filter(m => m.status === 'Ожидается').sort((a, b) => a.id - b.id).slice(0, 5);

            setData({
              table,
              allMatches: matches,
              dinamoMatches: matches.filter(m => m.homeTeam === 'Динамо-Владивосток' || m.awayTeam === 'Динамо-Владивосток'),
              recentMatches: [], // Removed
              nextMatch,
              dinamoStats: {
                rank: dinamoRow?.rank || 0,
                points: dinamoRow?.points || 0,
                lastResults: dinamoRow?.lastGames || []
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
        <DinamoSpecialCard 
          stats={data.dinamoStats} 
          players={data.dinamoPlayers} 
        />

        <NextMatchCard 
          match={data.nextMatch} 
          table={data.table}
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
