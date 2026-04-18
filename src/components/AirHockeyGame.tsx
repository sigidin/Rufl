import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PlayCircle, RotateCcw, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Opponent {
  name: string;
  logo: string;
}

interface Props {
  onClose: () => void;
  homeTeamName?: string;
  playerLogo: string;
  opponents: Opponent[];
}

const AirHockeyGame: React.FC<Props> = ({ onClose, homeTeamName = "ДИНАМО", playerLogo, opponents }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GOAL' | 'OVER'>('IDLE');
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [timeLeft, setTimeLeft] = useState(180);
  const [isPortrait, setIsPortrait] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [opponent, setOpponent] = useState<Opponent>(opponents[0] || { name: 'СОПЕРНИК', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' });

  // Assets
  const playerImgRef = useRef<HTMLImageElement | null>(null);
  const opponentImgRef = useRef<HTMLImageElement | null>(null);

  // Constants
  const PADDLE_RADIUS = typeof window !== 'undefined' && window.innerWidth < 768 ? 20 : 35;
  const PUCK_RADIUS = typeof window !== 'undefined' && window.innerWidth < 768 ? 12 : 18;
  const GOAL_SIZE_PCT = 0.35;
  const FRICTION = 0.985;
  const MAX_SPEED = 18;
  const AI_SPEED = 7;

  const stateRef = useRef({
    puck: { x: 0, y: 0, vx: 0, vy: 0 },
    player: { x: 0, y: 0 },
    ai: { x: 0, y: 0 },
    target: { x: 0, y: 0 },
    canvasSize: { width: 0, height: 0 },
    isTouching: false,
    timerInterval: null as any,
    isHorizontal: false,
  });

  useEffect(() => {
    const pImg = new Image();
    pImg.src = playerLogo;
    pImg.referrerPolicy = "no-referrer";
    pImg.onload = () => { playerImgRef.current = pImg; };

    // Fallback list of 8 teams if opponents data is empty
    const fallbackOpponents: Opponent[] = [
      { name: 'СШОР №2', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'КСШОР-ЧИТА', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'СКА-ХАБАРОВСК', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'БЛАГОВЕЩЕНСК', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'ВУЛКАН', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'ОКЕАН', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'ЛОКОМОТИВ', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' },
      { name: 'САХАЛИН', logo: 'https://i.ibb.co/vz6mD7y0/logo-placeholder.png' }
    ];

    const sourceList = opponents.length > 0 ? opponents : fallbackOpponents;
    const opp = sourceList[Math.floor(Math.random() * sourceList.length)];
    
    if (opp) {
      setOpponent(opp);
      const oImg = new Image();
      oImg.src = opp.logo;
      oImg.referrerPolicy = "no-referrer";
      oImg.onload = () => { opponentImgRef.current = oImg; };
    }
  }, [playerLogo, opponents]);

  useEffect(() => {
    const handleResize = () => {
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
      setIsPortrait(portrait);

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (rect) {
          canvas.width = rect.width;
          canvas.height = rect.height;
          stateRef.current.canvasSize = { width: canvas.width, height: canvas.height };
          stateRef.current.isHorizontal = canvas.width > canvas.height;
          resetPositions();
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetPositions = () => {
    const { width, height } = stateRef.current.canvasSize;
    const isH = stateRef.current.isHorizontal;

    if (isH) {
      // Horizontal side-to-side
      stateRef.current.player = { x: 100, y: height / 2 };
      stateRef.current.ai = { x: width - 100, y: height / 2 };
    } else {
      // Vertical top-to-bottom
      stateRef.current.player = { x: width / 2, y: height - 100 };
      stateRef.current.ai = { x: width / 2, y: 100 };
    }
    stateRef.current.puck = { x: width / 2, y: height / 2, vx: 0, vy: 0 };
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScores({ player: 0, ai: 0 });
    setTimeLeft(180);
    resetPositions();
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#FFFFFF', '#0072FF']
    });

    if (stateRef.current.timerInterval) clearInterval(stateRef.current.timerInterval);
    stateRef.current.timerInterval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const endGame = () => {
    setGameState('OVER');
    clearInterval(stateRef.current.timerInterval);
    
    const isPlayerWeb = scores.player > scores.ai;
    if (isPlayerWeb) {
      setWinner(homeTeamName);
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#00F0FF', '#FFD700', '#FFFFFF']
      });
    } else if (scores.ai > scores.player) {
      setWinner(opponent.name);
    } else {
      setWinner('Ничья');
    }

    setTimeout(() => {
      onClose();
    }, 5000);
  };

  const handleGoal = (isPlayer: boolean) => {
    setGameState('GOAL');
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: isPlayer ? { x: 0.2, y: 0.5 } : { x: 0.8, y: 0.5 },
      colors: isPlayer ? ['#00F0FF', '#FFFFFF'] : ['#FF4D4D', '#FFFFFF']
    });

    setScores(prev => {
      const next = { ...prev };
      if (isPlayer) next.player += 1;
      else next.ai += 1;

      if (next.player >= 5 || next.ai >= 5) {
        setTimeout(endGame, 1000);
      } else {
        setTimeout(() => {
          setGameState('PLAYING');
          resetPositions();
        }, 1500);
      }
      return next;
    });
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    let animationFrame: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = () => {
      update();
      draw();
      animationFrame = requestAnimationFrame(loop);
    };

    const update = () => {
      const { puck, player, ai, target, canvasSize, isTouching, isHorizontal } = stateRef.current;
      const { width, height } = canvasSize;

      // 1. Move Player
      if (isTouching) {
        player.x += (target.x - player.x) * 0.4;
        player.y += (target.y - player.y) * 0.4;
      }
      if (isHorizontal) {
        player.x = Math.max(PADDLE_RADIUS, Math.min(width / 2 - PADDLE_RADIUS, player.x));
        player.y = Math.max(PADDLE_RADIUS, Math.min(height - PADDLE_RADIUS, player.y));
      } else {
        player.x = Math.max(PADDLE_RADIUS, Math.min(width - PADDLE_RADIUS, player.x));
        player.y = Math.max(height / 2 + PADDLE_RADIUS, Math.min(height - PADDLE_RADIUS, player.y));
      }

      // 2. Move AI
      const aiTargetX = isHorizontal ? (puck.x > width / 2 ? puck.x : width - 100) : puck.x;
      const aiTargetY = isHorizontal ? puck.y : (puck.y < height / 2 ? puck.y : 100);
      
      const dx = aiTargetX - ai.x;
      const dy = aiTargetY - ai.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 1) {
        ai.x += (dx / dist) * Math.min(dist, AI_SPEED);
        ai.y += (dy / dist) * Math.min(dist, AI_SPEED);
      }
      if (isHorizontal) {
        ai.x = Math.max(width / 2 + PADDLE_RADIUS, Math.min(width - PADDLE_RADIUS, ai.x));
        ai.y = Math.max(PADDLE_RADIUS, Math.min(height - PADDLE_RADIUS, ai.y));
      } else {
        ai.x = Math.max(PADDLE_RADIUS, Math.min(width - PADDLE_RADIUS, ai.x));
        ai.y = Math.max(PADDLE_RADIUS, Math.min(height / 2 - PADDLE_RADIUS, ai.y));
      }

      // 3. Puck Physics
      puck.x += puck.vx;
      puck.y += puck.vy;
      puck.vx *= FRICTION;
      puck.vy *= FRICTION;

      // 4. Wall Collisions & Goals
      const goalSize = (isHorizontal ? height : width) * GOAL_SIZE_PCT;
      
      if (isHorizontal) {
        // Horizontal Mode: Goals on Left and Right
        const inGoalY = puck.y > height / 2 - goalSize / 2 && puck.y < height / 2 + goalSize / 2;
        
        // Left goal
        if (puck.x < PUCK_RADIUS) {
          if (inGoalY) handleGoal(false);
          else {
            puck.vx *= -1;
            puck.x = PUCK_RADIUS;
          }
        }
        // Right goal
        if (puck.x > width - PUCK_RADIUS) {
          if (inGoalY) handleGoal(true);
          else {
            puck.vx *= -1;
            puck.x = width - PUCK_RADIUS;
          }
        }
        // Top/Bottom walls
        if (puck.y < PUCK_RADIUS || puck.y > height - PUCK_RADIUS) {
          puck.vy *= -1;
          puck.y = puck.y < PUCK_RADIUS ? PUCK_RADIUS : height - PUCK_RADIUS;
        }
      } else {
        // Vertical Mode: Goals on Top and Bottom
        const inGoalX = puck.x > width / 2 - goalSize / 2 && puck.x < width / 2 + goalSize / 2;
        
        // Top goal
        if (puck.y < PUCK_RADIUS) {
          if (inGoalX) handleGoal(true);
          else {
            puck.vy *= -1;
            puck.y = PUCK_RADIUS;
          }
        }
        // Bottom goal
        if (puck.y > height - PUCK_RADIUS) {
          if (inGoalX) handleGoal(false);
          else {
            puck.vy *= -1;
            puck.y = height - PUCK_RADIUS;
          }
        }
        // Left/Right walls
        if (puck.x < PUCK_RADIUS || puck.x > width - PUCK_RADIUS) {
          puck.vx *= -1;
          puck.x = puck.x < PUCK_RADIUS ? PUCK_RADIUS : width - PUCK_RADIUS;
        }
      }

      // 5. Paddle Collisions
      const checkCollision = (paddle: { x: number, y: number }) => {
        const pdx = puck.x - paddle.x;
        const pdy = puck.y - paddle.y;
        const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
        if (pdist < PADDLE_RADIUS + PUCK_RADIUS) {
          const angle = Math.atan2(pdy, pdx);
          const push = (PADDLE_RADIUS + PUCK_RADIUS - pdist);
          puck.x += Math.cos(angle) * push;
          puck.y += Math.sin(angle) * push;

          const speed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
          puck.vx = Math.cos(angle) * (speed + 3);
          puck.vy = Math.sin(angle) * (speed + 3);
          
          const newSpeed = Math.sqrt(puck.vx * puck.vx + puck.vy * puck.vy);
          if (newSpeed > MAX_SPEED) {
            puck.vx = (puck.vx / newSpeed) * MAX_SPEED;
            puck.vy = (puck.vy / newSpeed) * MAX_SPEED;
          }
        }
      };

      checkCollision(player);
      checkCollision(ai);
    };

    const draw = () => {
      const { puck, player, ai, canvasSize, isHorizontal } = stateRef.current;
      const { width, height } = canvasSize;
      ctx.clearRect(0, 0, width, height);

      // --- Football Pitch Drawing ---
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = 2;
      
      // Outer border
      ctx.strokeRect(5, 5, width - 10, height - 10);

      const goalSize = (isHorizontal ? height : width) * GOAL_SIZE_PCT;
      
      if (isHorizontal) {
        // Center line & circle
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.stroke();

        // Penalty areas
        const penW = 120;
        const penH = goalSize + 80;
        
        // Left
        ctx.strokeRect(0, height/2 - penH/2, penW, penH);
        ctx.strokeRect(0, height/2 - goalSize/2 - 20, 40, goalSize + 40);
        
        // Right
        ctx.strokeRect(width - penW, height/2 - penH/2, penW, penH);
        ctx.strokeRect(width - 40, height/2 - goalSize/2 - 20, 40, goalSize + 40);
        
      } else {
        // Center line & circle
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 70, 0, Math.PI * 2);
        ctx.stroke();

        // Penalty areas
        const penH = 120;
        const penW = goalSize + 80;
        
        // Top
        ctx.strokeRect(width/2 - penW/2, 0, penW, penH);
        ctx.strokeRect(width/2 - goalSize/2 - 20, 0, goalSize + 40, 40);
        
        // Bottom
        ctx.strokeRect(width/2 - penW/2, height - penH, penW, penH);
        ctx.strokeRect(width/2 - goalSize/2 - 20, height - 40, goalSize + 40, 40);
      }

      // Goals highlighting
      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)';
      if (isHorizontal) {
        ctx.fillRect(0, height / 2 - goalSize / 2, 10, goalSize);
        ctx.fillRect(width - 10, height / 2 - goalSize / 2, 10, goalSize);
      } else {
        ctx.fillRect(width / 2 - goalSize / 2, 0, goalSize, 10);
        ctx.fillRect(width / 2 - goalSize / 2, height - 10, goalSize, 10);
      }

      // Draw Paddles with Icons
      const drawPaddle = (x: number, y: number, img: HTMLImageElement | null, color: string) => {
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, PADDLE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        
        if (img) {
          ctx.beginPath();
          ctx.arc(x, y, PADDLE_RADIUS - 5, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x - (PADDLE_RADIUS - 5), y - (PADDLE_RADIUS - 5), (PADDLE_RADIUS - 5) * 2, (PADDLE_RADIUS - 5) * 2);
        }
        ctx.restore();
      };

      drawPaddle(player.x, player.y, playerImgRef.current, '#00F0FF');
      drawPaddle(ai.x, ai.y, opponentImgRef.current, '#FFFFFF');

      // Puck
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00F0FF';
      ctx.fillStyle = '#0072FF';
      ctx.beginPath();
      ctx.arc(puck.x, puck.y, PUCK_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [gameState]);

  const handlePointerDown = (e: React.PointerEvent) => {
    stateRef.current.isTouching = true;
    updateTarget(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (stateRef.current.isTouching) updateTarget(e);
  };

  const handlePointerUp = () => {
    stateRef.current.isTouching = false;
  };

  const updateTarget = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      stateRef.current.target = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-navy/90 backdrop-blur-xl flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-bright-blue/10 to-transparent pointer-events-none" />
      
      <div className="relative w-full max-w-6xl h-full flex flex-col items-center justify-center px-4 py-8">
        {/* HUD */}
        <div className="w-full max-w-4xl flex items-center justify-between mb-4 md:mb-6 text-white z-10 bg-navy/40 p-2 md:p-4 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-md">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <img src={playerLogo} alt="" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[10px] font-black uppercase text-bright-blue tracking-tighter md:tracking-widest truncate max-w-[60px] md:max-w-none">{homeTeamName}</span>
              <span className="text-xl md:text-4xl font-black italic leading-none">{scores.player}</span>
            </div>
          </div>
          
          <div className="flex flex-col items-center mx-2 h-full justify-center">
             <div className="px-3 md:px-6 py-1 md:py-2 bg-bright-blue/10 rounded-full border border-bright-blue/20 mb-0 md:mb-1">
                <span className="text-sm md:text-2xl font-mono text-white tracking-widest leading-none">{formatTime(timeLeft)}</span>
             </div>
             <span className="text-[6px] md:text-[8px] font-black uppercase text-white/30 tracking-widest">ОСТАЛОСЬ</span>
          </div>

          <div className="flex items-center gap-2 md:gap-4 text-right flex-1 justify-end">
            <div className="flex flex-col">
              <span className="text-[7px] md:text-[10px] font-black uppercase text-white/40 tracking-tighter md:tracking-widest truncate max-w-[60px] md:max-w-none">{opponent.name}</span>
              <span className="text-xl md:text-4xl font-black italic leading-none">{scores.ai}</span>
            </div>
            <img src={opponent.logo} alt="" className="w-8 h-8 md:w-12 md:h-12 object-contain" />
          </div>
        </div>

        {/* Board Container */}
        <div className="relative w-full flex-1 max-h-[70vh] glass-card rounded-[40px] border border-bright-blue/30 overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.2)]">
          {isPortrait && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-navy/95 z-[110]">
              <RotateCcw className="w-16 h-16 text-bright-blue mb-6 animate-spin" />
              <h2 className="text-2xl font-black text-white uppercase mb-3">Поверните устройство</h2>
              <p className="text-base text-white/60">Для игры в аэрохоккей требуется альбомная (горизонтальная) ориентация экрана</p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full touch-none"
          />

          <AnimatePresence>
            {gameState === 'IDLE' && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-navy/70 flex items-center justify-center p-8 z-50 backdrop-blur-md"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={startGame}
                  className="flex flex-col items-center gap-6 bg-bright-blue text-navy px-12 py-8 rounded-[40px] font-black uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(0,240,255,0.5)] group"
                >
                  <PlayCircle className="w-16 h-16 group-hover:scale-110 transition-transform" />
                  <span className="text-xl">Начать матч</span>
                </motion.button>
              </motion.div>
            )}

            {gameState === 'GOAL' && (
              <motion.div 
                initial={{ scale: 0.2, opacity: 0, rotate: -20 }}
                animate={{ scale: 1.2, opacity: 1, rotate: 0 }}
                exit={{ scale: 2, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-[60]"
              >
                <span className="text-[120px] md:text-[200px] font-black italic text-white drop-shadow-[0_0_30px_rgba(0,240,255,1)] uppercase select-none">ГОЛ!</span>
              </motion.div>
            )}

            {gameState === 'OVER' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-navy/95 flex flex-col items-center justify-center p-8 z-[70] text-center"
              >
                <div className="mb-8 p-4 bg-white/5 rounded-full border border-white/10">
                   <Trophy className="w-20 h-20 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                </div>
                <h2 className="text-5xl md:text-7xl font-black italic text-white mb-2 uppercase tracking-tighter">КОНЕЦ ИГРЫ</h2>
                <p className="text-2xl md:text-3xl font-black text-bright-blue uppercase mb-12">
                  {winner === 'Ничья' ? 'НИЧЬЯ' : `ПОБЕДА: ${winner}`}
                </p>
                <div className="text-xs text-white/30 uppercase tracking-[0.3em] animate-bounce">
                  Возврат к приложению...
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-3 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X className="w-10 h-10" />
        </button>
      </div>
    </div>
  );
};

export default AirHockeyGame;
