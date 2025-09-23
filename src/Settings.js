import React, { useState } from 'react';

function Settings({ settings, onSave, onBack }) {
  const [numQuestions, setNumQuestions] = useState(settings.numQuestions);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(settings.autoAdvanceDelay);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(settings.autoAdvanceEnabled);

  const handleSave = () => {
    onSave({
      numQuestions: parseInt(numQuestions, 10),
      autoAdvanceDelay: parseInt(autoAdvanceDelay, 10),
      autoAdvanceEnabled,
    });
  };

  return (
    <div className="settings-page">
      <h2>設定</h2>
      <div className="setting-item">
        <label htmlFor="numQuestions">每次考題多少題目 (1-1000)</label>
        <input 
          type="number"
          id="numQuestions"
          value={numQuestions}
          min="1"
          max="1000"
          onChange={(e) => setNumQuestions(e.target.value)}
        />
      </div>
      <div className="setting-item">
        <label htmlFor="autoAdvanceDelay">自動轉下一題為幾秒 (1-20)</label>
        <input 
          type="number"
          id="autoAdvanceDelay"
          value={autoAdvanceDelay}
          min="1"
          max="20"
          onChange={(e) => setAutoAdvanceDelay(e.target.value)}
        />
      </div>
      <div className="setting-item">
        <label>開啟答題後自動轉到下一題</label>
        <div className="radio-group">
          <React.Fragment>
            <input 
              type="radio" 
              id="autoAdvanceYes"
              name="autoAdvanceEnabled" 
              value="yes"
              checked={autoAdvanceEnabled === true}
              onChange={() => setAutoAdvanceEnabled(true)}
            />
            <label htmlFor="autoAdvanceYes">是</label>
          </React.Fragment>
          <React.Fragment>
            <input 
              type="radio" 
              id="autoAdvanceNo"
              name="autoAdvanceEnabled" 
              value="no"
              checked={autoAdvanceEnabled === false}
              onChange={() => setAutoAdvanceEnabled(false)}
            />
            <label htmlFor="autoAdvanceNo">否</label>
          </React.Fragment>
        </div>
      </div>
      <div className="settings-controls">
        <button onClick={handleSave}>儲存</button>
        <button onClick={onBack}>返回</button>
      </div>
    </div>
  );
}

export default Settings;
