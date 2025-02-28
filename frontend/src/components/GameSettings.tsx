import React from 'react';

export interface GameSettingsProps {
  snakeColor: string;
  setSnakeColor: (color: string) => void;
  foodColor: string;
  setFoodColor: (color: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  moveSound: boolean;
  setMoveSound: (enabled: boolean) => void;
  eatSound: boolean;
  setEatSound: (enabled: boolean) => void;
  gameOverSound: boolean;
  setGameOverSound: (enabled: boolean) => void;
  showParticles: boolean;
  setShowParticles: (show: boolean) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

const colorOptions = [
  { name: 'Green', value: '#10b981', headValue: '#34d399' },
  { name: 'Blue', value: '#3b82f6', headValue: '#60a5fa' },
  { name: 'Purple', value: '#8b5cf6', headValue: '#a78bfa' },
  { name: 'Red', value: '#ef4444', headValue: '#f87171' },
  { name: 'Yellow', value: '#eab308', headValue: '#facc15' },
  { name: 'Orange', value: '#f97316', headValue: '#fb923c' },
  { name: 'Pink', value: '#ec4899', headValue: '#f472b6' },
  { name: 'Cyan', value: '#06b6d4', headValue: '#22d3ee' },
];

const foodColorOptions = [
  { name: 'Red Apple', value: '#fb7185' },
  { name: 'Green Apple', value: '#4ade80' },
  { name: 'Golden Apple', value: '#fbbf24' },
  { name: 'Blue Berry', value: '#60a5fa' },
  { name: 'Purple Grape', value: '#a78bfa' },
  { name: 'Pink Cherry', value: '#f472b6' },
];

const GameSettings: React.FC<GameSettingsProps> = ({
  snakeColor,
  setSnakeColor,
  foodColor,
  setFoodColor,
  soundEnabled,
  setSoundEnabled,
  moveSound,
  setMoveSound,
  eatSound,
  setEatSound,
  gameOverSound,
  setGameOverSound,
  showParticles,
  setShowParticles,
  showSettings,
  setShowSettings,
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowSettings(false)}
      ></div>
      
      <div className="bg-black/80 border border-green-500/20 rounded-2xl p-6 shadow-2xl w-full max-w-md z-10 transform perspective-3d rotateX-1 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Game Settings</h2>
          <button 
            onClick={() => setShowSettings(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Snake Color Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-green-400 mb-2">Snake Color</h3>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setSnakeColor(color.value)}
                className={`w-10 h-10 rounded-full transition-all duration-200 transform hover:scale-110 ${snakeColor === color.value ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ 
                  background: `linear-gradient(135deg, ${color.headValue}, ${color.value})`,
                  boxShadow: snakeColor === color.value ? `0 0 12px ${color.value}` : 'none'
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Food Color Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-green-400 mb-2">Food Color</h3>
          <div className="grid grid-cols-4 gap-2">
            {foodColorOptions.map((color) => (
              <button
                key={color.value}
                onClick={() => setFoodColor(color.value)}
                className={`w-10 h-10 rounded-full transition-all duration-200 transform hover:scale-110 ${foodColor === color.value ? 'ring-2 ring-white scale-110' : ''}`}
                style={{ 
                  backgroundColor: color.value,
                  boxShadow: foodColor === color.value ? `0 0 12px ${color.value}` : 'none'
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-green-400 mb-2">Sound Effects</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                <span className="ml-3 text-sm font-medium text-white">Master Sound</span>
              </label>
            </div>
            
            <div className="flex items-center ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={moveSound}
                  onChange={(e) => setMoveSound(e.target.checked)}
                  disabled={!soundEnabled}
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 opacity-50 peer-checked:opacity-100"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Movement Sound</span>
              </label>
            </div>
            
            <div className="flex items-center ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={eatSound}
                  onChange={(e) => setEatSound(e.target.checked)}
                  disabled={!soundEnabled}
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 opacity-50 peer-checked:opacity-100"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Eating Sound</span>
              </label>
            </div>
            
            <div className="flex items-center ml-6">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={gameOverSound}
                  onChange={(e) => setGameOverSound(e.target.checked)}
                  disabled={!soundEnabled}
                />
                <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600 opacity-50 peer-checked:opacity-100"></div>
                <span className="ml-3 text-sm font-medium text-gray-300">Game Over Sound</span>
              </label>
            </div>
          </div>
        </div>

        {/* Visual Effects */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-green-400 mb-2">Visual Effects</h3>
          <div className="flex items-center">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={showParticles}
                onChange={(e) => setShowParticles(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-white">Particle Effects</span>
            </label>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(false)}
          className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white font-medium shadow-lg shadow-green-500/20 transform hover:translate-y-[-2px] transition-all duration-200"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default GameSettings; 