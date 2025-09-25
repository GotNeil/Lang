import React, { useState, useEffect } from 'react';

function Settings({ settings, onSave, onBack, voices, selectedVoice }) {
  const [numQuestions, setNumQuestions] = useState(settings.numQuestions);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(settings.autoAdvanceDelay);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(settings.autoAdvanceEnabled);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState(settings.selectedVoiceURI);

  useEffect(() => {
    // When the selectedVoice from props changes (e.g., on initial load),
    // update the local state if it hasn't been set from saved settings.
    if (!selectedVoiceURI && selectedVoice) {
      setSelectedVoiceURI(selectedVoice.voiceURI);
    }
  }, [selectedVoice, selectedVoiceURI]);


  const handleSave = () => {
    onSave({
      numQuestions: parseInt(numQuestions, 10),
      autoAdvanceDelay: parseInt(autoAdvanceDelay, 10),
      autoAdvanceEnabled,
      selectedVoiceURI: selectedVoiceURI,
    });
  };

  return (
    <div className="settings-page">
      <h2>設定</h2>
      <div className="setting-item">
        <label htmlFor="voice-select">選擇語音</label>
        <select
          id="voice-select"
          value={selectedVoiceURI || ''}
          onChange={(e) => setSelectedVoiceURI(e.target.value)}
          disabled={voices.length === 0}
        >
          {voices.length > 0 ? (
            voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {`${voice.name} (${voice.lang})`}
              </option>
            ))
          ) : (
            <option>讀取語音中...</option>
          )}
        </select>
      </div>
      <div className="setting-item">
        <label htmlFor="numQuestions">每次考題多少題目 (-1 ~ 1000, -1 為全部)</label>
        <input 
          type="number"
          id="numQuestions"
          value={numQuestions}
          min="-1"
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
