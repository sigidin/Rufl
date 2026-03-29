export interface Team {
  id: string;
  name: string;
  city: string;
  logo?: string;
}

export interface TableRow {
  rank: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  lastGames: ('W' | 'D' | 'L')[];
}

export interface Match {
  id: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'Ожидается' | 'Завершен' | 'Идет';
  location: string;
  homeScorers?: string; // New: comma separated list
  awayScorers?: string; // New: comma separated list
  photoUrl?: string;    // New: link to gallery
  broadcastUrl?: string; // New: link to stream
  weather?: string;      // New: weather info
  isHome?: boolean;
}

export interface Player {
  id: number; // For internal React key
  number: string; // Jersey number (can be empty string)
  name: string;
  position: string; // Flexible position string from CSV
  goals: number; 
  photoUrl?: string; // New: link to player photo
}

export interface TournamentData {
  table: TableRow[];
  allMatches: Match[];
  dinamoMatches: Match[];
  recentMatches: Match[];
  nextMatch: Match | null;
  dinamoStats: {
    rank: number;
    points: number;
    lastResults: ('W' | 'D' | 'L')[];
  };
  dinamoPlayers: Player[];
}
