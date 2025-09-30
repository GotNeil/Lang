import React from 'react';
import './DictionaryMode.css'; // We'll create this CSS file

function DictionaryMode({
  currentWord,
  currentIndex,
  quizListLength,
  speak,
  getJapaneseFromExample,
  previousWord,
  nextWord,
  handleGoHome,
  quizAreaRef,
}) {
  return (
    <div className="quiz-area dictionary-mode" ref={quizAreaRef}>
      <p className="question-counter">{currentIndex + 1} / {quizListLength}</p>
      <div className="answer-details">
        <div className="kana-display">
          <span className="kanji-in-answer">{currentWord.kanji}</span>
          {currentWord.kana}
          {currentWord.romaji && <span className="romaji-in-answer">{currentWord.romaji}</span>}
          {currentWord.chinese && <span className="chinese-in-answer">{currentWord.chinese}</span>}
        </div>

        <div className="speak-japanese-only">
          <button onClick={() => speak(currentWord.kanji)} className="speak-button">🔊 日文</button>
        </div>

        <hr className="answer-separator" />

        {currentWord.example && (
          <div className="example-speak-text">
            對話範例
          </div>
        )}

        {currentWord.example && 
          <div className="example-display" dangerouslySetInnerHTML={{ __html: currentWord.example }} />}
        {currentWord.example_chinese && 
          <div className="example-display-chinese" dangerouslySetInnerHTML={{ __html: currentWord.example_chinese }} />}
      </div>

      {currentWord.example && (
        <div className="speak-example-button-container">
          <button onClick={() => speak(getJapaneseFromExample(currentWord.example))} className="speak-button">🔊 範例</button>
        </div>
      )}

      <div className="phase-controls">
        <div className="feedback-buttons">
          <button className='next-word' onClick={previousWord}>上一筆</button>
          <button className='next-word' onClick={nextWord}>下一筆</button>
        </div>
      </div>
      <button className='change-category' onClick={handleGoHome}>回到首頁</button>
    </div>
  );
}

export default DictionaryMode;
