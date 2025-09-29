import React from 'react';

function About({ onBack }) {
  return (
    <div className="about-page">
      <h2>✨ 這是專門為我家人設計的日文旅遊小幫手！</h2>
      <p>👨‍👩‍👧‍👦 <strong>設計初衷：</strong> 這個小辭典是做給我的老媽，在旅遊時使用的，希望讓溝通更順暢、購物更方便！</p>
      <p>🗣️ <strong>使用建議：</strong> 建議開啟預設「辭典」模式。可以使用它練習發音 🗣️，也可以直接展示給店員看👩‍💼一指搞定！</p>
      <p>🚨 <strong>使用提醒：</strong> 題庫是我自己跑AI建立的，我也不會日文，但我發現他有約3-5%錯誤，大家還是要留意 </p>
      <p>💡 <strong>詞庫擴充：</strong> 如果您有新的詞彙想加入辭庫 📚，請聯繫我（thread： nice.n1999）我可以直接幫你擴充！</p>
      
      <button onClick={onBack}>返回</button>
    </div>
  );
}

export default About;
