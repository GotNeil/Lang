import React from 'react';
import './QuizMode.css'; // We'll create this CSS file

function QuizMode({
  currentWord,
  currentIndex,
  quizListLength,
  quizMode,
  showAnswer,
  scores,
  speak,
  getJapaneseFromExample,
  setShowAnswer,
  quizAreaRef,
  handleFeedback,
  nextWord,
  answerPhase,
  countdown,
  handleStopCountdown,
  handleGoHome,
}) {
  return (
    <div className="quiz-area" ref={quizAreaRef}>
      <p className="question-counter">{currentIndex + 1} / {quizListLength}</p>
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
          <div>{currentWord.chinese}</div>
          <span className="proficiency-score" title={`熟練度：${scores[currentWord.id] || 0}`}>熟練度: {scores[currentWord.id] || 0}</span>
        </div>
      )}
      <div className="controls">
        {!showAnswer && <button className="view-answer-button" onClick={() => {
          setShowAnswer(true);
          if (quizAreaRef.current) {
            quizAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}>查看答案</button>}
        {showAnswer && (
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

            {currentWord.example &&
              <div className="example-display" dangerouslySetInnerHTML={{ __html: currentWord.example }} />}
            {currentWord.example_chinese &&
              <div className="example-display-chinese" dangerouslySetInnerHTML={{ __html: currentWord.example_chinese }} />}

            {currentWord.example && (
              <div className="example-speak-text">
                對話範例
              </div>
            )}
          </div>
        )}
      </div>

      {showAnswer && currentWord.example && (
        <div className="speak-example-button-container">
          <button onClick={() => speak(getJapaneseFromExample(currentWord.example))} className="speak-button">🔊 範例</button>
        </div>
      )}

      {showAnswer && (
        <div className="phase-controls">
          {answerPhase === 'feedback' && (
            <div className="feedback-buttons">
              <div className="correct-incorrect-row">
                <button className='correct' onClick={() => handleFeedback(true)}>答對了！</button>
                <button className='incorrect' onClick={() => handleFeedback(false)}>答錯了</button>
              </div>
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
  );
}

export default QuizMode;
