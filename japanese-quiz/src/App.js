import React, { useState, useEffect } from 'react';
import './App.css';
import words from './data/words';

// Function to get scores from Local Storage
const getInitialScores = () => {
  const savedScores = localStorage.getItem('jp_scores');
  return savedScores ? JSON.parse(savedScores) : {};
};

function App() {
  const [currentWord, setCurrentWord] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scores, setScores] = useState(getInitialScores());

  // Effect to save scores to Local Storage whenever they change
  useEffect(() => {
    localStorage.setItem('jp_scores', JSON.stringify(scores));
  }, [scores]);

  const nextWord = (category) => {
    const wordList = words[category];
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const newWord = { ...wordList[randomIndex], id: `${category}-${wordList[randomIndex].kanji}` };
    setCurrentWord(newWord);
    setShowAnswer(false);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    nextWord(category);
  };

  const handleFeedback = (isCorrect) => {
    const wordId = currentWord.id;
    const currentScore = scores[wordId] || 0;

    const newScore = isCorrect ? currentScore + 1 : 0;
    
    setScores(prevScores => ({
      ...prevScores,
      [wordId]: newScore,
    }));
    
    // NOTE: Automatic nextWord call is removed as per spec 1.1
  };

  // Text-to-speech function
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('抱歉，您的瀏覽器不支援語音功能。');
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>日文單字練習</h1>
      </header>
      <main>
        {!selectedCategory ? (
          <div className="category-selector">
            <h2>請選擇題庫：</h2>
            {Object.keys(words).map(category => (
              <button key={category} onClick={() => handleSelectCategory(category)}>
                {category}
              </button>
            ))}
          </div>
        ) : (
          <div className="quiz-area">
            <div className="kanji-display">
              {currentWord ? currentWord.kanji : '讀取中...'}
            </div>
            
            {currentWord && (
              <div className="controls">
                {!showAnswer && <button onClick={() => setShowAnswer(true)}>查看答案</button>}
                {showAnswer && (
                  <div className="kana-display">
                    <span className="kanji-in-answer">{currentWord.kanji}</span>
                    {currentWord.kana}
                    <button onClick={() => speak(currentWord.kana)} className="speak-button">🔊</button>
                  </div>
                )}
              </div>
            )}

            {showAnswer && (
              <>
                <div className="feedback-buttons">
                  <button className='correct' onClick={() => handleFeedback(true)}>答對了！</button>
                  <button className='incorrect' onClick={() => handleFeedback(false)}>答錯了</button>
                </div>
                <button className='next-word' onClick={() => nextWord(selectedCategory)}>下一題</button>
              </>
            )}

            <button className='change-category' onClick={() => setSelectedCategory(null)}>更換題庫</button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
