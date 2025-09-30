import React, { useState } from 'react';
import './CopyableText.css';

function CopyableText({ text, children }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="copyable-text-container">
      {children}
      <button onClick={handleCopy} className="copy-button">
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

export default CopyableText;
