import React from 'react';
import { copyToClipboard } from '../utils/clipboard';
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
          <div className="kanji-in-answer">
            <span>{currentWord.kanji}</span>
            <button className="copy-btn" onClick={() => copyToClipboard(currentWord.kanji)}><i className="fa-regular fa-copy"></i></button>
          </div>
          <div className="kana-in-answer">
            <span>{currentWord.kana}</span>
            <button className="copy-btn" onClick={() => copyToClipboard(currentWord.kana)}><i className="fa-regular fa-copy"></i></button>
          </div>
          {currentWord.romaji &&
            <div className="romaji-in-answer">
              <span>{currentWord.romaji}</span>
              <button className="copy-btn" onClick={() => copyToClipboard(currentWord.romaji)}><i className="fa-regular fa-copy"></i></button>
            </div>
          }
          {currentWord.chinese &&
            <div className="chinese-in-answer">
              <span>{currentWord.chinese}</span>
              <button className="copy-btn" onClick={() => copyToClipboard(currentWord.chinese)}><i className="fa-regular fa-copy"></i></button>
            </div>
          }
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
