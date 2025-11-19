# Supabase 데이터베이스 설정 가이드

## 📋 마이그레이션 실행 방법

### 1단계: SQL Editor 열기
1. Supabase 대시보드 (https://supabase.com/dashboard)
2. 왼쪽 메뉴에서 **🔧 SQL Editor** 클릭
3. 오른쪽 상단 **+ New query** 클릭

### 2단계: 마이그레이션 순서대로 실행

#### Migration 001: 기본 스키마 생성
1. `supabase/migrations/001_initial_schema.sql` 파일 열기
2. 전체 내용 복사 (Cmd+A, Cmd+C)
3. SQL Editor에 붙여넣기 (Cmd+V)
4. 오른쪽 하단 **RUN** 버튼 클릭 (또는 Cmd+Enter)
5. ✅ "Success. No rows returned" 확인

**생성되는 테이블:**
- `users` - 사용자 정보 (부모/자녀)
- `medications` - 복약 정보
- `medication_logs` - 복약 기록
- `family_connections` - 가족 연결
- `appointments` - 병원 예약

#### Migration 002: RLS 정책 적용
1. `supabase/migrations/002_enable_rls.sql` 파일 열기
2. 전체 내용 복사
3. **New query** 클릭 (새 쿼리 탭 열기)
4. SQL Editor에 붙여넣기
5. **RUN** 클릭
6. ✅ "Success" 확인

**적용되는 보안 정책:**
- 사용자는 자신의 데이터만 조회/수정 가능
- 자녀는 연결된 부모의 데이터 조회 가능
- 초대 코드 시스템으로 가족 연결 관리

#### Migration 003: 헬퍼 함수 생성
1. `supabase/migrations/003_helper_functions.sql` 파일 열기
2. 전체 내용 복사
3. **New query** 클릭
4. SQL Editor에 붙여넣기
5. **RUN** 클릭
6. ✅ "Success" 확인

**생성되는 함수:**
- `generate_invitation_code()` - 6자리 초대 코드 생성
- `calculate_adherence_rate()` - 복약 준수율 계산
- `get_todays_medications()` - 오늘의 복약 일정 조회

### 3단계: 테이블 확인
1. 왼쪽 메뉴에서 **📊 Table Editor** 클릭
2. 다음 테이블들이 보이는지 확인:
   - users
   - medications
   - medication_logs
   - family_connections
   - appointments

### 4단계: Authentication 설정
1. 왼쪽 메뉴에서 **🔐 Authentication** 클릭
2. **Settings** 탭 클릭
3. **Email Auth** 활성화 확인
4. **Auto Confirm Users** ON (개발 단계에서 편의를 위해)
5. **Save** 클릭

## ✅ 설정 완료 체크리스트

- [ ] Migration 001 실행 완료
- [ ] Migration 002 실행 완료
- [ ] Migration 003 실행 완료
- [ ] Table Editor에서 5개 테이블 확인
- [ ] Authentication Email Auth 활성화

## 🔧 문제 해결

### 에러: "relation already exists"
- 이미 테이블이 존재합니다
- Table Editor에서 해당 테이블 삭제 후 다시 실행

### 에러: "permission denied"
- SQL Editor에서 실행 중인지 확인
- 프로젝트 소유자 권한인지 확인

### 에러: "function already exists"
- 정상입니다! 함수가 이미 생성되어 있습니다
- 다음 단계로 진행하세요

## 📚 다음 단계

마이그레이션 완료 후:
1. 앱에서 회원가입 테스트
2. 복약 정보 추가 테스트
3. 가족 연결 테스트

문제가 있으면 알려주세요!
