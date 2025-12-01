# Supabase Edge Functions

## send-push-notification

복약 미복용 시 자녀에게 푸시 알림을 보내는 Edge Function입니다.

### 기능
- 부모가 약 복용을 건너뛸 때 자녀에게 푸시 알림 전송
- Expo Push API 사용
- 알림 설정에 따라 선택적 전송

### 배포 방법

1. **Supabase CLI 설치**
```bash
npm install -g supabase
```

2. **Supabase 로그인**
```bash
supabase login
```

3. **프로젝트 연결**
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. **Edge Function 배포**
```bash
supabase functions deploy send-push-notification
```

### 환경 변수
Edge Function은 다음 환경 변수를 자동으로 사용합니다:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (RLS 우회)

### API 요청 형식
```json
{
  "parent_id": "부모 UUID",
  "medication_name": "약 이름",
  "scheduled_time": "예정 시간 (ISO 8601)",
  "skip_reason": "건너뛰기 사유 (선택)",
  "event_id": "이벤트 UUID"
}
```

### 응답 형식
```json
{
  "success": true,
  "sent_count": 1,
  "expo_response": { ... }
}
```

### 테스트
```bash
# 로컬 테스트
supabase functions serve send-push-notification

# curl로 테스트
curl -X POST 'http://localhost:54321/functions/v1/send-push-notification' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"parent_id": "...", "medication_name": "테스트약", ...}'
```
