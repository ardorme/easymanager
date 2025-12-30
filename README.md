# 강점 활용 일지 - Easy Manager

Vercel에 호스팅 가능한 간단한 강점 활용 체크 웹 애플리케이션입니다.

## 주요 기능

1. **로그인 기능**
   - JSON 파일 기반 사용자 관리
   - 사용자별 이름/ID/비밀번호/5개 강점 레이블 관리
   - 관리자/일반 사용자 역할 구분

2. **일일 강점 체크**
   - 날짜 선택 (설정된 기간 내에서만 가능)
   - 하루 1회 응답 (같은 날짜 재작성 시 기존 응답 업데이트)
   - 5개 강점 항목에 대한 **1~10점** 평가
   - 질문: "나의 강점을 얼마나 활용하셨나요?"

3. **기간 설정**
   - `config.json`에서 날짜 선택 가능 기간 설정
   - from ~ to 범위 지정

4. **응답 조회**
   - 일반 사용자: 본인 응답만 조회
   - 관리자: 전체 사용자 응답 조회
   - **날짜별 오름차순 정렬** (빠른 날짜가 먼저)

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

개발 서버는 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## 테스트 계정

- **관리자**: admin / admin123 (강점: 최상화 공감 책임 배움 절친)
- **김철수**: user1 / user123 (강점: 최상화 공감 책임 배움 절친)
- **이영희**: user2 / user123 (강점: 최상화 공감 책임 배움 절친)

## Vercel 배포

1. GitHub에 코드 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 import
3. 자동 배포 완료

또는 Vercel CLI 사용:

```bash
npm install -g vercel
vercel
```

## 파일 구조

```
easymanager/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── login/route.ts       # 로그인 API
│   │   │   ├── questions/route.ts   # 질문 조회 API
│   │   │   ├── config/route.ts      # 설정 조회 API
│   │   │   └── responses/route.ts   # 응답 저장/조회 API
│   │   ├── globals.css              # 글로벌 스타일
│   │   ├── layout.tsx               # 레이아웃
│   │   └── page.tsx                 # 메인 페이지
│   └── data/
│       ├── users.json               # 사용자 데이터 (이름, ID, PW, 5개 강점 레이블)
│       ├── questions.json           # 질문 데이터
│       ├── config.json              # 기간 설정 (from~to)
│       └── responses.json           # 응답 데이터 (날짜별 5개 강점 점수 1-10점)
├── package.json
├── tsconfig.json
└── next.config.js
```

## 설정 파일

### 사용자 추가/수정 (`src/data/users.json`)

```json
{
  "users": [
    {
      "id": "newuser",
      "password": "password123",
      "name": "새 사용자",
      "labels": "최상화 공감 책임 배움 절친",
      "role": "user"
    }
  ]
}
```

**중요**: 
- `labels`는 공백(whitespace)으로 구분된 강점 항목입니다
- 각 사용자마다 다른 레이블을 설정할 수 있습니다

### 기간 설정 (`src/data/config.json`)

```json
{
  "period": {
    "from": "2025-01-01",
    "to": "2025-12-31"
  }
}
```

날짜 선택 시 이 기간 내에서만 선택 가능합니다.

### 질문 수정 (`src/data/questions.json`)

```json
{
  "question": "나의 강점을 얼마나 활용하셨나요?"
}
```

## 데이터 구조

### 응답 데이터 예시
```json
{
  "userId": "user1",
  "userName": "김철수",
  "date": "2025-01-15",
  "scores": [
    { "label": "최상화", "score": 8 },
    { "label": "공감", "score": 7 },
    { "label": "책임", "score": 9 },
    { "label": "배움", "score": 6 },
    { "label": "절친", "score": 8 }
  ],
  "timestamp": "2025-01-15T14:30:00.000Z"
}
```

**점수 범위**: 1~10점

## 주요 변경사항

- ✅ 점수 범위: 1~5점 → **1~10점**
- ✅ 정렬: 날짜별 **오름차순 정렬** (빠른 날짜 먼저)
- ✅ 기간 설정: `config.json`에서 **from~to** 기간 지정

## 주의사항

- 실제 운영 환경에서는 비밀번호를 암호화해야 합니다
- 파일 기반 저장소는 동시성 문제가 있을 수 있으니, 트래픽이 많은 경우 데이터베이스 사용을 권장합니다
- Vercel의 서버리스 환경에서 파일 쓰기는 임시 디렉토리에만 가능하므로, 실제 운영시 데이터베이스(예: Vercel Postgres, MongoDB 등) 사용을 권장합니다

## 라이선스

MIT
