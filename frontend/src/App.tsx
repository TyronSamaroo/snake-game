import { useState, useEffect } from 'react'
import Game from './components/Game'
import Documentation from './components/Documentation'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState<'game' | 'docs' | 'leaderboard'>('game')

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0A0F1C] to-[#161f38] overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 backdrop-blur-lg bg-black/30 z-50 border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500 drop-shadow-lg">
            Snake Game
          </h1>
          <div className="flex items-center gap-3">
            <div className="bg-black/60 p-1 rounded-full flex gap-1 shadow-xl shadow-black/20">
              <button
                onClick={() => setCurrentView('game')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentView === 'game'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Play Game
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentView === 'leaderboard'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setCurrentView('docs')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  currentView === 'docs'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Documentation
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Background effects */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Content */}
      <div className="pt-16 relative z-10">
        {currentView === 'game' && <Game />}
        {currentView === 'docs' && <Documentation />}
        {currentView === 'leaderboard' && <Leaderboard />}
      </div>
    </div>
  )
}

// Leaderboard Component
const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Array<{
    playerName: string;
    score: number;
    date: string;
  }>>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('http://localhost:8080/leaderboard', {
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        const data = await response.json();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
    // Fetch every 5 seconds to keep it updated
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="bg-black/60 p-8 rounded-3xl backdrop-blur-md max-w-2xl w-full shadow-2xl border border-white/5 transform perspective-3d rotateX-1">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-[1px] rounded-2xl">
          <div className="bg-black/60 p-6 rounded-2xl">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent text-center drop-shadow-lg">
              Global Leaderboard
            </h2>
            <div className="space-y-4 perspective-3d">
              {leaderboard.map((entry, index) => (
                <div 
                  key={index} 
                  className={`flex justify-between items-center p-4 rounded-xl border shadow-lg transform transition-all duration-300 hover:translate-x-1 hover:-translate-y-1 ${
                    index === 0 ? 'bg-green-500/20 border-green-500/20 shadow-green-500/10' : 'bg-black/40 border-white/5 shadow-black/40'
                  }`}
                  style={{
                    transform: `perspective(1000px) rotateX(${index * 1}deg)`,
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                    <div>
                      <span className="text-white text-lg">
                        {entry.playerName}
                      </span>
                      <span className="text-gray-400 text-sm block">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold text-xl">
                    {entry.score}
                  </span>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-gray-400 text-center py-8 text-lg animate-pulse-custom">
                  No scores yet. Be the first!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App
