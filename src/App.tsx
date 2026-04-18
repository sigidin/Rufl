/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Calendar, 
  ChevronRight, 
  ChevronLeft,
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
  Users,
  Heart,
  Music
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import * as d3 from 'd3';
import confetti from 'canvas-confetti';
import { MOCK_DATA } from './mockData';
import { TournamentData, Match, TableRow, Player } from './types';

import AirHockeyGame from './components/AirHockeyGame';

const MATCHES_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7TDrZwYgX3nA_CTjCHnf7VbNv4T4kHRG1nSMJ-TSgEhxrPKduWOP9XRovOK2t44g0lD28uxspnxyY/pub?gid=80457916&single=true&output=csv';
const PLAYERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7TDrZwYgX3nA_CTjCHnf7VbNv4T4kHRG1nSMJ-TSgEhxrPKduWOP9XRovOK2t44g0lD28uxspnxyY/pub?gid=164242498&single=true&output=csv'; 
const LOGOS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR7TDrZwYgX3nA_CTjCHnf7VbNv4T4kHRG1nSMJ-TSgEhxrPKduWOP9XRovOK2t44g0lD28uxspnxyY/pub?gid=0&single=true&output=csv'; // Замените gid=0 на нужный ID листа с логотипами

// --- Components ---

import { db, startPresence, incrementMonthlyVisitors, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, onSnapshot, query, where, Timestamp } from 'firebase/firestore';

const isOurTeam = (name: string) => {
  const lower = name.toLowerCase();
  return lower.includes('динамо') && !lower.includes('академия');
};

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

const Header = () => {
  const [clicks, setClicks] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlHeader = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // scrolling down
          setIsVisible(false);
        } else {
          // scrolling up
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    window.addEventListener('scroll', controlHeader);
    return () => {
      window.removeEventListener('scroll', controlHeader);
    };
  }, [lastScrollY]);

  const handleEasterEgg = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    if (newClicks >= 10) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F0FF', '#FFFFFF', '#0072FF']
      });
      setClicks(0);
    }
  };

  return (
    <motion.header 
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : -150 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-bright-blue/30 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-bright-blue/5 via-transparent to-neon-pink/5 pointer-events-none" />
        <div className="flex flex-col items-center">
          <div className="text-[10px] text-strong text-bright-blue tracking-[0.4em] animate-pulse mb-1">неофициальное приложение</div>
          <h1 
            onClick={handleEasterEgg}
            className="text-2xl md:text-3xl text-strong gradient-text glitch-hover cursor-pointer leading-tight select-none"
          >
            ДИНАМО на РЮФЛ-26!
          </h1>
        </div>
        <p className="text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">
          Региональная юношеская футбольная лига | Дальний Восток
        </p>
      </div>
    </motion.header>
  );
};

const ResultCircle = ({ result }: { result: 'W' | 'D' | 'L', key?: React.Key }) => {
  const colors = {
    W: 'bg-green-500',
    D: 'bg-yellow-400',
    L: 'bg-red-500'
  };
  return (
    <div className={`w-2.5 h-2.5 rounded-full ${colors[result]}`} title={result === 'W' ? 'Победа' : result === 'D' ? 'Ничья' : 'Поражение'} />
  );
};

const NextMatchCard = ({ match, table, logos }: { match: Match | null, table: TableRow[], logos: Record<string, string> }) => {
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
        <SectionTitle title="Ближайший матч" imageSrc="https://i.ibb.co/rG2KtyCN/vs.png" />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ y: -5 }}
          className="glass-card rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden border-bright-blue/30 cyber-border"
        >
          {/* Background Pattern - Tiled */}
          <div 
            className="absolute inset-0 opacity-70 pointer-events-none"
            style={{ 
              backgroundImage: 'url(https://i.ibb.co/XxmbRT8g/BG-2-2.jpg)',
              backgroundRepeat: 'repeat',
              backgroundSize: '400px'
            }}
          >
            <div className="absolute inset-0 bg-navy/30" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col items-center mb-8">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-bright-blue">{formatDate(match.date)}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-xl font-black text-white">{match.time}</span>
                </div>
                {match.mapUrl ? (
                  <a 
                    href={match.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group relative"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-bright-blue group-hover:animate-pulse" />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {match.location}
                    </span>
                  </a>
                ) : (
                  <button 
                    onClick={copyAddress}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all group relative"
                  >
                    <Navigation className={`w-3.5 h-3.5 ${copied ? 'text-green-400' : 'text-bright-blue group-hover:animate-bounce'}`} />
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                      {copied ? 'Скопировано' : match.location}
                    </span>
                    {copied && <Check className="w-3 h-3 text-green-400" />}
                  </button>
                )}
              </div>
              {match.weather ? (
                <div className="flex items-center gap-2 text-[10px] font-bold text-neon-yellow uppercase tracking-[0.2em] mt-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow animate-pulse" />
                  Погода: {match.weather}
                </div>
              ) : (
                <WeatherWidget city={match.location.split(',')[0]} />
              )}
            </div>

            <div className="flex items-start justify-center gap-4 md:gap-12 mb-10">
              <div className="flex flex-col items-center flex-1">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-28 h-28 bg-navy/80 rounded-full flex items-center justify-center mb-4 shadow-xl border border-bright-blue/30 neon-glow p-2"
                >
                  <TeamLogo name={match.homeTeam} logos={logos} size="w-20 h-20" />
                </motion.div>
                <div className="text-strong text-sm text-center leading-tight mb-3 min-h-[40px] flex items-center justify-center">
                  {match.homeTeam}
                </div>
                <div className="flex gap-1.5 justify-center">
                  {homeForm.map((r, i) => <ResultCircle key={i} result={r} />)}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-28 relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.4, 0.7, 0.3]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    times: [0, 0.1, 0.2, 0.4, 1],
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-bright-blue/20 rounded-full blur-xl" 
                />
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all cursor-pointer select-none relative z-10"
                >
                  <img 
                    src="https://i.ibb.co/rG2KtyCN/vs.png" 
                    alt="VS" 
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,240,255,0.8)]"
                  />
                </motion.div>
              </div>

              <div className="flex flex-col items-center flex-1">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  className="w-28 h-28 bg-navy/80 rounded-full flex items-center justify-center mb-4 shadow-xl border border-bright-blue/30 neon-glow p-2"
                >
                  <TeamLogo name={match.awayTeam} logos={logos} size="w-20 h-20" />
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

const DinamoSpecialCard = ({ stats, players, logos, onTriggerHockey }: { stats: TournamentData['dinamoStats'], players: Player[], logos: Record<string, string>, onTriggerHockey: () => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'goals'>('goals');
  const [clicks, setClicks] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleHockeyActivation = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (!startTime || now - startTime > 10000) {
      setStartTime(now);
      setClicks(1);
    } else {
      const newClicks = clicks + 1;
      setClicks(newClicks);
      if (newClicks >= 15) {
        onTriggerHockey();
        setClicks(0);
        setStartTime(null);
      }
    }
  };

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
    <div className="px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          layout
          whileHover={{ y: -5 }}
          className="glass-card rounded-[40px] shadow-2xl border border-bright-blue/30 overflow-hidden cyber-border relative"
        >
          {/* Background Pattern - Tiled */}
          <div 
            className="absolute inset-0 opacity-70 pointer-events-none"
            style={{ 
              backgroundImage: 'url(https://i.ibb.co/XxmbRT8g/BG-2-2.jpg)',
              backgroundRepeat: 'repeat',
              backgroundSize: '400px'
            }}
          >
            <div className="absolute inset-0 bg-navy/30" />
          </div>

          <div 
            className="p-6 cursor-pointer relative z-10"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex flex-col items-center text-center relative z-10">
              <motion.div 
                layout
                className="w-40 h-40 flex items-center justify-center mb-4 relative cursor-pointer"
                onClick={handleHockeyActivation}
              >
                <motion.div 
                  animate={{ 
                    scale: [1, 1.15, 1, 1.3, 1],
                    opacity: [0.2, 0.5, 0.3, 0.6, 0.2]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    times: [0, 0.1, 0.2, 0.4, 1],
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-bright-blue/20 rounded-full blur-3xl" 
                />
                <img 
                  src="https://i.ibb.co/pvyHFwVY/dinamo.png" 
                  alt="Динамо" 
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(0,240,255,0.8)]"
                />
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
                    <div className="flex items-center gap-4">
                      <img src="https://i.ibb.co/pvyHFwVY/dinamo.png" alt="Состав" className="w-12 h-12 object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
                      <h3 className="text-xl text-strong text-white italic">Состав команды</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('name'); }}
                        className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border transition-all flex items-center gap-1.5 sm:gap-2 uppercase tracking-widest ${sortBy === 'name' ? 'bg-bright-blue text-navy border-bright-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        <SortAsc className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> А-Я
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSortBy('goals'); }}
                        className={`text-[8px] sm:text-[10px] font-black px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border transition-all flex items-center gap-1.5 sm:gap-2 uppercase tracking-widest ${sortBy === 'goals' ? 'bg-bright-blue text-navy border-bright-blue shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'}`}
                      >
                        <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Голы
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

const SectionTitle = ({ title, icon: Icon, imageSrc }: { title: string; icon?: any; imageSrc?: string }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="px-4 mb-8 flex justify-center"
  >
    <motion.div 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95, rotate: 5 }}
      className="bg-navy/60 backdrop-blur-xl rounded-2xl p-4 flex items-center gap-4 border border-bright-blue/30 shadow-[0_0_20px_rgba(0,240,255,0.15)] cyber-border"
    >
      <motion.div 
        whileHover={{ rotate: 360 }}
        whileTap={{ rotate: -360 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        className="flex items-center justify-center p-1"
      >
        {imageSrc ? (
          <img src={imageSrc} alt={title} className="w-12 h-12 md:w-14 md:h-14 object-contain drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]" />
        ) : (
          <div className="p-2.5 gradient-bg rounded-xl shadow-lg">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </motion.div>
      <h3 className="text-xl md:text-2xl text-strong text-white uppercase tracking-widest">{title}</h3>
    </motion.div>
  </motion.div>
);

const TournamentTable = ({ data, logos }: { data: TableRow[], logos: Record<string, string> }) => (
  <section className="px-4 py-12">
    <div className="max-w-4xl mx-auto">
      <SectionTitle title="Турнирная таблица" icon={Trophy} imageSrc="https://i.ibb.co/3555XG36/table.png" />
      <div className="px-1 md:px-2">
        <div className="glass-card rounded-2xl shadow-2xl border border-bright-blue/20 overflow-hidden cyber-border">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-left text-[10px] md:text-sm">
            <thead className="bg-navy/80 text-bright-blue uppercase text-[8px] font-black tracking-widest border-b border-bright-blue/20">
              <tr>
                <th className="px-1.5 py-4 text-center w-6 md:w-8">#</th>
                <th className="px-2 py-4">Команда</th>
                <th className="px-1.5 py-4 text-center">О</th>
                <th className="px-1.5 py-4 text-center">И</th>
                <th className="px-1.5 py-4 text-center hidden md:table-cell">В</th>
                <th className="px-1.5 py-4 text-center hidden md:table-cell">Н</th>
                <th className="px-1.5 py-4 text-center hidden md:table-cell">П</th>
                <th className="px-1.5 py-4 text-center hidden sm:table-cell">Мячи</th>
                <th className="px-1.5 py-4 text-center">+/-</th>
                <th className="px-2 py-4">Сыграны</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bright-blue/10">
              {data.map((row) => {
                const isDinamoRow = isOurTeam(row.teamName);
                const teamParts = row.teamName.split(/[\s-]/);
                return (
                  <motion.tr 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    key={row.teamName} 
                    className={`${isDinamoRow ? 'bg-bright-blue/10' : ''} transition-colors hover:bg-bright-blue/5`}
                  >
                    <td className="px-1.5 py-4 text-center">
                      <span className={`font-black ${isDinamoRow ? 'text-bright-blue text-sm' : row.rank <= 3 ? 'text-green-400 text-sm' : 'text-white/80'}`}>{row.rank}</span>
                    </td>
                    <td className="px-2 py-4 font-bold text-white">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <TeamLogo name={row.teamName} logos={logos} size="w-7 h-7" />
                        <div className="flex flex-col leading-tight">
                          <span className={`${isDinamoRow ? 'text-bright-blue' : ''} uppercase text-[10px] md:text-sm`}>{teamParts[0]}</span>
                          {teamParts.length > 1 && <span className="text-[9px] opacity-50 font-medium">{teamParts.slice(1).join(' ')}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-1.5 py-4 text-center font-black text-bright-blue text-sm md:text-lg">{row.points}</td>
                    <td className="px-1.5 py-4 text-center font-medium text-white/70">{row.played}</td>
                    <td className="px-1.5 py-4 text-center text-green-400 font-bold hidden md:table-cell">{row.won}</td>
                    <td className="px-1.5 py-4 text-center text-neon-yellow font-bold hidden md:table-cell">{row.drawn}</td>
                    <td className="px-1.5 py-4 text-center text-red-400 font-bold hidden md:table-cell">{row.lost}</td>
                    <td className="px-1.5 py-4 text-center text-white/50 hidden sm:table-cell">{row.goalsFor}-{row.goalsAgainst}</td>
                    <td className="px-1.5 py-4 text-center font-medium text-white/70">{row.goalsFor - row.goalsAgainst}</td>
                    <td className="px-2 py-4">
                      <div className="flex gap-0.5 md:gap-1">
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

const TeamLogo = ({ name, logos, size = "w-6 h-6", scale = "w-[110%] h-[110%]" }: { name: string, logos: Record<string, string>, size?: string, scale?: string }) => {
  const logoUrl = logos ? logos[name] : undefined;

  // Local icons mapping
  const localLogos: Record<string, string> = {
    'академия': 'https://i.ibb.co/wNNvSf3f/academy.png',
    'динамо': 'https://i.ibb.co/pvyHFwVY/dinamo.png',
    'искра': 'https://i.ibb.co/xt8CK8Zk/iskra.png',
    'сшор': 'https://i.ibb.co/zTBmwf60/sshor1.png',
    'рекорд': 'https://i.ibb.co/0yf27V5r/rekord.png',
    'благовещенск': 'https://i.ibb.co/fYzrJgBq/blagoveshchensk.png',
    'ска': 'https://i.ibb.co/WWdR0gQX/ska.png',
    'сахалин': 'https://i.ibb.co/4wY4SP2z/sakhalin.png'
  };

  const getLocalLogo = () => {
    const lowerName = name.toLowerCase();
    for (const [key, path] of Object.entries(localLogos)) {
      if (lowerName.includes(key)) return path;
    }
    return null;
  };

  const finalLogoUrl = logoUrl || getLocalLogo();

  if (finalLogoUrl) {
    return (
      <div className={`${size} flex items-center justify-center overflow-hidden rounded-full`}>
        <img 
          src={finalLogoUrl} 
          alt={name} 
          className={`${scale} object-contain max-w-none`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Placeholder logic for icons based on team name
  const getIcon = () => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('динамо')) return <Shield className="text-bright-blue" />;
    if (lowerName.includes('ска')) return <Trophy className="text-red-500" />;
    if (lowerName.includes('сахалин')) return <Navigation className="text-emerald-500" />;
    if (lowerName.includes('благовещенск')) return <MapPin className="text-orange-500" />;
    if (lowerName.includes('искра')) return <ArrowUpRight className="text-yellow-500" />;
    if (lowerName.includes('сшор')) return <Info className="text-slate-500" />;
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
  const [monthlyVisitors, setMonthlyVisitors] = useState<number>(1248);
  const [onlineNow, setOnlineNow] = useState<number>(42);
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Increment monthly visitors
    incrementMonthlyVisitors();

    // Start presence heartbeat
    const stopPresence = startPresence();

    // Listen for monthly visitors
    const unsubVisitors = onSnapshot(doc(db, 'stats', 'visitors'), (doc) => {
      if (doc.exists()) {
        setMonthlyVisitors(doc.data().monthlyCount);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'stats/visitors');
    });

    // Listen for online users (active in last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const q = query(collection(db, 'presence'), where('lastSeen', '>=', Timestamp.fromDate(fiveMinutesAgo)));
    
    const unsubOnline = onSnapshot(q, (snapshot) => {
      setOnlineNow(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'presence');
    });

    return () => {
      stopPresence();
      unsubVisitors();
      unsubOnline();
    };
  }, []);

  const handleDoubleTap = () => {
    setIsZoomed(!isZoomed);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="px-4 py-12 max-w-4xl mx-auto relative">
      <div 
        className="w-full overflow-hidden relative rounded-3xl shadow-2xl border border-white/10 cursor-zoom-in"
        onDoubleClick={handleDoubleTap}
      >
        <motion.div
          drag={isZoomed}
          dragConstraints={{ left: -600, right: 600, top: -1000, bottom: 0 }}
          dragElastic={0.1}
          animate={{ 
            scale: isZoomed ? 2.5 : 1,
            x: isZoomed ? undefined : 0,
            y: isZoomed ? undefined : 0
          }}
          style={{ originY: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="w-full h-full"
        >
          <img 
            src="https://i.ibb.co/7xJcHVQP/map.png" 
            alt="География турнира" 
            className="w-full h-auto object-cover select-none pointer-events-none"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        </motion.div>
        
        {/* Zoom Hint */}
        {!isZoomed && (
          <div className="absolute top-4 right-4 bg-navy/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[8px] font-black text-white/60 uppercase tracking-widest pointer-events-none">
            Двойной тап для зума
          </div>
        )}
        
        {/* Visitor Stats Overlay - Reverted to original inside position */}
        <div className="absolute bottom-4 left-4 right-4 glass-card border border-white/20 backdrop-blur-xl rounded-2xl p-4 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-bright-blue/5 via-transparent to-neon-pink/5 pointer-events-none" />
          <div className="flex justify-center gap-8 relative z-10">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Посетителей за месяц</span>
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-bright-blue" />
                <span className="text-xs font-black text-white tracking-wider">{monthlyVisitors.toLocaleString()}</span>
              </div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Сейчас онлайн</span>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <span className="text-xs font-black text-white tracking-wider">{onlineNow}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchRow: React.FC<{ match: Match, logos: Record<string, string> }> = ({ match, logos }) => {
  const isFinished = !!(match.homeScore !== undefined && match.awayScore !== undefined);
  const dayOfWeek = getDayOfWeek(match.date);

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="p-5 transition-colors hover:bg-white/5">
        <div className="mb-4">
          {/* Header Line: Date, Media, Location */}
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <span className="bg-bright-blue/10 text-bright-blue text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">{dayOfWeek}</span>
              <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">{formatDate(match.date)}</span>
            </div>

            {/* Media Icons in the middle */}
            <div className="flex items-center gap-4">
              {match.broadcastUrl ? (
                <a 
                  href={match.broadcastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bright-blue hover:scale-125 transition-transform neon-glow p-1 rounded-md"
                  title="Трансляция"
                >
                  <Video className="w-4 h-4" />
                </a>
              ) : (
                <Video className="w-4 h-4 text-white/10" />
              )}

              {match.photoUrl ? (
                <a 
                  href={match.photoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-bright-blue hover:scale-125 transition-transform neon-glow p-1 rounded-md"
                  title="Фото"
                >
                  <ImageIcon className="w-4 h-4" />
                </a>
              ) : (
                <ImageIcon className="w-4 h-4 text-white/10" />
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-black text-bright-blue/60 uppercase tracking-widest italic">
              <MapPin className="w-3 h-3" />
              {match.location.split(',')[0]}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo name={match.homeTeam} logos={logos} size="w-7 h-7" />
              <span className={`text-base ${isOurTeam(match.homeTeam) ? 'font-black text-bright-blue italic' : 'font-bold text-white/80'}`}>
                {match.homeTeam}
              </span>
            </div>
            {isFinished && <span className="text-xl font-black text-white italic">{match.homeScore}</span>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TeamLogo name={match.awayTeam} logos={logos} size="w-7 h-7" />
              <span className={`text-base ${isOurTeam(match.awayTeam) ? 'font-black text-bright-blue italic' : 'font-bold text-white/80'}`}>
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

const UpcomingMatchCard: React.FC<{ match: Match, logos: Record<string, string> }> = ({ match, logos }) => {
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
          <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center shadow-lg mb-2 border border-white/5 neon-glow p-1">
            <TeamLogo name={match.homeTeam} logos={logos} size="w-12 h-12" />
          </div>
          <div className="text-strong text-white w-full text-center leading-tight">
            {formatTeamName(match.homeTeam)}
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-16">
          <span className="text-[10px] font-black text-white/10">VS</span>
        </div>
 
        <div className="flex flex-col items-center flex-1 overflow-hidden">
          <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center shadow-lg mb-2 border border-white/5 neon-glow p-1">
            <TeamLogo name={match.awayTeam} logos={logos} size="w-12 h-12" />
          </div>
          <div className="text-strong text-white w-full text-center leading-tight">
            {formatTeamName(match.awayTeam)}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-lg font-black text-bright-blue italic">{match.time}</span>
        <div className="flex flex-col items-center gap-1">
          {match.mapUrl ? (
            <a 
              href={match.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[8px] font-bold text-bright-blue/60 uppercase tracking-widest hover:text-white transition-colors group"
            >
              <ExternalLink className="w-2.5 h-2.5 text-bright-blue group-hover:animate-pulse" />
              <span className="truncate max-w-[120px]">{match.location}</span>
            </a>
          ) : (
            <button 
              onClick={copyAddress}
              className="flex items-center gap-1.5 text-[8px] font-bold text-bright-blue/60 uppercase tracking-widest hover:text-white transition-colors group"
            >
              <Navigation className={`w-2.5 h-2.5 ${copied ? 'text-green-400' : 'group-hover:animate-pulse'}`} />
              <span className={`truncate max-w-[120px] ${copied ? 'text-green-400' : ''}`}>{copied ? 'Скопировано' : match.location}</span>
            </button>
          )}
        </div>
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

const MatchList = ({ matches, title, icon, logos }: { matches: Match[], title: string, icon: any, logos: Record<string, string> }) => {
  const isUpcoming = title === "Предстоящие матчи";
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const progress = target.scrollLeft / (target.scrollWidth - target.clientWidth);
    setScrollProgress(isNaN(progress) ? 0 : progress);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && scrollContainerRef.current && scrollRef.current) {
        const rect = scrollContainerRef.current.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        const boundedPos = Math.max(0, Math.min(1, pos));
        const scrollTarget = boundedPos * (scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
        scrollRef.current.scrollLeft = scrollTarget;
      }
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  const isOurTeamLocal = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes('динамо') && !lower.includes('академия');
  };

  // Filter matches for Dinamo Vladivostok if it's the upcoming section
  const filteredMatches = isUpcoming 
    ? matches.filter(m => (isOurTeamLocal(m.homeTeam) || isOurTeamLocal(m.awayTeam)) && m.status === 'Ожидается')
    : matches;

  // Sort upcoming matches by date
  const displayMatches = isUpcoming
    ? [...filteredMatches].sort((a, b) => {
        const dateA = new Date(a.date.split('.').reverse().join('-')).getTime();
        const dateB = new Date(b.date.split('.').reverse().join('-')).getTime();
        return dateA - dateB;
      })
    : filteredMatches;

  // Map section titles to local icons
  const sectionIcons: Record<string, string> = {
    "Предстоящие матчи": "https://i.ibb.co/CsBkhQX9/calendar.png",
    "Турнирная таблица": "https://i.ibb.co/3555XG36/table.png",
    "Состав команды": "https://i.ibb.co/23dNhY8B/dinamo.png",
    "География турнира": "https://i.ibb.co/bMYHDSBf/stats.png"
  };

  return (
    <div className="px-4 py-12">
      <SectionTitle title={title} icon={icon} imageSrc={sectionIcons[title]} />
      {isUpcoming ? (
        <div className="relative group/scroll px-4">
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide"
          >
            {displayMatches.length > 0 ? (
              displayMatches.slice(0, 5).map(match => <UpcomingMatchCard key={match.id} match={match} logos={logos} />)
            ) : (
              <div className="w-full p-12 text-center text-white/40 text-sm italic glass-card rounded-[32px] border border-white/20">Матчей не найдено</div>
            )}
          </div>
          
          {displayMatches.length > 1 && (
            <div className="flex items-center gap-4 max-w-xl mx-auto mt-2">
              <button 
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-bright-blue hover:border-bright-blue/50 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div 
                ref={scrollContainerRef}
                className="flex-1 h-1.5 bg-white/5 rounded-full relative overflow-hidden cursor-pointer group/bar"
                onClick={(e) => {
                  if (scrollContainerRef.current && scrollRef.current) {
                    const rect = scrollContainerRef.current.getBoundingClientRect();
                    const pos = (e.clientX - rect.left) / rect.width;
                    scrollRef.current.scrollLeft = pos * (scrollRef.current.scrollWidth - scrollRef.current.clientWidth);
                  }
                }}
              >
                {/* Progress track */}
                <motion.div 
                  initial={false}
                  animate={{ left: `${scrollProgress * (100 - 15)}%` }}
                  onMouseDown={handleThumbMouseDown}
                  className="absolute top-0 w-[15%] h-full bg-bright-blue shadow-[0_0_15px_rgba(0,240,255,0.6)] cursor-grab active:cursor-grabbing z-10 rounded-full"
                />
                <div className="absolute inset-0 bg-bright-blue/10 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
              </div>

              <button 
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-bright-blue hover:border-bright-blue/50 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
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

const PastMatchesList = ({ matches, logos }: { matches: Match[], logos: Record<string, string> }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pastMatches = matches
    .filter(m => m.status === 'Завершен' && (isOurTeam(m.homeTeam) || isOurTeam(m.awayTeam)))
    .sort((a, b) => {
      const dateA = new Date(a.date.split('.').reverse().join('-')).getTime();
      const dateB = new Date(b.date.split('.').reverse().join('-')).getTime();
      return dateB - dateA;
    });

  if (pastMatches.length === 0) return null;

  return (
    <section className="py-12">
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
              <h3 className="text-xl md:text-2xl text-strong text-white uppercase tracking-widest">История матчей</h3>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative pl-8 md:pl-12 space-y-8"
            >
              {/* Timeline Line */}
              <div className="absolute left-[15px] md:left-[23px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-bright-blue via-bright-blue/20 to-transparent" />
              
              {pastMatches.map((match, idx) => {
                const isHome = isOurTeam(match.homeTeam);
                const ourScore = isHome ? match.homeScore! : match.awayScore!;
                const oppScore = isHome ? match.awayScore! : match.homeScore!;
                const result = ourScore > oppScore ? 'W' : ourScore === oppScore ? 'D' : 'L';
                const dotColors = {
                  W: 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]',
                  D: 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]',
                  L: 'border-red-400 shadow-[0_0_10px_rgba(248,113,113,0.5)]'
                };

                return (
                  <motion.div 
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative"
                  >
                    {/* Timeline Dot */}
                    <div className={`absolute -left-[25px] md:-left-[33px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-navy border-2 z-10 ${dotColors[result]}`} />
                    
                    <div className="glass-card rounded-3xl border border-white/10 overflow-hidden hover:border-bright-blue/30 transition-all">
                      <MatchRow match={match} logos={logos} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

const WeatherWidget = ({ city }: { city: string }) => {
  const [weather, setWeather] = useState<{ temp: string, icon: string } | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Using wttr.in for simple weather data
        const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=%t+%c`);
        if (response.ok) {
          const text = await response.text();
          const [temp, icon] = text.trim().split(' ');
          setWeather({ temp, icon });
        }
      } catch (e) {
        console.warn('Weather fetch failed', e);
      }
    };
    fetchWeather();
  }, [city]);

  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 text-[10px] font-bold text-neon-yellow uppercase tracking-[0.2em] mt-3">
      <span className="w-1.5 h-1.5 rounded-full bg-neon-yellow animate-pulse" />
      {city}: {weather.temp} {weather.icon}
    </div>
  );
};

const DownloadsSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'pc' | 'mobile' | 'other'>('pc');

  const pcWallpapers = [
    { title: 'Карта турнира', url: 'https://i.ibb.co/7xJcHVQP/map.png', size: '2.4 MB' },
    { title: 'Динамо Стиль', url: 'https://i.ibb.co/FbzrPGdt/1.jpg', size: '1.8 MB' }
  ];

  const mobileWallpapers = [
    { title: 'Киберпанк', url: 'https://i.ibb.co/fzht8FVN/Create-a-highly-202604140109.jpg', size: '1.2 MB' },
    { title: 'Фон Динамо #1', url: 'https://i.ibb.co/Mx5JM34y/background.png', size: '0.8 MB' },
    { title: 'Фон Динамо #2', url: 'https://i.ibb.co/Q3n5hP0r/background-2.png', size: '0.9 MB' },
    { title: 'Фон Динамо #3', url: 'https://i.ibb.co/3m93Ynz5/background-3.png', size: '1.1 MB' },
    { title: 'Фон Динамо #4', url: 'https://i.ibb.co/N6PCSqG0/background-4.png', size: '1.0 MB' }
  ];

  const otherMedia = [
    { title: 'Гимн Динамо', type: 'Audio', url: 'https://r2.syntx.ai/user_328007139/generated/f5317ab14bdd51691d87bf1c3a329733_06ecb7a5-353a-4699-9e8d-263669c0bd72.mp3', size: '5.1 MB', icon: <Music className="w-5 h-5" /> },
    { title: 'Стикерпак Telegram (2012)', type: 'Stickers', url: 'https://t.me/addstickers/DINAMO_2012', size: 'Link', icon: <Download className="w-5 h-5" /> }
  ];

  return (
    <section className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div 
          className="cursor-pointer group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SectionTitle title="Медиа и загрузки" icon={Download} imageSrc="https://i.ibb.co/bMYHDSBf/stats.png" />
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass-card rounded-[32px] border border-white/10 p-6 md:p-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-8 p-1 bg-navy/40 rounded-2xl border border-white/5 w-fit mx-auto">
                  {(['pc', 'mobile', 'other'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab 
                          ? 'bg-bright-blue text-navy shadow-[0_0_15px_rgba(0,240,255,0.4)]' 
                          : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {tab === 'pc' ? 'ПК' : tab === 'mobile' ? 'Телефон' : 'Разное'}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeTab === 'pc' && pcWallpapers.map((wp, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-video rounded-2xl overflow-hidden border border-white/10"
                    >
                      <img src={wp.url} alt={wp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">{wp.title}</p>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{wp.size}</p>
                        </div>
                        <a 
                          href={wp.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-bright-blue text-navy flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}

                  {activeTab === 'mobile' && mobileWallpapers.map((wp, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10"
                    >
                      <img src={wp.url} alt={wp.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-60" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">{wp.title}</p>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{wp.size}</p>
                        </div>
                        <a 
                          href={wp.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-bright-blue text-navy flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  ))}

                  {activeTab === 'other' && otherMedia.map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-6 rounded-2xl border border-white/10 flex items-center justify-between group h-full"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-bright-blue/10 flex items-center justify-center text-bright-blue group-hover:bg-bright-blue group-hover:text-navy transition-all">
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-white uppercase tracking-wider">{item.title}</h4>
                          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">{item.size}</p>
                        </div>
                      </div>
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-bright-blue hover:bg-bright-blue/10 transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </motion.div>
                  ))}
                </div>
              </div>
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
  const [hearts, setHearts] = useState<{ id: number; x: number }[]>([]);

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
      
      // Create hearts
      const newHearts = Array.from({ length: 6 }).map((_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100 - 50 // random horizontal spread
      }));
      setHearts(prev => [...prev, ...newHearts]);
      
      setTimeout(() => setCopied(null), 2000);
      setTimeout(() => {
        setHearts(prev => prev.filter(h => !newHearts.find(nh => nh.id === h.id)));
      }, 1500);
    });
  };

  return (
    <footer className="mt-12 pb-12 px-4 relative z-10 overflow-hidden">
      {/* Flying Hearts */}
      <AnimatePresence>
        {hearts.map(heart => (
          <motion.div
            key={heart.id}
            initial={{ opacity: 0, y: 0, x: heart.x, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -150, x: heart.x + (Math.random() * 40 - 20), scale: [0.5, 1.2, 1, 0.8] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute bottom-20 left-1/2 pointer-events-none z-50"
          >
            <Heart className="w-6 h-6 text-neon-pink fill-neon-pink" />
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* PWA & Support Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Install Card */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="glass-card rounded-[32px] p-6 border border-white/40 flex flex-col items-center text-center"
          >
            <img src="https://i.ibb.co/Cy41rJD/app.png" alt="App" className="w-16 h-16 object-contain mb-4 drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
            <div className="flex flex-col items-center">
              <h3 className="text-sm text-strong text-white mb-1">Приложение на главном экране</h3>
              <p className="text-[10px] font-medium text-white/60 mb-4 leading-relaxed">
                Установите ДИНАМО-12 как приложение для быстрого доступа к статистике и результатам
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
            <img src="https://i.ibb.co/NkHkTxr/support.png" alt="Support" className="w-16 h-16 object-contain mb-4 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
            <h3 className="text-sm text-strong text-white mb-1">Поддержать проект</h3>
            <p className="text-[10px] font-medium text-white/60 mb-4 leading-relaxed">
              Ваша благодарность и поддержка помогают развивать приложение и обновлять статистические данные
            </p>
            <div className="flex items-center gap-4 w-full">
              <motion.button 
                onClick={() => copyToClipboard('4276500050261351', 'sber')}
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: copied === 'sber' ? "0 0 20px rgba(74, 222, 128, 0.4)" : "0 0 20px rgba(0, 240, 255, 0.4)" 
                }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 h-12 rounded-2xl border flex items-center justify-center relative group overflow-hidden transition-all ${
                  copied === 'sber' ? 'bg-green-500/10 border-green-500/50' : 'bg-bright-blue/10 border-bright-blue/30'
                }`}
                title="Скопировать номер карты Сбер"
              >
                {copied === 'sber' ? (
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter animate-in zoom-in">Номер скопирован</span>
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
                whileHover={{ 
                  scale: 1.02, 
                  boxShadow: copied === 'tbank' ? "0 0 20px rgba(74, 222, 128, 0.4)" : "0 0 20px rgba(0, 240, 255, 0.4)" 
                }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 h-12 rounded-2xl border flex items-center justify-center relative group overflow-hidden transition-all ${
                  copied === 'tbank' ? 'bg-green-500/10 border-green-500/50' : 'bg-bright-blue/10 border-bright-blue/30'
                }`}
                title="Скопировать номер карты Т-Банк"
              >
                {copied === 'tbank' ? (
                  <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter animate-in zoom-in">Номер скопирован</span>
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
  const [showHockeyMode, setShowHockeyMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Matches
        Papa.parse(MATCHES_SHEET_URL, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
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
                weather: row['Погода'],
                mapUrl: row['Карта_2ГИС']
              };
            });

            // Fetch Players (if URL exists)
            let playersData: Player[] = [];
            if (PLAYERS_SHEET_URL) {
              try {
                await new Promise<void>((resolve) => {
                  Papa.parse(PLAYERS_SHEET_URL, {
                    download: true,
                    header: true,
                    skipEmptyLines: true,
                    complete: (playerResults) => {
                      playersData = (playerResults.data as any[]).map((row, idx) => ({
                        id: idx,
                        number: row['номер'] || '',
                        name: row['имя'] || 'Без имени',
                        position: row['позиция'] || 'защ',
                        goals: parseInt(row['голы']) || 0,
                        photoUrl: row['фото'] || `https://picsum.photos/seed/${row['имя'] || idx}/200`
                      }));
                      resolve();
                    },
                    error: (err) => {
                      console.error('PapaParse error fetching players:', err);
                      resolve();
                    }
                  });
                });
              } catch (e) {
                console.error('Error fetching players:', e);
              }
            }
            
            if (playersData.length === 0) {
              playersData = [
                { id: 1, number: '1', name: 'Иванов Иван', position: 'Вратарь', goals: 5, photoUrl: 'https://picsum.photos/seed/ivan/200' },
                { id: 2, number: '2', name: 'Петров Петр', position: 'Защитник', goals: 2, photoUrl: 'https://picsum.photos/seed/petr/200' },
                { id: 3, number: '3', name: 'Сидоров Сидор', position: 'Полузащитник', goals: 4, photoUrl: 'https://picsum.photos/seed/sidor/200' },
                { id: 4, number: '4', name: 'Алексеев Алексей', position: 'Нападающий', goals: 12, photoUrl: 'https://picsum.photos/seed/alex/200' }
              ];
            }

            // Fetch Logos
            let logos: Record<string, string> = {};
            if (LOGOS_SHEET_URL && LOGOS_SHEET_URL.includes('pub?')) {
              try {
                await new Promise<void>((resolve) => {
                  Papa.parse(LOGOS_SHEET_URL, {
                    download: true,
                    header: true,
                    skipEmptyLines: true,
                    complete: (logoResults) => {
                      (logoResults.data as any[]).forEach(row => {
                        if (row['Команда'] && row['Логотип']) {
                          logos[row['Команда']] = row['Логотип'];
                        }
                      });
                      resolve();
                    },
                    error: (err) => {
                      resolve();
                    }
                  });
                });
              } catch (e) {
                console.error('Error in logos fetch promise:', e);
              }
            }

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
            const isOurTeam = (name: string) => {
              const lower = name.toLowerCase();
              return lower.includes('динамо') && !lower.includes('академия');
            };

            const dinamoRow = table.find(t => isOurTeam(t.teamName));
            const nextMatch = matches.find(m => m.status === 'Ожидается' && (isOurTeam(m.homeTeam) || isOurTeam(m.awayTeam))) || null;
            
            setData({
              table,
              allMatches: matches,
              dinamoMatches: matches.filter(m => isOurTeam(m.homeTeam) || isOurTeam(m.awayTeam)),
              recentMatches: [],
              nextMatch,
              dinamoStats: {
                rank: dinamoRow?.rank || 0,
                points: dinamoRow?.points || 0,
                lastResults: dinamoRow?.lastGames || []
              },
              dinamoPlayers: playersData,
              logos
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
      
      <AnimatePresence>
        {showHockeyMode && data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100]"
          >
            <AirHockeyGame 
              onClose={() => setShowHockeyMode(false)}
              homeTeamName="ДИНАМО"
              awayTeamName="СОПЕРНИК"
              playerLogo="https://i.ibb.co/pvyHFwVY/dinamo.png"
              opponents={data.table
                .filter(team => team.teamName && !team.teamName.toLowerCase().includes('динамо'))
                .map(team => {
                  const name = team.teamName;
                  const logoUrl = data.logos[name];
                  
                  // Replicate robust logo mapping from TeamLogo
                  const localLogos: Record<string, string> = {
                    'академия': 'https://i.ibb.co/wNNvSf3f/academy.png',
                    'динамо': 'https://i.ibb.co/pvyHFwVY/dinamo.png',
                    'искра': 'https://i.ibb.co/xt8CK8Zk/iskra.png',
                    'сшор': 'https://i.ibb.co/zTBmwf60/sshor1.png',
                    'рекорд': 'https://i.ibb.co/0yf27V5r/rekord.png',
                    'благовещенск': 'https://i.ibb.co/fYzrJgBq/blagoveshchensk.png',
                    'ска': 'https://i.ibb.co/WWdR0gQX/ska.png',
                    'сахалин': 'https://i.ibb.co/4wY4SP2z/sakhalin.png'
                  };

                  const getLocalLogo = () => {
                    const lowerName = name.toLowerCase();
                    for (const [key, path] of Object.entries(localLogos)) {
                      if (lowerName.includes(key)) return path;
                    }
                    return null;
                  };

                  return { 
                    name, 
                    logo: logoUrl || getLocalLogo() || 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' 
                  };
                })
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 space-y-0">
        <DinamoSpecialCard 
          stats={data.dinamoStats} 
          players={data.dinamoPlayers} 
          logos={data.logos}
          onTriggerHockey={() => setShowHockeyMode(true)}
        />

        <NextMatchCard 
          match={data.nextMatch} 
          table={data.table}
          logos={data.logos}
        />
        
        <main className="flex-1 max-w-7xl mx-auto w-full space-y-0">
          <TournamentTable data={data.table} logos={data.logos} />
          
          <MatchList 
            title="Предстоящие матчи" 
            icon={Calendar} 
            matches={data.allMatches} 
            logos={data.logos}
          />

          <PastMatchesList matches={data.allMatches} logos={data.logos} />

          <DownloadsSection />

          <FarEastMap />
        </main>

        <AppFooter />
      </div>
    </div>
  );
}
