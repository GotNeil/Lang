import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const CATEGORIES = ["1-100", "101-1000", "1001-10000", "1-9999", "素食"];
const QUIZ_MODES = {
  kanji: '看漢字練習日文發音',
  listening: '日文聽力測驗',
  chinese: '看中文練習日文發音',
};

const getInitialScores = () => {
  const savedScores = localStorage.getItem('jp_scores');
  return savedScores ? JSON.parse(savedScores) : {};
};

function App() {
  const [wordList, setWordList] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizMode, setQuizMode] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [scores, setScores] = useState(getInitialScores());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answerPhase, setAnswerPhase] = useState('feedback'); // feedback, countdown, paused
  const [countdown, setCountdown] = useState(null);
  
  const autoAdvanceTimer = useRef(null);
  const countdownTimer = useRef(null);

  useEffect(() => {
    localStorage.setItem('jp_scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    if (wordList.length > 0) {
      nextWord(wordList);
    } else if (selectedCategory) {
      setCurrentWord(null); // Clear word if list is empty after filtering
    }
  }, [wordList, selectedCategory]);

  const cleanupTimers = () => {
    clearTimeout(autoAdvanceTimer.current);
    clearInterval(countdownTimer.current);
  };

  const nextWord = (list) => {
    cleanupTimers();
    if (list.length === 0) {
      setCurrentWord(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * list.length);
    const newWord = { ...list[randomIndex], id: `${selectedCategory}-${list[randomIndex].kanji}` };
    setCurrentWord(newWord);
    setShowAnswer(false);
    setAnswerPhase('feedback');
    setCountdown(null);
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setLoading(true);
    setError(null);
    setWordList([]);

    fetch(`/data/${category}.json`)
      .then(response => response.json())
      .then(data => {
        let processedData = data;
        if (quizMode === 'chinese') {
          processedData = data.filter(word => word.chinese);
        }

        if (category === '1-9999') {
          const shuffled = processedData.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 50);
          setWordList(selected);
        } else {
          setWordList(processedData);
        }
        setLoading(false);
      })
      .catch(err => {
        setError('無法載入題庫，請稍後再試。');
        setLoading(false);
      });
  };

  const handleFeedback = (isCorrect) => {
    const wordId = currentWord.id;
    const currentScore = scores[wordId] || 0;
    const newScore = isCorrect ? currentScore + 1 : 0;
    
    setScores(prevScores => ({ ...prevScores, [wordId]: newScore }));
    setAnswerPhase('countdown');
    setCountdown(3);

    countdownTimer.current = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    autoAdvanceTimer.current = setTimeout(() => {
      clearInterval(countdownTimer.current);
      nextWord(wordList);
    }, 3000);
  };

  const handleStopCountdown = () => {
    cleanupTimers();
    setAnswerPhase('paused');
    setCountdown(null);
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      window.speechSynthesis.speak(utterance);
    } else {
      alert('抱歉，您的瀏覽器不支援語音功能。');
    }
  };

  const resetState = () => {
    setQuizMode(null);
    setSelectedCategory(null);
    setCurrentWord(null);
    setWordList([]);
  }

  const renderQuizArea = () => {
    if (loading) return <p>載入中...</p>;
    if (error) return <p style={{color: 'red'}}>{error}</p>;
    if (!currentWord) {
      if (selectedCategory) {
        return <p>此題庫在此模式中沒有可用的題目。</p>;
      }
      return <p>請先選擇一個題庫。</p>;
    }

    const currentScore = scores[currentWord.id] || 0;

    return (
      <div className="quiz-area">
        {quizMode === 'kanji' && (
          <div className="kanji-display">
            {currentWord.kanji}
            <span className="proficiency-score" title={`熟練度：${currentScore}`}>熟練度: {currentScore}</span>
          </div>
        )}
        {quizMode === 'listening' && !showAnswer && (
          <div className="listening-question">
            <button onClick={() => speak(currentWord.kana)} className="speak-button">🔊 播放聲音</button>
          </div>
        )}
        {quizMode === 'chinese' && (
          <div className="kanji-display chinese-display">
            {currentWord.chinese}
            <span className="proficiency-score" title={`熟練度：${currentScore}`}>熟練度: {currentScore}</span>
          </div>
        )}
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
        {showAnswer && (
          <div className="phase-controls">
            {answerPhase === 'feedback' && (
              <div className="feedback-buttons">
                <button className='correct' onClick={() => handleFeedback(true)}>答對了！</button>
                <button className='incorrect' onClick={() => handleFeedback(false)}>答錯了</button>
              </div>
            )}
            {answerPhase === 'countdown' && (
              <button className="stop-button" onClick={handleStopCountdown}>
                停止倒數 ({countdown})
              </button>
            )}
            {answerPhase === 'paused' && (
              <button className='next-word' onClick={() => nextWord(wordList)}>下一題</button>
            )}
          </div>
        )}
        <button className='change-category' onClick={() => setSelectedCategory(null)}>更換題庫</button>
        <button className='change-mode' onClick={resetState}>更換模式</button>
      </div>
    );
  }

  const renderContent = () => {
    if (!quizMode) {
      return (
        <div className="mode-selector">
          <h2>請選擇練習模式：</h2>
          {Object.entries(QUIZ_MODES).map(([modeKey, modeName]) => (
            <button key={modeKey} onClick={() => setQuizMode(modeKey)}>
              {modeName}
            </button>
          ))}
        </div>
      );
    }
    if (!selectedCategory) {
      return (
        <div className="category-selector">
          <h2>請選擇題庫：</h2>
          {CATEGORIES.map(category => (
            <button key={category} onClick={() => handleSelectCategory(category)}>
              {category}
            </button>
          ))}
          <button className='change-mode' onClick={resetState}>更換模式</button>
        </div>
      );
    }
    return renderQuizArea();
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>日文單字練習</h1>
      </header>
      <main>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;
