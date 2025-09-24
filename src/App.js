import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Settings from './Settings';

const CATEGORIES = ["1-100", "101-1000", "1001-10000", "素食", "購物", "旅遊地點-名詞"];
const QUIZ_MODES = {
  chinese: '中文題目，練習日文發音',
  kanji: '日文題目，練習日文發音',
  listening: '日文題目，練習日文聽力',
};

const getInitialScores = () => {
  const savedScores = localStorage.getItem('jp_scores');
  return savedScores ? JSON.parse(savedScores) : {};
};

const getInitialSettings = () => {
  const savedSettings = localStorage.getItem('jp_settings');
  if (savedSettings) {
    return JSON.parse(savedSettings);
  }
  return {
    numQuestions: 10,
    autoAdvanceDelay: 1,
    autoAdvanceEnabled: true,
  };
};

// Fisher-Yates shuffle algorithm
const shuffleArray = (array) => {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex !== 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

const getJapaneseFromExample = (example) => {
  if (!example) return "";
  return example.replace(/<br\s*\/?>/gi, ' ');
}

function App() {
  const [quizList, setQuizList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quizMode, setQuizMode] = useState('chinese'); // Default to chinese
  const [showAnswer, setShowAnswer] = useState(false);
  const [scores, setScores] = useState(getInitialScores());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answerPhase, setAnswerPhase] = useState('feedback'); // feedback, countdown, paused
  const [countdown, setCountdown] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getInitialSettings());
  
  const autoAdvanceTimer = useRef(null);
  const countdownTimer = useRef(null);

  useEffect(() => {
    localStorage.setItem('jp_scores', JSON.stringify(scores));
  }, [scores]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('jp_settings', JSON.stringify(newSettings));
    setShowSettings(false);
  };

  const cleanupTimers = () => {
    clearTimeout(autoAdvanceTimer.current);
    clearInterval(countdownTimer.current);
  };

  const showWordAtIndex = (index, list) => {
    if (list.length === 0) {
      setCurrentWord(null);
      return;
    }
    const newWord = { ...list[index], id: `${selectedCategory}-${list[index].kanji}` };
    setCurrentWord(newWord);
    setShowAnswer(false);
    setAnswerPhase('feedback');
    setCountdown(null);
  };

  const nextWord = () => {
    cleanupTimers();
    const nextIndex = currentIndex + 1;
    if (nextIndex >= quizList.length) {
      // Reshuffle and start from the beginning
      const shuffledList = shuffleArray([...quizList]);
      setQuizList(shuffledList);
      setCurrentIndex(0);
      showWordAtIndex(0, shuffledList);
    } else {
      setCurrentIndex(nextIndex);
      showWordAtIndex(nextIndex, quizList);
    }
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setLoading(true);
    setError(null);
    setQuizList([]);

    fetch(`/data/${category}.json`)
      .then(response => response.json())
      .then(data => {
        let processedData = data;
        if (quizMode === 'chinese') {
          processedData = data.filter(word => word.chinese);
        }

        const shuffledData = shuffleArray(processedData);
        const selectedData = shuffledData.slice(0, settings.numQuestions);
        setQuizList(selectedData);
        setCurrentIndex(0);
        showWordAtIndex(0, selectedData);
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

    if (settings.autoAdvanceEnabled) {
      setAnswerPhase('countdown');
      setCountdown(settings.autoAdvanceDelay);

      countdownTimer.current = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      autoAdvanceTimer.current = setTimeout(() => {
        clearInterval(countdownTimer.current);
        nextWord();
      }, settings.autoAdvanceDelay * 1000);
    } else {
      setAnswerPhase('paused');
    }
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
            <div className="answer-details">
              <div className="kana-display">
                <span className="kanji-in-answer">{currentWord.kanji}</span>
                {currentWord.kana}
                {currentWord.chinese && <span className="chinese-in-answer">{currentWord.chinese}</span>}
              </div>
              {currentWord.example && 
                <div className="example-display" dangerouslySetInnerHTML={{ __html: currentWord.example }} />
              }
              {currentWord.example_chinese && 
                <div className="example-display-chinese" dangerouslySetInnerHTML={{ __html: currentWord.example_chinese }} />
              }
              <div className="speak-controls">
                <button onClick={() => speak(currentWord.kanji)} className="speak-button">🔊 日文</button>
                {currentWord.example && 
                  <button onClick={() => speak(getJapaneseFromExample(currentWord.example))} className="speak-button">🔊 範例</button>
                }
              </div>
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
              <button className='next-word' onClick={nextWord}>下一題</button>
            )}
          </div>
        )}
        <button className='change-category' onClick={() => setSelectedCategory(null)}>更換題庫</button>
      </div>
    );
  }

  const renderSetupScreen = () => {
    return (
      <div className="setup-screen">
        <div className="mode-selector">
          <h2>請選擇練習模式：</h2>
          <div className="radio-group">
            {Object.entries(QUIZ_MODES).map(([modeKey, modeName]) => (
              <React.Fragment key={modeKey}>
                <input 
                  type="radio" 
                  id={modeKey}
                  name="quizMode" 
                  value={modeKey} 
                  checked={quizMode === modeKey}
                  onChange={() => setQuizMode(modeKey)}
                />
                <label htmlFor={modeKey}>{modeName}</label>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="category-selector">
          <h2>請選擇題庫：</h2>
          {CATEGORIES.map(category => (
            <button key={category} onClick={() => handleSelectCategory(category)}>
              {category}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (showSettings) {
      return <Settings settings={settings} onSave={handleSaveSettings} onBack={() => setShowSettings(false)} />;
    }
    if (!selectedCategory) {
      return renderSetupScreen();
    }
    return renderQuizArea();
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>日文單字練習</h1>
        <button className="settings-button" onClick={() => setShowSettings(true)}>設定</button>
      </header>
      <main>
        {error && <p style={{color: 'red'}}>{error}</p>}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;