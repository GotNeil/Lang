import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Settings from './Settings';

const QUIZ_MODES = {
  chinese: '練習日文發音(🇹🇼中文題目)',
  kanji: '練習日文發音(🇯🇵日文題目)',
  listening: '練習日文聽力(🇯🇵🎧日文題目)',
  dictionary: '辭典模式(📚自由瀏覽)',
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
    numQuestions: 20, // Default to 20 questions
    autoAdvanceDelay: 1,
    autoAdvanceEnabled: true,
    selectedVoiceURI: null,
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
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizMode, setQuizMode] = useState('chinese'); // Default to chinese
  const [showAnswer, setShowAnswer] = useState(false);
  const [scores, setScores] = useState(getInitialScores());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answerPhase, setAnswerPhase] = useState('feedback'); // feedback, countdown, paused
  const [countdown, setCountdown] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(getInitialSettings());
  const [categories, setCategories] = useState([]);
  const [endOfRoundReached, setEndOfRoundReached] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  
  const autoAdvanceTimer = useRef(null);
  const countdownTimer = useRef(null);

  useEffect(() => {
    const populateVoiceList = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      const savedSettings = getInitialSettings();
      let voiceToSet = null;

      if (savedSettings.selectedVoiceURI) {
        voiceToSet = availableVoices.find(v => v.voiceURI === savedSettings.selectedVoiceURI);
      }
      
      if (!voiceToSet) {
        const japaneseVoices = availableVoices.filter(voice => voice.lang.startsWith('ja'));
        if (japaneseVoices.length > 0) {
          voiceToSet = japaneseVoices[0];
        }
      }

      if (!voiceToSet && availableVoices.length > 0) {
        voiceToSet = availableVoices[0];
      }
      
      setSelectedVoice(voiceToSet);
    };

    populateVoiceList();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = populateVoiceList;
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch('/data/manifest.json')
      .then(response => response.json())
      .then(categoryNames => {
        const fetchPromises = categoryNames.map(name =>
          fetch(`/data/${name}.json`)
            .then(res => res.json())
            .then(data => ({ name, count: data.length }))
        );
        return Promise.all(fetchPromises);
      })
      .then(categoryData => {
        setCategories(categoryData);
        setLoading(false);
      })
      .catch(err => {
        setError('無法載入詞庫清單。');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('jp_scores', JSON.stringify(scores));
  }, [scores]);

  const handleGoHome = () => {
    setQuizStarted(false);
    setSelectedCategories([]);
  };

  const handleSaveSettings = (newSettings) => {
    // Find the full voice object from the URI to set in state
    const voiceToSet = voices.find(v => v.voiceURI === newSettings.selectedVoiceURI);
    if (voiceToSet) {
      setSelectedVoice(voiceToSet);
    }
    
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
    const newWord = { ...list[index], id: `${selectedCategories.join('-')}-${list[index].kanji}` };
    setCurrentWord(newWord);
    setShowAnswer(false);
    setAnswerPhase('feedback');
    setCountdown(null);
  };

  const previousWord = () => {
    cleanupTimers();
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentIndex(prevIndex);
      showWordAtIndex(prevIndex, quizList);
    } else {
      const lastIndex = quizList.length - 1;
      setCurrentIndex(lastIndex);
      showWordAtIndex(lastIndex, quizList);
    }
  };

  const nextWord = () => {
    cleanupTimers();
    const nextIndex = currentIndex + 1;

    if (quizMode !== 'dictionary' && settings.numQuestions !== -1 && nextIndex === settings.numQuestions && quizList.length > settings.numQuestions) {
      setCurrentIndex(nextIndex);
      setEndOfRoundReached(true);
      return;
    }

    if (nextIndex >= quizList.length) {
      if (quizMode === 'dictionary') {
        setCurrentIndex(0);
        showWordAtIndex(0, quizList);
      } else {
        const shuffledList = shuffleArray([...quizList]);
        setQuizList(shuffledList);
        setCurrentIndex(0);
        showWordAtIndex(0, shuffledList);
      }
    } else {
      setCurrentIndex(nextIndex);
      showWordAtIndex(nextIndex, quizList);
    }
  };

  const handleStartPractice = () => {
    setEndOfRoundReached(false);
    setLoading(true);
    setError(null);
    setQuizList([]);

    const fetchPromises = selectedCategories.map(category =>
      fetch(`/data/${category}.json`).then(response => response.json())
    );

    Promise.all(fetchPromises)
      .then(allData => {
        const mergedData = allData.flat();
        let processedData = mergedData;
        if (quizMode === 'chinese') {
          processedData = mergedData.filter(word => word.chinese);
        }

        const dataForQuiz = quizMode === 'dictionary'
          ? processedData
          : shuffleArray(processedData);
        
        const selectedData = settings.numQuestions === -1
          ? dataForQuiz
          : dataForQuiz; // Always take the full list now

        setQuizList(selectedData);
        setCurrentIndex(0);
        showWordAtIndex(0, selectedData);
        setQuizStarted(true);
        setLoading(false);
      })
      .catch(err => {
        setError('無法載入詞庫，請稍後再試。');
        setLoading(false);
      });
  };

  const handleContinue = () => {
    setEndOfRoundReached(false);
    showWordAtIndex(currentIndex, quizList);
  };

  const handleReshuffle = () => {
    setEndOfRoundReached(false);
    handleStartPractice();
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
    if ('speechSynthesis' in window && selectedVoice) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('抱歉，您的瀏覽器不支援語音功能，或找不到合適的語音包。');
    }
  };

  const handleWordSelect = (index) => {
    cleanupTimers();
    setCurrentIndex(index);
    showWordAtIndex(index, quizList);
  };

  const QuizSidebar = ({ list, mode, currentIndex, onWordSelect }) => {
    const currentItemRef = useRef(null);

    useEffect(() => {
      if (currentItemRef.current) {
        currentItemRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }, [currentIndex]);

    const getDisplayText = (word, index) => {
      switch (mode) {
        case 'chinese':
        case 'dictionary':
          return word.chinese || word.kanji;
        case 'kanji':
          return word.kanji;
        case 'listening':
          return `題目 ${index + 1}`;
        default:
          return word.kanji;
      }
    };

    return (
      <div className="quiz-sidebar">
        <div className="sidebar-header">詞庫列表</div>
        <ul className="sidebar-list">
          {list.map((word, index) => (
            <li
              key={`${word.id}-${index}`}
              ref={index === currentIndex ? currentItemRef : null}
              className={`sidebar-item ${index === currentIndex ? 'active' : ''}`}
              onClick={() => onWordSelect(index)}
            >
              {getDisplayText(word, index)}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderQuizArea = () => {
    const quizContent = (
      <>
        {endOfRoundReached ? (
          <div className="end-of-round-screen">
            <h2>練習完畢！</h2>
            <p>您已完成設定的 {settings.numQuestions} 道題目。</p>
            <div className="end-of-round-controls">
              <button onClick={handleContinue}>繼續練習</button>
              <button onClick={handleReshuffle}>重新抽題</button>
            </div>
          </div>
        ) : !currentWord ? (
          <div className="quiz-area">
            {quizStarted ? (
              <p>此詞庫在此模式中沒有可用的題目。</p>
            ) : (
              <p>請先選擇一個詞庫。</p>
            )}
          </div>
        ) : quizMode === 'dictionary' ? (
          <div className="quiz-area dictionary-mode">
            <p className="question-counter">{currentIndex + 1} / {quizList.length}</p>
            <div className="answer-details">
              <div className="kana-display">
                <span className="kanji-in-answer">{currentWord.kanji}</span>
                {currentWord.kana}
                {currentWord.romaji && <span className="romaji-in-answer">{currentWord.romaji}</span>}
                {currentWord.chinese && <span className="chinese-in-answer">{currentWord.chinese}</span>}
              </div>
              {currentWord.example && 
                <div className="example-display" dangerouslySetInnerHTML={{ __html: currentWord.example }} />}
              {currentWord.example_chinese && 
                <div className="example-display-chinese" dangerouslySetInnerHTML={{ __html: currentWord.example_chinese }} />}
              <div className="speak-controls">
                <button onClick={() => speak(currentWord.kanji)} className="speak-button">🔊 日文</button>
                {currentWord.example && 
                  <button onClick={() => speak(getJapaneseFromExample(currentWord.example))} className="speak-button">🔊 範例</button>}
              </div>
            </div>
            <div className="phase-controls">
              <div className="feedback-buttons">
                <button className='next-word' onClick={previousWord}>上一筆</button>
                <button className='next-word' onClick={nextWord}>下一筆</button>
              </div>
            </div>
            <button className='change-category' onClick={handleGoHome}>回到首頁</button>
          </div>
        ) : (
          <div className="quiz-area">
            <p className="question-counter">{currentIndex + 1} / {quizList.length}</p>
            {quizMode === 'kanji' && (
              <div className="kanji-display">
                {currentWord.kanji}
                <span className="proficiency-score" title={`熟練度：${scores[currentWord.id] || 0}`}>熟練度: {scores[currentWord.id] || 0}</span>
              </div>
            )}
            {quizMode === 'listening' && !showAnswer && (
              <div className="listening-question">
                <button onClick={() => speak(currentWord.kanji)} className="speak-button">🔊 播放聲音</button>
              </div>
            )}
            {quizMode === 'chinese' && (
              <div className="kanji-display chinese-display">
                {currentWord.chinese}
                <span className="proficiency-score" title={`熟練度：${scores[currentWord.id] || 0}`}>熟練度: {scores[currentWord.id] || 0}</span>
              </div>
            )}
            <div className="controls">
              {!showAnswer && <button onClick={() => setShowAnswer(true)}>查看答案</button>}
              {showAnswer && (
                <div className="answer-details">
                  <div className="kana-display">
                    <span className="kanji-in-answer">{currentWord.kanji}</span>
                    {currentWord.kana}
                    {currentWord.romaji && <span className="romaji-in-answer">{currentWord.romaji}</span>}
                    {currentWord.chinese && <span className="chinese-in-answer">{currentWord.chinese}</span>}
                  </div>
                  {currentWord.example && 
                    <div className="example-display" dangerouslySetInnerHTML={{ __html: currentWord.example }} />}
                  {currentWord.example_chinese && 
                    <div className="example-display-chinese" dangerouslySetInnerHTML={{ __html: currentWord.example_chinese }} />}
                  <div className="speak-controls">
                    <button onClick={() => speak(currentWord.kanji)} className="speak-button">🔊 日文</button>
                    {currentWord.example && 
                      <button onClick={() => speak(getJapaneseFromExample(currentWord.example))} className="speak-button">🔊 範例</button>}
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
                    <button className='next-word' onClick={nextWord}>下一題</button>
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
            <button className='change-category' onClick={handleGoHome}>回到首頁</button>
          </div>
        )}
      </>
    );

    if (loading) return <p>載入中...</p>;
    if (error) return <p style={{color: 'red'}}>{error}</p>;

    return (
      <div className="quiz-area-container">
        <div className="quiz-content">
          {quizContent}
        </div>
        {quizList.length > 0 && (
          <QuizSidebar
            list={quizList}
            mode={quizMode}
            currentIndex={currentIndex}
            onWordSelect={handleWordSelect}
          />
        )}
      </div>
    );
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName) 
        ? prev.filter(c => c !== categoryName) 
        : [...prev, categoryName]
    );
  };

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
          <h2>請選擇詞庫：</h2>
          {loading && <p>詞庫載入中...</p>}
          <div className="checkbox-group">
            {categories.map(category => (
              <div key={category.name} className="checkbox-item">
                <input 
                  type="checkbox"
                  id={category.name}
                  value={category.name}
                  checked={selectedCategories.includes(category.name)}
                  onChange={() => handleCategoryChange(category.name)}
                />
                <label htmlFor={category.name}>{`${category.name} (${category.count})`}</label>
              </div>
            ))}
          </div>
          <button 
            onClick={handleStartPractice} 
            disabled={selectedCategories.length === 0 || loading}
            className="start-button"
          >
            {loading ? '載入中...' : '開始練習'}
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (showSettings) {
      return <Settings 
        settings={settings} 
        onSave={handleSaveSettings} 
        onBack={() => setShowSettings(false)}
        voices={voices}
        selectedVoice={selectedVoice}
      />;
    }
    if (!quizStarted) {
      return renderSetupScreen();
    }
    return renderQuizArea();
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1 onClick={handleGoHome}>日文辭典、練習</h1>
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
