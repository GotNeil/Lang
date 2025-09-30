import React, { useRef, useEffect } from 'react';
import './QuizList.css'; // Renamed CSS file

function QuizList({ list, mode, currentIndex, onWordSelect, allowSidebarScroll }) {
  const currentItemRef = useRef(null);

  useEffect(() => {
    if (allowSidebarScroll && currentItemRef.current) {
      currentItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex, allowSidebarScroll]);

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
}

export default QuizList;