import { TournamentData } from './types';

export const MOCK_DATA: TournamentData = {
  table: [
    { rank: 1, teamName: 'Динамо-Владивосток', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 2, teamName: 'Академия Динамо', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 3, teamName: 'СКА-Хабаровск', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 4, teamName: 'Искра', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 5, teamName: 'СШОР №1', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 6, teamName: 'Сахалин', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 7, teamName: 'Рекорд', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
    { rank: 8, teamName: 'Благовещенск', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, lastGames: [] },
  ],
  allMatches: [
    // Первый круг
    { id: 1, date: '03.06', time: '12:00', homeTeam: 'Сахалин', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 2, date: '03.06', time: '14:00', homeTeam: 'СШОР №1', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    { id: 3, date: '03.06', time: '16:00', homeTeam: 'Академия Динамо', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    { id: 4, date: '03.06', time: '18:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 5, date: '05.06', time: '12:00', homeTeam: 'Академия Динамо', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 6, date: '05.06', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    { id: 7, date: '05.06', time: '16:00', homeTeam: 'СШОР №1', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 8, date: '06.06', time: '12:00', homeTeam: 'Сахалин', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 9, date: '10.06', time: '14:00', homeTeam: 'Сахалин', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 10, date: '11.06', time: '14:00', homeTeam: 'Рекорд', awayTeam: 'Академия Динамо', status: 'Ожидается', location: 'Хабаровск' },
    { id: 11, date: '12.06', time: '14:00', homeTeam: 'СШОР №1', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 12, date: '15.06', time: '12:00', homeTeam: 'Сахалин', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    { id: 13, date: '15.06', time: '14:00', homeTeam: 'Благовещенск', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 14, date: '17.06', time: '12:00', homeTeam: 'Благовещенск', awayTeam: 'Академия Динамо', status: 'Ожидается', location: 'Хабаровск' },
    { id: 15, date: '17.06', time: '14:00', homeTeam: 'СШОР №1', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 16, date: '23.06', time: '12:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    { id: 17, date: '23.06', time: '14:00', homeTeam: 'Искра', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 18, date: '25.06', time: '12:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 19, date: '25.06', time: '14:00', homeTeam: 'Искра', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 20, date: '27.06', time: '14:00', homeTeam: 'Академия Динамо', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 21, date: '29.06', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 22, date: '30.06', time: '14:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 23, date: '04.07', time: '14:00', homeTeam: 'Сахалин', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 24, date: '08.07', time: '12:00', homeTeam: 'Сахалин', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
    { id: 25, date: '08.07', time: '14:00', homeTeam: 'Благовещенск', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    
    { id: 26, date: '12.07', time: '14:00', homeTeam: 'Сахалин', awayTeam: 'Академия Динамо', status: 'Ожидается', location: 'Хабаровск' },
    { id: 27, date: '19.07', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'Академия Динамо', status: 'Ожидается', location: 'Хабаровск' },
    { id: 28, date: '25.08', time: '14:00', homeTeam: 'Рекорд', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
    
    // Второй круг
    { id: 29, date: '02.09', time: '14:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Академия Динамо', status: 'Ожидается', location: 'Хабаровск' },
    { id: 30, date: '02.09', time: '16:00', homeTeam: 'Искра', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
    { id: 31, date: '04.09', time: '14:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
    { id: 32, date: '04.09', time: '16:00', homeTeam: 'Академия Динамо', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    { id: 33, date: '05.09', time: '14:00', homeTeam: 'СШОР №1', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 34, date: '07.09', time: '14:00', homeTeam: 'Искра', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 35, date: '09.09', time: '12:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 36, date: '09.09', time: '14:00', homeTeam: 'Академия Динамо', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    { id: 37, date: '12.09', time: '12:00', homeTeam: 'Благовещенск', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 38, date: '12.09', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    { id: 39, date: '13.09', time: '14:00', homeTeam: 'Искра', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 40, date: '15.09', time: '12:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 41, date: '15.09', time: '14:00', homeTeam: 'Рекорд', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 42, date: '17.09', time: '12:00', homeTeam: 'Академия Динамо', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 43, date: '17.09', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 44, date: '19.09', time: '12:00', homeTeam: 'Академия Динамо', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 45, date: '19.09', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'Сахалин', status: 'Ожидается', location: 'Хабаровск' },
    { id: 46, date: '21.09', time: '14:00', homeTeam: 'Рекорд', awayTeam: 'Благовещенск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 47, date: '26.09', time: '12:00', homeTeam: 'СШОР №1', awayTeam: 'Академия Динамо', status: 'Ожидается', location: 'Хабаровск' },
    { id: 48, date: '26.09', time: '14:00', homeTeam: 'Благовещенск', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 49, date: '26.09', time: '16:00', homeTeam: 'Рекорд', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    { id: 50, date: '28.09', time: '14:00', homeTeam: 'СШОР №1', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
    { id: 51, date: '29.09', time: '14:00', homeTeam: 'Благовещенск', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск' },
    { id: 52, date: '29.09', time: '16:00', homeTeam: 'СКА-Хабаровск', awayTeam: 'Рекорд', status: 'Ожидается', location: 'Хабаровск' },
    { id: 53, date: '08.10', time: '14:00', homeTeam: 'Благовещенск', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 54, date: '10.10', time: '12:00', homeTeam: 'Рекорд', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск' },
    { id: 55, date: '10.10', time: '14:00', homeTeam: 'Искра', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
    { id: 56, date: '10.10', time: '16:00', homeTeam: 'Академия Динамо', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск' },
  ],
  dinamoMatches: [
    { id: 4, date: '03.06', time: '18:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск', isHome: true },
    { id: 6, date: '05.06', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'Искра', status: 'Ожидается', location: 'Хабаровск', isHome: true },
    { id: 13, date: '15.06', time: '14:00', homeTeam: 'Благовещенск', awayTeam: 'Динамо-Владивосток', status: 'Ожидается', location: 'Хабаровск', isHome: false },
    { id: 21, date: '29.06', time: '14:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'СШОР №1', status: 'Ожидается', location: 'Хабаровск', isHome: true },
  ],
  recentMatches: [],
  nextMatch: { id: 4, date: '03.06', time: '18:00', homeTeam: 'Динамо-Владивосток', awayTeam: 'СКА-Хабаровск', status: 'Ожидается', location: 'Хабаровск' },
  dinamoStats: {
    rank: 1,
    points: 0,
    lastResults: []
  },
  dinamoPlayers: [
    { id: 1, number: '1', name: 'Иванов Иван', position: 'Вратарь', goals: 5 },
    { id: 2, number: '2', name: 'Петров Петр', position: 'Защитник', goals: 2 },
    { id: 3, number: '3', name: 'Сидоров Сидор', position: 'Полузащитник', goals: 4 },
    { id: 4, number: '4', name: 'Алексеев Алексей', position: 'Нападающий', goals: 12 }
  ]
};
