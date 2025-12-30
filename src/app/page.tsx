'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  labels: string;
  role: string;
}

interface LabelScore {
  label: string;
  score: number;
}

interface Response {
  userId: string;
  userName: string;
  date: string;
  scores: LabelScore[];
  timestamp: string;
}

interface Config {
  period: {
    from: string;
    to: string;
  };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [question, setQuestion] = useState('');
  const [config, setConfig] = useState<Config | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentView, setCurrentView] = useState<'form' | 'results'>('form');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (user) {
      loadQuestion();
      loadResponses();
      // 사용자의 레이블로 점수 초기화
      const labels = user.labels.split(' ');
      const initialScores: { [key: string]: number } = {};
      labels.forEach(label => {
        initialScores[label] = 0;
      });
      setScores(initialScores);
    }
  }, [user]);

  // 날짜 변경 시 해당 날짜의 기존 점수 불러오기
  useEffect(() => {
    if (user && selectedDate && currentView === 'form') {
      loadScoresForDate(selectedDate);
    }
  }, [selectedDate, user, currentView]);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch (error) {
      console.error('설정을 불러오는데 실패했습니다.');
    }
  };

  const loadQuestion = async () => {
    try {
      const res = await fetch('/api/questions');
      const data = await res.json();
      setQuestion(data.question);
    } catch (error) {
      showMessage('error', '질문을 불러오는데 실패했습니다.');
    }
  };

  const loadResponses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/responses?userId=${user.id}&role=${user.role}`);
      const data = await res.json();
      // 날짜별 최신순 정렬 (빠른 날짜가 먼저)
      const sortedResponses = (data.responses || []).sort((a: Response, b: Response) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      setResponses(sortedResponses);
    } catch (error) {
      showMessage('error', '응답을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 특정 날짜의 점수 불러오기
  const loadScoresForDate = async (date: string) => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/responses?userId=${user.id}&role=${user.role}`);
      const data = await res.json();
      
      // 선택한 날짜의 응답 찾기
      const dateResponse = data.responses?.find((r: Response) => r.date === date && r.userId === user.id);
      
      if (dateResponse) {
        // 기존 점수가 있으면 불러오기
        const loadedScores: { [key: string]: number } = {};
        dateResponse.scores.forEach((s: LabelScore) => {
          loadedScores[s.label] = s.score;
        });
        setScores(loadedScores);
      } else {
        // 기존 점수가 없으면 초기화
        const labels = user.labels.split(' ');
        const initialScores: { [key: string]: number } = {};
        labels.forEach(label => {
          initialScores[label] = 0;
        });
        setScores(initialScores);
      }
    } catch (error) {
      console.error('점수를 불러오는데 실패했습니다.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loginId, password: loginPassword }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        showMessage('success', `환영합니다, ${data.user.name}님!`);
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', '로그인 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setLoginId('');
    setLoginPassword('');
    setScores({});
    setResponses([]);
    setCurrentView('form');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    // useEffect에서 자동으로 loadScoresForDate 호출됨
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    // 선택된 날짜가 설정된 기간 내에 있는지 확인
    if (config) {
      const selected = new Date(selectedDate);
      const from = new Date(config.period.from);
      const to = new Date(config.period.to);
      
      if (selected < from || selected > to) {
        showMessage('error', `날짜는 ${config.period.from}부터 ${config.period.to} 사이여야 합니다.`);
        return;
      }
    }
    
    // 모든 레이블에 대한 점수가 입력되었는지 확인
    const labels = user.labels.split(' ');
    const allScored = labels.every(label => scores[label] && scores[label] > 0);
    
    if (!allScored) {
      showMessage('error', '모든 항목에 점수를 입력해주세요.');
      return;
    }
    
    const scoresArray = labels.map(label => ({
      label,
      score: scores[label],
    }));
    
    const response = {
      userId: user.id,
      userName: user.name,
      date: selectedDate,
      scores: scoresArray,
      timestamp: new Date().toISOString(),
    };
    
    try {
      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      });
      
      const data = await res.json();
      
      if (data.success) {
        showMessage('success', '응답이 성공적으로 저장되었습니다!');
        loadResponses();
      } else {
        showMessage('error', data.message);
      }
    } catch (error) {
      showMessage('error', '응답 저장 중 오류가 발생했습니다.');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 점수에 따른 배경색 계산 (1~10점) - 스타벅스 녹색 사용
  const getScoreColor = (score: number): string => {
    if (!score || score < 1) return '#ffffff';
    
    // 1-5: 빨강 파스텔 톤 (진한 빨강 -> 연한 빨강)
    // 5: 흰색에 가까움
    // 6-10: 스타벅스 녹색 파스텔 톤 (연한 녹색 -> 진한 스타벅스 녹색)
    
    if (score <= 5) {
      // 1점: 진한 빨강 파스텔 (#ffcccc)
      // 5점: 흰색에 가까운 연한 빨강 (#fff5f5)
      const intensity = (5 - score) / 4; // 1점=1, 5점=0
      const r = 255;
      const g = Math.floor(255 - (intensity * 51)); // 204~255
      const b = Math.floor(255 - (intensity * 51)); // 204~255
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // 스타벅스 녹색: #00704A (R:0, G:112, B:74)
      // 6점: 흰색에 가까운 연한 스타벅스 녹색
      // 10점: 진한 스타벅스 녹색 파스텔
      const intensity = (score - 5) / 5; // 6점=0.2, 10점=1
      
      // 연한 파스텔(#e6f4ef)에서 진한 파스텔(#b3e0d1)로
      const r = Math.floor(230 - (intensity * 51)); // 230 -> 179
      const g = Math.floor(244 - (intensity * 20)); // 244 -> 224
      const b = Math.floor(239 - (intensity * 30)); // 239 -> 209
      
      return `rgb(${r}, ${g}, ${b})`;
    }
  };

  // Excel 형식 테이블 데이터 준비 (X축: 레이블, Y축: 날짜)
  const prepareTableData = () => {
    if (!user || responses.length === 0) return null;
    
    const labels = user.labels.split(' ');
    
    // 날짜별로 점수 맵핑
    const dataByDate: { [date: string]: { userName?: string; scores: { [label: string]: number } } } = {};
    responses.forEach(response => {
      dataByDate[response.date] = {
        userName: response.userName,
        scores: {}
      };
      response.scores.forEach(score => {
        dataByDate[response.date].scores[score.label] = score.score;
      });
    });
    
    return { labels, responses, dataByDate };
  };

  if (!user) {
    return (
      <div className="container">
        <div className="header">
          <h1>💪 강점 활용 일지</h1>
          <p>나의 강점을 매일 체크하세요</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>아이디</label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>
          
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.text}
            </div>
          )}
          
          <button type="submit" className="btn btn-primary">
            로그인
          </button>
        </form>
        
        <div style={{ marginTop: '20px', padding: '16px', background: '#f0f9ff', borderRadius: '8px' }}>
          <p style={{ fontSize: '0.9rem', color: '#0369a1', marginBottom: '8px' }}>
            <strong>테스트 계정:</strong>
          </p>
          <p style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>
            관리자: admin / admin123<br />
            김철수: user1 / user123<br />
            이영희: user2 / user123
          </p>
        </div>
      </div>
    );
  }

  const labels = user.labels.split(' ');
  const tableData = prepareTableData();

  return (
    <div className="container">
      <div className="header">
        <h1>💪 강점 활용 일지</h1>
        <p>나의 강점을 매일 체크하세요</p>
      </div>
      
      <div className="user-info">
        <div>
          <span>{user.name}님</span>
          {user.role === 'admin' && (
            <span style={{ marginLeft: '10px', fontSize: '0.85rem', padding: '4px 8px', background: '#667eea', color: 'white', borderRadius: '4px' }}>
              관리자
            </span>
          )}
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto', padding: '8px 16px', marginTop: 0 }}>
          로그아웃
        </button>
      </div>
      
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setCurrentView('form')}
          className={`btn ${currentView === 'form' ? 'btn-primary' : 'btn-secondary'}`}
        >
          오늘의 체크
        </button>
        <button
          onClick={() => {
            setCurrentView('results');
            loadResponses();
          }}
          className={`btn ${currentView === 'results' ? 'btn-primary' : 'btn-secondary'}`}
        >
          {user.role === 'admin' ? '전체 결과 보기' : '내 기록 보기'}
        </button>
      </div>
      
      {currentView === 'form' ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>날짜 선택</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={config?.period.from}
              max={config?.period.to}
              required
            />
            {config && (
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>
                선택 가능 기간: {config.period.from} ~ {config.period.to}
              </p>
            )}
          </div>
          
          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
            <h3 style={{ color: '#333', marginBottom: '20px', fontSize: '1.1rem' }}>
              {question}
            </h3>
            
            {labels.map((label) => (
              <div key={label} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '16px',
                gap: '16px'
              }}>
                <label style={{ 
                  fontSize: '1rem', 
                  fontWeight: 600,
                  color: '#333',
                  minWidth: '100px',
                  margin: 0
                }}>
                  {label}
                  {scores[label] > 0 && (
                    <span style={{ 
                      marginLeft: '8px', 
                      fontSize: '0.85rem', 
                      color: '#667eea',
                      fontWeight: 'normal'
                    }}>
                      ({scores[label]}점)
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      type="button"
                      className={`rating-btn ${scores[label] === score ? 'active' : ''}`}
                      onClick={() => setScores({ ...scores, [label]: score })}
                      style={{ fontSize: '1rem' }}
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button type="submit" className="btn btn-primary">
            제출하기
          </button>
        </form>
      ) : (
        <div className="responses-list">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ color: '#333', marginBottom: '8px' }}>
              {user.role === 'admin' ? '전체 응답 결과' : '내 기록'}
            </h2>
            <p style={{ fontSize: '1rem', color: '#667eea', fontWeight: 600 }}>
              {question}
            </p>
          </div>
          
          {loading ? (
            <div className="loading">로딩 중...</div>
          ) : responses.length === 0 ? (
            <div className="empty-state">
              <p>아직 등록된 응답이 없습니다.</p>
            </div>
          ) : tableData ? (
            <div className="table-container">
              <table className="excel-table">
                <thead>
                  <tr>
                    <th className="date-column">날짜</th>
                    {tableData.labels.map((label, idx) => (
                      <th key={idx} className="label-column">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.responses.map((response, dateIdx) => (
                    <tr key={dateIdx}>
                      <td className="date-cell">
                        {response.date}
                        {user.role === 'admin' && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#666', marginTop: '2px' }}>
                            {response.userName}
                          </div>
                        )}
                      </td>
                      {tableData.labels.map((label, labelIdx) => {
                        const score = tableData.dataByDate[response.date]?.scores[label];
                        return (
                          <td 
                            key={labelIdx} 
                            className="score-cell"
                            style={{ 
                              backgroundColor: score ? getScoreColor(score) : '#ffffff',
                              transition: 'background-color 0.3s'
                            }}
                          >
                            {score || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* 색상 범례 */}
              <div style={{ 
                marginTop: '20px', 
                padding: '16px', 
                background: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: getScoreColor(1),
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>낮음 (1-3점)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: getScoreColor(5),
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>중간 (4-6점)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: getScoreColor(10),
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px'
                  }} />
                  <span style={{ fontSize: '0.9rem', color: '#666' }}>높음 (7-10점)</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
