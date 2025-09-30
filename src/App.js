import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Settings from './Settings';
import About from './About';
import QuizList from './components/QuizList';
import DictionaryMode from './components/DictionaryMode';
import QuizMode from './components/QuizMode';
import './About.css';
import { initGA } from './utils/ga4';
import VersionInfo from './components/VersionInfo';

const QUIZ_MODES = {
  chinese: '練說🇹🇼中文題目',
  kanji: '練說🇯🇵日文題目',
  listening: '練聽🎧日文題目',
  dictionary: '辭典📚自由瀏覽',
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
  const [quizMode, setQuizMode] = useState('dictionary'); // Default to dictionary
  const [showAnswer, setShowAnswer] = useState(false);
  const [scores, setScores] = useState(getInitialScores());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answerPhase, setAnswerPhase] = useState('feedback'); // feedback, countdown, paused
  const [countdown, setCountdown] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [settings, setSettings] = useState(getInitialSettings());
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [activeSubcategories, setActiveSubcategories] = useState({});
  const [endOfRoundReached, setEndOfRoundReached] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [allowSidebarScroll, setAllowSidebarScroll] = useState(true);
  const quizContentRef = useRef(null);
  const quizAreaRef = useRef(null); // New ref
  
  useEffect(() => {
    initGA('G-V7B14EGJC6');
  }, []);

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
      .then(groups => {
        const promises = groups.map(group => {
          const subcategoryPromises = group.subcategory.map(subcategory => {
            const filePromises = subcategory.files.map(name =>
              fetch(`/data/${name}`)
                .then(res => res.json())
                .then(data => ({ name, count: data.length }))
                .catch(err => {
                  console.error(`Error loading file ${name}:`, err);
                  return { name, count: 0, error: true };
                })
            );
            return Promise.all(filePromises).then(files => ({
              name: subcategory.name,
              files: files,
            }));
          });
          return Promise.all(subcategoryPromises).then(subcategory => ({
            category: group.category,
            subcategory: subcategory,
          }));
        });
        return Promise.all(promises);
      })
      .then(categoryData => {
        setCategoryGroups(categoryData);
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

  useEffect(() => {
    if (categoryGroups.length > 0) {
      const initialActive = {};
      categoryGroups.forEach(group => {
        if (!activeSubcategories[group.category]) {
          initialActive[group.category] = 'all';
        }
      });
      if (Object.keys(initialActive).length > 0) {
        setActiveSubcategories(prev => ({ ...prev, ...initialActive }));
      }
    }
  }, [categoryGroups, activeSubcategories]);

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
    setAllowSidebarScroll(false);
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
    setAllowSidebarScroll(false);
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
    console.log("--- Starting Practice ---");
    console.log("Selected categories:", selectedCategories);
    setEndOfRoundReached(false);
    setLoading(true);
    setError(null);
    setQuizList([]);

    const fetchPromises = selectedCategories.map(categoryName =>
      fetch(`/data/${categoryName}`)
        .then(response => {
          console.log(`Fetching ${categoryName}. Status:`, response.status);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${categoryName}`);
          }
          return response.json().catch(err => {
            console.error(`Failed to parse JSON for ${categoryName}`, err);
            throw new Error(`Syntax error in ${categoryName}`);
          });
        })
    );

    Promise.all(fetchPromises)
      .then(allData => {
        console.log("All selected files loaded and parsed successfully.");
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
        console.error("Error in handleStartPractice:", err);
        setError(`無法載入詞庫，請稍後再試。(${err.message})`);
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
    setAllowSidebarScroll(true);
    cleanupTimers();
    setCurrentIndex(index);
    showWordAtIndex(index, quizList);
    if (quizContentRef.current) {
      quizContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
          <DictionaryMode
            currentWord={currentWord}
            currentIndex={currentIndex}
            quizListLength={quizList.length}
            speak={speak}
            getJapaneseFromExample={getJapaneseFromExample}
            previousWord={previousWord}
            nextWord={nextWord}
            handleGoHome={handleGoHome}
            quizAreaRef={quizAreaRef}
          />
        ) : (
          <QuizMode
            currentWord={currentWord}
            currentIndex={currentIndex}
            quizListLength={quizList.length}
            quizMode={quizMode}
            showAnswer={showAnswer}
            scores={scores}
            speak={speak}
            getJapaneseFromExample={getJapaneseFromExample}
            setShowAnswer={setShowAnswer}
            quizAreaRef={quizAreaRef}
            handleFeedback={handleFeedback}
            nextWord={nextWord}
            answerPhase={answerPhase}
            countdown={countdown}
            handleStopCountdown={handleStopCountdown}
            handleGoHome={handleGoHome}
          />
        )}
      </>
    );

    if (loading) return <p>載入中...</p>;
    if (error) return <p style={{color: 'red'}}>{error}</p>;

    return (
      <div className="quiz-area-container">
        <div className="quiz-content" ref={quizContentRef}>
          {quizContent}
        </div>
        {quizList.length > 0 && (
          <QuizList
            list={quizList}
            mode={quizMode}
            currentIndex={currentIndex}
            onWordSelect={handleWordSelect}
            allowSidebarScroll={allowSidebarScroll}
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
    const handleSubcategoryChange = (categoryName, subcategoryName) => {
      setActiveSubcategories(prev => ({
        ...prev,
        [categoryName]: subcategoryName,
      }));
    };

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
          <div className="category-selector-header">
            <h2>請選擇詞庫：</h2>
            <button 
              onClick={handleStartPractice} 
              disabled={selectedCategories.length === 0 || loading}
              className="start-button-inline"
            >
              開始練習
            </button>
          </div>
          {loading && <p>詞庫載入中...</p>}
          
          {categoryGroups.map(group => {
            const activeSub = activeSubcategories[group.category] || 'all';
            let filesToShow = [];
            if (activeSub === 'all') {
              filesToShow = group.subcategory.flatMap(sc => sc.files);
            } else {
              const sub = group.subcategory.find(sc => sc.name === activeSub);
              if (sub) {
                filesToShow = sub.files;
              }
            }

            return (
              <div key={group.category} className="category-group">
                <div className="category-header">
                  <h3>{group.category}</h3>
                  <div className="subcategory-links">
                    <a href="#" className={`subcategory-link all-link ${activeSub === 'all' ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); handleSubcategoryChange(group.category, 'all');}}>
                      All <span className="category-count">({group.subcategory.flatMap(sc => sc.files).length})</span>
                    </a>
                    {group.subcategory.map(sub => {
                      if (sub.name === 'others' && sub.files.length === 0) {
                        return null;
                      }
                      return (
                        <a href="#" key={sub.name} className={`subcategory-link ${activeSub === sub.name ? 'active' : ''}`} onClick={(e) => {e.preventDefault(); handleSubcategoryChange(group.category, sub.name);}}>
                          {sub.name} <span className="category-count">({sub.files.length})</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
                <div className="checkbox-group">
                  {filesToShow.map(file => (
                    <div key={file.name} className="checkbox-item">
                      <input
                        type="checkbox"
                        id={file.name}
                        value={file.name}
                        checked={selectedCategories.includes(file.name)}
                        onChange={() => handleCategoryChange(file.name)}
                        disabled={file.error}
                      />
                      <label htmlFor={file.name} className={file.error ? 'disabled' : ''}>
                        {file.name.replace('.json', '')}
                        {!file.error && <span className="category-count"> ({file.count})</span>}
                        {file.error && <span className="category-count"> (載入失敗)</span>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

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
    if (showAbout) {
      return <About onBack={() => setShowAbout(false)} />;
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
        <div className="header-buttons">
          <button className="about-button" onClick={() => setShowAbout(true)}>About</button>
          <button className="settings-button" onClick={() => setShowSettings(true)}>設定</button>
        </div>
      </header>
      <main>
        {error && <p style={{color: 'red'}}>{error}</p>}
        {renderContent()}
      </main>
      <footer className="App-footer">
        <VersionInfo />
      </footer>
    </div>
  );
}

export default App;
