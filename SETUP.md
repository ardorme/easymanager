# EasyManager - Supabase 설정 가이드 (빠르고 무료!)

## 🚀 왜 Supabase?

- ⚡ **매우 빠름**: 실시간 데이터베이스
- 💰 **완전 무료**: 500MB DB, 5GB 저장소
- 🌍 **Vercel 불필요**: 어디서나 사용 가능
- 🔄 **실시간 동기화**: 즉시 반영

---

## 📦 1. Supabase 프로젝트 생성 (5분)

### 1-1. 계정 생성
1. [https://supabase.com](https://supabase.com) 접속
2. **Start your project** 클릭
3. GitHub 계정으로 로그인 (추천) 또는 이메일로 가입

### 1-2. 프로젝트 생성
1. **New Project** 클릭
2. 정보 입력:
   - **Name**: `easymanager` (원하는 이름)
   - **Database Password**: 강력한 비밀번호 입력 (저장 필수!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (가장 빠름)
   - **Pricing Plan**: Free 선택
3. **Create new project** 클릭
4. 2-3분 대기 (프로젝트 생성 중...)

---

## 🗄️ 2. 데이터베이스 테이블 생성

### 2-1. SQL Editor 열기
프로젝트 대시보드에서:
1. 왼쪽 메뉴 → **SQL Editor** 클릭
2. **New query** 클릭

### 2-2. 테이블 생성 SQL 실행
아래 SQL을 복사하여 붙여넣고 **Run** 클릭:

```sql
-- responses 테이블 생성
CREATE TABLE responses (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  answers JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_responses_user_id ON responses(user_id);
CREATE INDEX idx_responses_date ON responses(date);

-- RLS (Row Level Security) 비활성화 (개발 편의)
ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
```

✅ **Success. No rows returned** 메시지가 나오면 성공!

---

## 🔐 3. API 키 복사

### 3-1. API 설정 페이지 열기
1. 왼쪽 메뉴 → **Settings** (⚙️ 아이콘)
2. **API** 클릭

### 3-2. 키 복사
다음 두 값을 복사:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (매우 긴 문자열)

---

## 💻 4. 로컬 환경 설정

### 4-1. `.env.local` 파일 수정
프로젝트 루트의 `.env.local` 파일을 열고:

```bash
# 변경 전
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 변경 후 (복사한 값 붙여넣기)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4-2. 패키지 설치
```bash
npm install
```

### 4-3. 개발 서버 실행
```bash
npm run dev
```

---

## ✅ 5. 테스트

1. http://localhost:3000 접속
2. 로그인 후 데이터 저장
3. **즉시 반영됨** ⚡

### 데이터 확인 (Supabase에서)
1. Supabase 대시보드
2. **Table Editor** 클릭
3. **responses** 테이블 선택
4. 저장된 데이터 확인

---

## 🌐 6. Vercel 배포 설정

### 6-1. Vercel 환경 변수 추가
1. [Vercel Dashboard](https://vercel.com/dashboard)
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 다음 두 변수 추가:

```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxx.supabase.co

Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. **Save** 클릭

### 6-2. 배포
```bash
git add .
git commit -m "Supabase로 전환 - 빠른 성능"
git push
```

Vercel이 자동으로 재배포합니다!

---

## 🔍 트러블슈팅

### ❌ "Invalid API key" 에러
**해결**:
1. `.env.local` 파일 확인
2. anon key가 완전히 복사되었는지 확인 (매우 김)
3. 따옴표 없이 키만 입력되어 있는지 확인
4. 서버 재시작: `Ctrl+C` → `npm run dev`

### ❌ "relation 'responses' does not exist"
**해결**:
1. SQL Editor로 이동
2. 테이블 생성 SQL 다시 실행
3. 테이블 생성 확인: Table Editor → responses 테이블 있는지 확인

### ❌ 데이터가 저장되지 않음
**해결**:
1. Table Editor에서 데이터 확인
2. RLS가 비활성화되었는지 확인:
   ```sql
   ALTER TABLE responses DISABLE ROW LEVEL SECURITY;
   ```

### ❌ Vercel 배포 후 작동 안 함
**해결**:
1. Vercel → Settings → Environment Variables
2. 두 변수가 모두 추가되었는지 확인
3. Deployments → 최신 배포 → Redeploy

---

## 📊 성능 비교

| 방법 | 저장 속도 | 읽기 속도 | 실시간 |
|------|-----------|-----------|--------|
| 파일 시스템 | ❌ Vercel 불가 | - | ❌ |
| Vercel Blob | 🐢 느림 (3-5초) | 🐢 느림 | ❌ |
| **Supabase** | ⚡ **즉시 (<500ms)** | ⚡ **즉시** | ✅ |

---

## 💡 Supabase 추가 기능

나중에 필요하면 사용 가능:
- 🔐 **인증 시스템**: 이메일, SNS 로그인
- 📊 **실시간 구독**: 데이터 변경 즉시 감지
- 📁 **파일 저장소**: 이미지, 문서 저장
- 🔍 **전문 검색**: 빠른 검색 기능

---

## 🎯 체크리스트

- [ ] Supabase 계정 생성
- [ ] 프로젝트 생성 (Seoul 리전)
- [ ] SQL Editor에서 테이블 생성
- [ ] API 키 복사
- [ ] `.env.local` 파일 수정
- [ ] `npm install` 실행
- [ ] `npm run dev` 실행
- [ ] 로컬에서 저장 테스트
- [ ] Vercel 환경 변수 추가
- [ ] `git push`로 배포

---

## 🆘 추가 지원

**문제가 있으면:**
1. [Supabase 문서](https://supabase.com/docs)
2. [Supabase Discord](https://discord.supabase.com)

---

## ✨ 완료!

이제 **매우 빠른 데이터 저장**이 가능합니다!

- ⚡ 저장/읽기 즉시 반영
- 🌍 전 세계 어디서나 빠름
- 💰 완전 무료
- 🔄 실시간 업데이트 가능

🎉 **즐거운 개발 되세요!**
