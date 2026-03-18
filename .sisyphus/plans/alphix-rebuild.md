# Alphix — 한국/미국 주식 + 암호화폐 자동매매 SaaS 전체 재구축

## TL;DR

> **Quick Summary**: 기존 Alphix 프로젝트를 Next.js 15 + Supabase + shadcn/ui 스택으로 처음부터 재구축. 6개 브로커, 6개 전략, 백테스팅, 리스크관리, PWA, 텔레그램봇, 요금제를 포함한 완전한 SaaS 플랫폼을 TDD 방식으로 개발.
> 
> **Deliverables**:
> - Turborepo 모노레포 (trading-engine, web, shared 패키지)
> - 6개 브로커 어댑터 (KIS, KIS해외, Alpaca, 키움, Binance, Upbit)
> - 6개 전략 엔진 (MA, RSI, 볼린저, MACD, 그리드, AI)
> - 고급 백테스팅 엔진 (수수료, 슬리피지, 멀티타임프레임)
> - Next.js 15 SaaS 대시보드 (8개 페이지 + 16개 API 라우트)
> - Supabase Auth + RLS + PostgreSQL 데이터 레이어
> - 토스페이먼츠 구독 결제
> - PWA + 텔레그램 봇 + 모니터링/알림
> 
> **Estimated Effort**: XL (대규모 프로젝트)
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Scaffolding → Shared Types → Broker Adapters → Engine Modules → Integration → Verification

---

## Context

### Original Request
기존 Alphix 프로젝트(https://github.com/Gangnamhaha/auto-trading-saas)를 참고하여 주식 자동매매 프로그램을 처음부터 새로 구축. 기존 기능 전체 재구축 + 6대 개선 포인트.

### Interview Summary
**Key Discussions**:
- **범위**: 전체 재구축 (6브로커, 6전략, 백테스팅, PWA, 텔레그램, 요금제 등 모든 기능)
- **프레임워크**: Next.js 14 → Next.js 15 업그레이드
- **DB**: Supabase (PostgreSQL + Auth + RLS) 신규 도입
- **UI**: shadcn/ui + Tailwind CSS
- **결제**: 토스페이먼츠 (한국 결제 특화)
- **테스트**: TDD (RED-GREEN-REFACTOR)
- **브랜딩**: Alphix 이름 유지
- **위치**: ~/projects/alphix/

**Research Findings**:
- 기존 Alphix: Turborepo 모노레포, 120+ 테스트, AES-256-GCM 보안, 회로차단기
- 기존 아키텍처: packages/(trading-engine, web, shared) 3패키지 구조
- 라이브 사이트: 랜딩, 대시보드, 전략, 백테스팅, 관리자, 베타 모집

### Metis Review
**Identified Gaps** (addressed):
- KIS API 인증 흐름 (토큰 리프레시, Rate Limit) → 브로커 어댑터에 재시도 로직 포함
- Supabase + Next.js 15 호환성 → Wave 1에서 검증
- 키움증권 Windows 의존성 → Windows 프록시 패턴으로 해결
- 시장 운영 시간 차이 → 트레이딩 데몬에 시장별 스케줄러 포함
- 동시 주문 처리 → Order Management에 낙관적 잠금 + 중복 방지
- 환경변수 관리 (다수 브로커 API 키) → Supabase + AES-256-GCM 암호화

---

## Work Objectives

### Core Objective
기존 Alphix의 모든 기능을 Next.js 15 + Supabase 기반으로 완전히 재구축하되, UI/UX, 엔진 안정성, 실시간 데이터, 백테스팅, 모니터링, 코드 품질의 6가지 영역에서 근본적 개선을 이루는 것.

### Concrete Deliverables
- `~/projects/alphix/` 에 Turborepo 모노레포
- `packages/shared/` — 타입, 인터페이스, 유틸, 암호화, DB 스키마
- `packages/trading-engine/` — 브로커, 전략, 백테스팅, 리스크, 데몬
- `packages/web/` — Next.js 15 SaaS 대시보드 + API 라우트
- Supabase 프로젝트 (테이블, RLS, Auth 설정)
- Vercel 배포 설정
- 120+ 테스트 (TDD)

### Definition of Done
- [ ] `bun install` 후 `bun run dev` → localhost:3000에서 전체 앱 동작
- [ ] `bun run test` → 120+ 테스트 전체 PASS
- [ ] `bun run build` → 빌드 에러 없이 완료
- [ ] 모든 브로커 어댑터 페이퍼 모드 동작 확인
- [ ] 모든 전략 백테스트 실행 가능
- [ ] 로그인/회원가입 → 대시보드 진입 흐름 정상
- [ ] 토스페이먼츠 테스트 모드 결제 성공
- [ ] PWA 설치 + 푸시 알림 동작

### Must Have
- 6개 브로커 어댑터 (통일된 BrokerAdapter 인터페이스)
- 6개 전략 (통일된 Strategy 인터페이스)
- TDD: 모든 엔진 모듈 테스트 선행
- AES-256-GCM API 키 암호화
- 회로차단기 (일일 손실 한도, 최대 포지션 제한)
- 30일 페이퍼 트레이딩 의무 기간
- Supabase RLS로 사용자별 데이터 격리
- 반응형 UI (모바일/데스크톱)

### Must NOT Have (Guardrails)
- 네이티브 모바일 앱 (PWA로 충분)
- 자체 호스팅 인프라 (웹: Vercel 서버리스, 트레이딩 엔진: 로컬/Railway/Fly.io 상시 프로세스 허용. 데몬은 장시간 실행이 필수이므로 서버리스 제외)
- 과도한 추상화 (3레이어 이상의 inheritance 금지)
- AI 슬롭: 불필요한 주석, `as any`, `@ts-ignore`, empty catch blocks
- 하드코딩된 API 키 또는 시크릿 (환경변수 + 암호화만)
- `console.log` 프로덕션 코드 (structured logging만)
- 브로커 API 직접 호출 (반드시 어댑터 패턴 경유)
- 전략 로직 내 부수효과 (순수 함수 유지)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (신규 설정)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: bun test (Bun 내장 테스트 러너)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **TUI/CLI**: Use interactive_bash (tmux) — Run command, send keystrokes, validate output
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Library/Module**: Use Bash (bun REPL / bun test) — Import, call functions, compare output

### External Service QA Boundary (CRITICAL)
외부 서비스 연동 테스트의 범위를 명확히 정의:

| 서비스 | 개별 태스크 QA | Final QA (F3) |
|--------|--------------|---------------|
| 6개 브로커 API | **Mock만** (모든 HTTP 호출 mock) | **Mock** (실제 브로커 계정 불필요) |
| Supabase Auth | **로컬 Supabase** (`npx supabase start`) | **로컬 Supabase** |
| 토스페이먼츠 | **Mock** (SDK 호출 mock) | **토스 테스트 모드** (테스트 키 `.env.test`에 필요) |
| 텔레그램 봇 | **Mock** (Telegram API mock) | **Mock** (봇 토큰 불필요) |
| AI (GPT/Claude) | **Mock** (LLM 응답 하드코딩) | **Mock** |
| WebSocket | **Mock WebSocket** | **Mock** |

**테스트 환경 프로비저닝** (Task 1 스캐폴딩에 포함):
- `.env.example` 에 모든 필요 환경변수 나열
- `.env.test` 에 mock/테스트 값 제공 (실제 키 불필요):
  ```
  SUPABASE_URL=http://localhost:54321
  SUPABASE_ANON_KEY=<로컬 supabase 키>
  TOSS_CLIENT_KEY=test_ck_...
  TOSS_SECRET_KEY=test_sk_...
  ENCRYPTION_KEY=test-32-byte-encryption-key-here!
  ```
- 로컬 Supabase 개발 환경: `npx supabase init && npx supabase start`
- F3 QA는 위 `.env.test` 기반으로 동작. 실제 외부 API 호출 없음 (토스 테스트 모드 제외).

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 7 tasks, ALL parallel, start immediately):
├── Task 1: Turborepo + Next.js 15 + Bun 프로젝트 스캐폴딩 [quick]
├── Task 2: Supabase 프로젝트 셋업 (스키마 + RLS + Auth) [unspecified-high]
├── Task 3: Shared 패키지 (타입, 인터페이스, 상수) [unspecified-high]
├── Task 4: shadcn/ui + Tailwind + 디자인 토큰 [visual-engineering]
├── Task 5: 코드 품질 도구 (ESLint + Prettier + Husky + Commitlint) [quick]
├── Task 6: 암호화 유틸리티 (AES-256-GCM + bcrypt) [quick]
└── Task 7: Supabase Auth + 미들웨어 + 보호 라우트 [unspecified-high]

Wave 2 (Trading Engine Core — 8 tasks, ALL parallel):
├── Task 8: KIS 국내주식 브로커 어댑터 (depends: 3, 6) [deep]
├── Task 9: KIS 해외주식 브로커 어댑터 (depends: 3, 6) [deep]
├── Task 10: Alpaca 브로커 어댑터 (depends: 3, 6) [deep]
├── Task 11: 키움증권 브로커 어댑터 + Windows 프록시 (depends: 3, 6) [deep]
├── Task 12: Binance 브로커 어댑터 (depends: 3, 6) [deep]
├── Task 13: Upbit 브로커 어댑터 (depends: 3, 6) [deep]
├── Task 14: 전략 엔진 - MA크로스오버 + RSI + 볼린저 (depends: 3) [deep]
└── Task 15: 전략 엔진 - MACD + 그리드 + AI분석 (depends: 3) [deep]

Wave 3 (Engine Modules + Web Pages — 15 tasks, ALL parallel):
├── Task 16: 실시간 데이터 피드 + WebSocket 매니저 (depends: 8-13) [deep]
├── Task 17: 주문 관리 시스템 (depends: 8-13) [deep]
├── Task 18: 리스크 관리 + 회로차단기 (depends: 3) [deep]
├── Task 19: 페이퍼 트레이딩 엔진 (depends: 17, 18) [deep]
├── Task 20: 백테스팅 엔진 - 고급 (depends: 14, 15, 16) [ultrabrain]
├── Task 21: 자동매매 데몬 (depends: 8-15, 17, 18) [deep]
├── Task 22: 알림 시스템 + 텔레그램 봇 (depends: 3) [unspecified-high]
├── Task 23: 랜딩 페이지 (depends: 4) [visual-engineering]
├── Task 24: 인증 페이지 (로그인/회원가입) (depends: 4, 7) [visual-engineering]
├── Task 25: 대시보드 페이지 (depends: 4, 7) [visual-engineering]
├── Task 26: 전략 관리 페이지 (depends: 4, 7) [visual-engineering]
├── Task 27: 백테스팅 페이지 (depends: 4, 7) [visual-engineering]
├── Task 28: 거래 내역 + 포트폴리오 페이지 (depends: 4, 7) [visual-engineering]
├── Task 29: 설정 페이지 (depends: 4, 7) [visual-engineering]
└── Task 30: 관리자 패널 (depends: 4, 7) [visual-engineering]

Wave 4 (API + Integration — 8 tasks, ALL parallel):
├── Task 31: API 라우트 - 인증 & 사용자 (depends: 2, 7) [unspecified-high]
├── Task 32: API 라우트 - 트레이딩 & 주문 (depends: 2, 17) [unspecified-high]
├── Task 33: API 라우트 - 전략 관리 (depends: 2, 14, 15) [unspecified-high]
├── Task 34: API 라우트 - 백테스팅 & 데이터 (depends: 2, 20) [unspecified-high]
├── Task 35: 토스페이먼츠 결제 통합 (depends: 2, 31) [unspecified-high]
├── Task 36: PWA 설정 (매니페스트, SW, 푸시) (depends: 23-30) [unspecified-high]
├── Task 37: 모니터링 & 알림 대시보드 (depends: 22, 25) [visual-engineering]
└── Task 38: 프론트엔드-백엔드 통합 연결 (depends: 23-34) [deep]

Wave FINAL (Verification — 4 parallel reviews → user okay):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)
-> Present results -> Get explicit user okay
```

Critical Path: T1 → T3 → T8 → T17 → T21 → T32 → T38 → F1-F4 → user okay
Parallel Speedup: ~75% faster than sequential
Max Concurrent: 15 (Wave 3)

### Dependency Matrix

| Task | Blocked By | Blocks |
|------|-----------|--------|
| 1 | — | 2-7 (all Wave 1 can start together, but 2-7 need monorepo) |
| 2 | 1 | 7, 31-35 |
| 3 | 1 | 8-15, 17-22 |
| 4 | 1 | 23-30 |
| 5 | 1 | — |
| 6 | 1 | 8-13 |
| 7 | 1, 2 | 24-30, 31 |
| 8-13 | 3, 6 | 16, 17, 21 |
| 14-15 | 3 | 20, 21, 33 |
| 16 | 8-13 | 20 |
| 17 | 8-13 | 19, 21, 32 |
| 18 | 3 | 19, 21 |
| 19 | 17, 18 | 21 |
| 20 | 14, 15, 16 | 34 |
| 21 | 8-15, 17, 18 | 38 |
| 22 | 3 | 37 |
| 23-30 | 4, 7 | 36, 38 |
| 31 | 2, 7 | 35 |
| 32 | 2, 17 | 38 |
| 33 | 2, 14, 15 | 38 |
| 34 | 2, 20 | 38 |
| 35 | 2, 31 | 38 |
| 36 | 23-30 | 38 |
| 37 | 22, 25 | 38 |
| 38 | 23-37 | F1-F4 |
| F1-F4 | 38 | — |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|------------|
| 1 | 7 | T1→`quick`, T2→`unspecified-high`, T3→`unspecified-high`, T4→`visual-engineering`, T5→`quick`, T6→`quick`, T7→`unspecified-high` |
| 2 | 8 | T8-T13→`deep`, T14-T15→`deep` |
| 3 | 15 | T16-T21→`deep`/`ultrabrain`, T22→`unspecified-high`, T23-T30→`visual-engineering` |
| 4 | 8 | T31-T35→`unspecified-high`, T36→`unspecified-high`, T37→`visual-engineering`, T38→`deep` |
| FINAL | 4 | F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep` |

---

## TODOs

### Wave 1: Foundation & Scaffolding

- [x] 1. Turborepo + Next.js 15 + Bun 프로젝트 스캐폴딩

  **What to do**:
  - `~/projects/alphix/` 디렉토리에 Turborepo 모노레포 초기화
  - 3개 패키지 생성: `packages/trading-engine`, `packages/web`, `packages/shared`
  - `packages/web`: Next.js 15 (App Router) 프로젝트 생성
  - `packages/trading-engine`: 순수 TypeScript 라이브러리 (Bun 기반)
  - `packages/shared`: 공유 타입/유틸 라이브러리
  - 루트 `turbo.json` 파이프라인 설정 (build, test, lint, dev)
  - 루트 `package.json` workspace 설정
  - 루트 `tsconfig.json` + 각 패키지별 `tsconfig.json`
  - `.gitignore`, `.env.example` 생성
  - `bun install` → `bun run dev` → localhost:3000 접근 가능 확인

  **Must NOT do**:
  - 앱 로직 작성 (scaffolding만)
  - 외부 라이브러리 과도 설치 (필수 의존성만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 표준 scaffolding 작업, 파일 생성 위주

  **Parallelization**:
  - **Can Run In Parallel**: YES (독립 작업)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 2-7 (모노레포 구조 필요)
  - **Blocked By**: None

  **References**:
  **Pattern References**:
  - 기존 Alphix `turbo.json`: https://github.com/Gangnamhaha/auto-trading-saas/blob/main/turbo.json — Turborepo 파이프라인 구조 참고
  - 기존 Alphix `package.json`: https://github.com/Gangnamhaha/auto-trading-saas/blob/main/package.json — workspace 설정 참고

  **External References**:
  - Turborepo 공식 문서: https://turbo.build/repo/docs — monorepo 설정 가이드
  - Next.js 15 공식 문서: https://nextjs.org/docs — App Router 설정

  **WHY Each Reference Matters**:
  - 기존 turbo.json: 파이프라인 의존성 설정을 동일하게 가져가되 Next.js 15에 맞게 조정
  - 기존 package.json: workspace 패턴과 스크립트 명명 규칙 복제

  **Acceptance Criteria**:
  - [ ] `~/projects/alphix/` 디렉토리 존재
  - [ ] `bun install` → 에러 없음
  - [ ] `bun run dev` → localhost:3000 접근 가능
  - [ ] 3개 패키지 (`packages/trading-engine`, `packages/web`, `packages/shared`) 존재
  - [ ] `turbo.json`에 build, test, lint, dev 파이프라인 정의

  **QA Scenarios**:
  ```
  Scenario: 프로젝트 초기화 및 dev 서버 구동
    Tool: Bash + Playwright
    Preconditions: ~/projects/alphix/ 비어있음
    Steps:
      1. cd ~/projects/alphix && bun install → 에러 없이 완료
      2. bun run dev → 프로세스 시작
      3. curl http://localhost:3000 → HTTP 200 응답
      4. ls packages/ → trading-engine/ web/ shared/ 확인
    Expected Result: 3개 패키지 모두 존재, dev 서버 200 응답
    Failure Indicators: bun install 실패, localhost 접근 불가
    Evidence: .sisyphus/evidence/task-1-scaffold-init.png

  Scenario: Turbo 파이프라인 검증
    Tool: Bash
    Preconditions: bun install 완료
    Steps:
      1. bun run build → 모든 패키지 빌드 성공
      2. cat turbo.json → build, test, lint, dev 키 존재 확인
    Expected Result: turbo.json에 4개 파이프라인, build 성공
    Failure Indicators: build 에러, 누락된 파이프라인
    Evidence: .sisyphus/evidence/task-1-turbo-pipeline.txt
  ```

  **Commit**: YES
  - Message: `chore(scaffold): init turborepo monorepo with next.js 15 and bun`
  - Files: 전체 루트 + packages/*/
  - Pre-commit: `bun run build`

- [x] 2. Supabase 프로젝트 셋업 (DB 스키마 + RLS)

  **What to do**:
  - `packages/shared/src/db/` 에 Supabase 스키마 정의
  - 테이블 설계 및 마이그레이션 SQL 작성:
    - `users` (id, email, name, created_at, subscription_tier)
    - `broker_configs` (id, user_id, broker_type, encrypted_api_key, encrypted_secret, is_active)
    - `strategies` (id, user_id, name, type, params, broker_config_id, is_active, is_paper)
    - `orders` (id, user_id, strategy_id, broker_type, symbol, side, quantity, price, status, created_at)
    - `positions` (id, user_id, broker_type, symbol, quantity, avg_price, current_price, pnl)
    - `backtest_results` (id, user_id, strategy_id, params, result_json, created_at)
    - `subscriptions` (id, user_id, plan, status, toss_customer_key, current_period_end)
    - `notifications` (id, user_id, type, message, is_read, created_at)
    - `trade_logs` (id, user_id, strategy_id, action, details, timestamp)
  - RLS (Row Level Security) 정책: 모든 테이블에 `user_id = auth.uid()` 기반 정책
  - Supabase 클라이언트 설정 (`packages/shared/src/db/supabase.ts`)
  - 서버/클라이언트 분리 (`createServerClient`, `createBrowserClient`)
  - 타입 생성 스크립트 (`supabase gen types typescript`)

  **Must NOT do**:
  - Supabase Auth 설정 (Task 7에서 처리)
  - API 키 직접 노출 (환경변수만)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: DB 스키마 설계 + RLS 정책은 데이터 모델링 전문성 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 7, 31-35
  - **Blocked By**: Task 1 (monorepo 구조)

  **References**:
  **Pattern References**:
  - 기존 Alphix `packages/shared/`: https://github.com/Gangnamhaha/auto-trading-saas/tree/main/packages — DB 스키마 패턴 참고

  **External References**:
  - Supabase 공식 문서: https://supabase.com/docs — 클라이언트 설정, RLS, 마이그레이션
  - Supabase + Next.js 가이드: https://supabase.com/docs/guides/auth/server-side/nextjs

  **WHY Each Reference Matters**:
  - 기존 shared 패키지: 테이블 구조와 필드명을 참고하여 호환성 유지
  - Supabase 공식 문서: RLS 정책 작성법, 서버/클라이언트 분리 패턴

  **Acceptance Criteria**:
  - [ ] 9개 테이블 마이그레이션 SQL 작성 완료
  - [ ] 모든 테이블에 RLS 정책 적용
  - [ ] Supabase 클라이언트 (서버/브라우저) 설정 완료
  - [ ] TypeScript 타입 자동 생성 스크립트 작동

  **QA Scenarios**:
  ```
  Scenario: DB 스키마 검증
    Tool: Bash (bun test)
    Preconditions: packages/shared 설정 완료
    Steps:
      1. cat packages/shared/src/db/migrations/*.sql → 9개 테이블 CREATE문 확인
      2. grep "ENABLE ROW LEVEL SECURITY" migrations/*.sql → 9개 테이블 모두 RLS 활성
      3. bun test packages/shared/src/db/ → 스키마 테스트 PASS
    Expected Result: 9 테이블, 9 RLS 정책, 테스트 통과
    Failure Indicators: 누락된 테이블, RLS 미적용
    Evidence: .sisyphus/evidence/task-2-schema-verify.txt

  Scenario: Supabase 클라이언트 초기화 실패 핸들링
    Tool: Bash (bun test)
    Preconditions: 환경변수 미설정
    Steps:
      1. SUPABASE_URL="" bun test supabase-client.test.ts → 적절한 에러 메시지
    Expected Result: "Missing SUPABASE_URL" 에러, 크래시 없음
    Failure Indicators: 무한 대기, 알 수 없는 에러
    Evidence: .sisyphus/evidence/task-2-client-error.txt
  ```

  **Commit**: YES (groups with T3)
  - Message: `feat(shared): add supabase schema, types, and interfaces`
  - Files: `packages/shared/src/db/`
  - Pre-commit: `bun test packages/shared/`

- [x] 3. Shared 패키지 — 타입, 인터페이스, 상수 정의

  **What to do**:
  - `packages/shared/src/types/` 에 핵심 타입 정의:
    - `broker.ts`: `BrokerType`, `BrokerConfig`, `BrokerAdapter` 인터페이스, `OrderRequest`, `OrderResponse`, `Position`, `Balance`, `MarketData`
    - `strategy.ts`: `StrategyType`, `StrategyConfig`, `Strategy` 인터페이스, `Signal` (BUY/SELL/HOLD), `StrategyResult`
    - `backtest.ts`: `BacktestConfig`, `BacktestResult`, `Trade`, `PerformanceMetrics`
    - `user.ts`: `User`, `Subscription`, `SubscriptionTier` (FREE/BASIC/PRO)
    - `common.ts`: `Market` (KR/US/CRYPTO), `TimeFrame`, `OHLCV`, `Pagination`
  - `packages/shared/src/constants/`:
    - `brokers.ts`: 브로커별 API 엔드포인트, 마켓 시간, Rate Limit
    - `strategies.ts`: 전략별 기본 파라미터
    - `pricing.ts`: 요금제 정보 (Free/Basic/Pro 가격, 제한)
  - 모든 타입에 JSDoc 최소 설명 (1줄)
  - TDD: 타입 테스트 (타입 가드 함수, enum 유효성)

  **Must NOT do**:
  - 구현체 작성 (인터페이스/타입만)
  - 과도한 제네릭 (2레벨 이하)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 전체 시스템의 계약(contract) 정의, 정밀한 타입 설계 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-22 (모든 엔진 모듈이 이 타입에 의존)
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - 기존 Alphix `packages/shared/`: https://github.com/Gangnamhaha/auto-trading-saas/tree/main/packages — 기존 타입 정의 참고

  **External References**:
  - KIS API 문서: https://apiportal.koreainvestment.com/ — OrderRequest/Response 필드
  - Alpaca API: https://docs.alpaca.markets/ — 미국 주식 주문 타입

  **WHY Each Reference Matters**:
  - 기존 shared 패키지: BrokerAdapter, Strategy 인터페이스의 메서드 시그니처를 동일하게 유지
  - KIS/Alpaca API: 실제 API 응답 형태에 맞는 타입 설계

  **Acceptance Criteria**:
  - [ ] `BrokerAdapter` 인터페이스: connect, disconnect, getBalance, getPositions, placeOrder, cancelOrder, getMarketData
  - [ ] `Strategy` 인터페이스: analyze, getSignal, getRequiredDataPoints
  - [ ] 모든 타입 파일 `bun test` 통과
  - [ ] 타입 가드 함수 (isBuySignal, isValidOrder 등) 테스트 포함

  **QA Scenarios**:
  ```
  Scenario: 타입 시스템 무결성 검증
    Tool: Bash (bun test + tsc)
    Preconditions: packages/shared 존재
    Steps:
      1. cd packages/shared && bun test → 모든 타입 테스트 PASS
      2. npx tsc --noEmit → 타입 에러 0건
      3. grep "export interface BrokerAdapter" src/types/broker.ts → 인터페이스 존재
      4. grep "export interface Strategy" src/types/strategy.ts → 인터페이스 존재
    Expected Result: 테스트 PASS, 타입 에러 0, 핵심 인터페이스 존재
    Failure Indicators: 타입 에러, 누락된 인터페이스
    Evidence: .sisyphus/evidence/task-3-types-verify.txt

  Scenario: 타입 가드 함수 경계값 테스트
    Tool: Bash (bun test)
    Preconditions: 타입 가드 함수 구현
    Steps:
      1. bun test --filter "type guard" → 경계값 테스트 포함 확인
      2. 유효하지 않은 입력 (null, undefined, wrong enum) → false 반환
    Expected Result: 모든 경계값 테스트 PASS
    Evidence: .sisyphus/evidence/task-3-type-guards.txt
  ```

  **Commit**: YES (groups with T2)
  - Message: `feat(shared): add supabase schema, types, and interfaces`
  - Files: `packages/shared/src/types/`, `packages/shared/src/constants/`
  - Pre-commit: `bun test packages/shared/`

- [x] 4. shadcn/ui + Tailwind CSS + 디자인 시스템

  **What to do**:
  - `packages/web`에 Tailwind CSS v4 설정
  - shadcn/ui 초기화 (`bunx shadcn@latest init`)
  - 핵심 컴포넌트 설치: Button, Card, Input, Dialog, Table, Tabs, Badge, Dropdown, Sheet, Toast, Chart
  - 디자인 토큰 정의 (`packages/web/src/styles/tokens.css`):
    - 컬러 팔레트 (primary: blue, success: green, danger: red, warning: amber)
    - 다크 모드 지원 (CSS variables)
    - 타이포그래피 스케일
    - 스페이싱 스케일
  - 레이아웃 컴포넌트 작성:
    - `MainLayout` (사이드바 + 헤더 + 콘텐츠)
    - `AuthLayout` (센터 카드 레이아웃)
    - `LandingLayout` (풀스크린 + 네비게이션)
  - 금융 대시보드 전용 컴포넌트:
    - `PriceDisplay` (가격 + 등락률, 색상 코딩)
    - `StockChart` (캔들스틱/라인 차트 래퍼)
    - `OrderBook` (호가창 UI)
  - 반응형: 모바일 first, 태블릿, 데스크톱 breakpoints

  **Must NOT do**:
  - 실제 데이터 연결 (목업 데이터만)
  - 커스텀 CSS 과다 사용 (Tailwind 유틸리티 우선)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]
  - `frontend-ui-ux`: 세련된 금융 대시보드 UI 구현 필요
  - Reason: 금융 앱 특화 UI 디자인, 다크모드, 반응형 레이아웃

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 23-30 (모든 페이지가 이 디자인 시스템 사용)
  - **Blocked By**: Task 1

  **References**:
  **External References**:
  - shadcn/ui: https://ui.shadcn.com/docs — 컴포넌트 설치 및 커스터마이징
  - Tailwind CSS v4: https://tailwindcss.com/docs — 유틸리티 클래스
  - Recharts: https://recharts.org/ — 차트 라이브러리 (shadcn 차트 기반)

  **WHY Each Reference Matters**:
  - shadcn/ui: 설치 방법, 테마 커스터마이징, 컴포넌트 API
  - Recharts: 금융 차트 (캔들스틱, 라인) 구현 패턴

  **Acceptance Criteria**:
  - [ ] shadcn/ui 초기화 완료, 10+ 컴포넌트 설치
  - [ ] 다크모드 토글 동작
  - [ ] 3개 레이아웃 (Main, Auth, Landing) 렌더링
  - [ ] 반응형: 375px (모바일), 768px (태블릿), 1024px+ (데스크톱)
  - [ ] 금융 컴포넌트 (PriceDisplay, StockChart) 목업 렌더링

  **QA Scenarios**:
  ```
  Scenario: 디자인 시스템 렌더링 검증
    Tool: Playwright
    Preconditions: bun run dev 실행 중
    Steps:
      1. 브라우저 열기 → http://localhost:3000
      2. 다크모드 토글 클릭 → 배경색 #0a0a0a 계열로 변경
      3. 뷰포트 375px로 변경 → 사이드바 숨겨지고 햄버거 메뉴 표시
      4. 뷰포트 1024px로 변경 → 사이드바 노출
    Expected Result: 다크모드 전환, 반응형 레이아웃 정상 동작
    Failure Indicators: 스타일 깨짐, 다크모드 미적용
    Evidence: .sisyphus/evidence/task-4-design-system.png

  Scenario: 금융 컴포넌트 목업 렌더링
    Tool: Playwright
    Preconditions: dev 서버 실행
    Steps:
      1. PriceDisplay 컴포넌트에 price=50000, change=+2.5 전달
      2. 가격 텍스트 "50,000" 표시 확인
      3. 등락률 "+2.50%" 녹색으로 표시 확인
      4. change=-1.3 전달 → 빨간색으로 변경
    Expected Result: 가격 포맷팅, 색상 코딩 정상
    Evidence: .sisyphus/evidence/task-4-price-display.png
  ```

  **Commit**: YES (groups with T5)
  - Message: `chore(web): setup shadcn/ui, tailwind, and design system`
  - Files: `packages/web/src/components/`, `packages/web/src/styles/`

- [x] 5. 코드 품질 도구 (ESLint + Prettier + Husky + Commitlint)

  **What to do**:
  - ESLint 설정 (TypeScript + React + Next.js 규칙)
  - Prettier 설정 (일관된 코드 포맷)
  - Husky + lint-staged (pre-commit hook)
  - Commitlint (conventional commits 강제)
  - `.eslintrc.json`, `.prettierrc`, `.commitlintrc.json`, `.lintstagedrc.json` 생성
  - 모노레포 루트 + 각 패키지별 ESLint 확장
  - `bun run lint` 스크립트 추가

  **Must NOT do**:
  - 과도한 커스텀 규칙 (표준 preset만)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None (nice-to-have, 다른 태스크 블로킹 안 함)
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - 기존 Alphix: https://github.com/Gangnamhaha/auto-trading-saas/blob/main/.eslintrc.json — ESLint 설정
  - 기존 Alphix: https://github.com/Gangnamhaha/auto-trading-saas/blob/main/.prettierrc — Prettier 설정
  - 기존 Alphix: https://github.com/Gangnamhaha/auto-trading-saas/blob/main/.commitlintrc.json — Commitlint 설정

  **WHY Each Reference Matters**:
  - 기존 설정을 최대한 복제하여 코드 스타일 일관성 유지

  **Acceptance Criteria**:
  - [ ] `bun run lint` → 에러 0건
  - [ ] git commit "bad message" → commitlint가 거부
  - [ ] git commit 시 lint-staged 자동 실행

  **QA Scenarios**:
  ```
  Scenario: Lint 및 Commit Hook 검증
    Tool: Bash
    Preconditions: 프로젝트 초기화 완료
    Steps:
      1. bun run lint → 0 errors, 0 warnings
      2. echo "bad" > test.ts && git add test.ts
      3. git commit -m "bad" → commitlint 거부 확인
      4. git commit -m "feat: test" → lint-staged 실행 확인
    Expected Result: lint 통과, 잘못된 커밋 메시지 거부
    Evidence: .sisyphus/evidence/task-5-lint-commit.txt
  ```

  **Commit**: YES (groups with T4)
  - Message: `chore(web): setup shadcn/ui, tailwind, eslint, prettier`
  - Files: 루트 설정 파일들

- [x] 6. 암호화 유틸리티 (AES-256-GCM + bcrypt)

  **What to do**:
  - `packages/shared/src/crypto/`:
    - `encryption.ts`: AES-256-GCM 암복호화 (브로커 API 키 보호용)
      - `encrypt(plaintext: string, key: string): EncryptedData`
      - `decrypt(encrypted: EncryptedData, key: string): string`
      - IV 자동 생성, AAD(Additional Authenticated Data) 지원
    - `hashing.ts`: bcrypt 비밀번호 해싱
      - `hashPassword(password: string): Promise<string>`
      - `verifyPassword(password: string, hash: string): Promise<boolean>`
      - salt rounds: 12
    - `types.ts`: `EncryptedData` { ciphertext, iv, tag, aad? }
  - TDD: 각 함수에 대한 테스트 선행 작성
    - 암호화 → 복호화 라운드트립
    - 잘못된 키로 복호화 시도 → 에러
    - bcrypt 해싱 → 검증 성공/실패

  **Must NOT do**:
  - 자체 암호화 알고리즘 구현 (Node.js crypto 모듈 사용)
  - 키를 코드에 하드코딩

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-13 (브로커 어댑터가 API 키 암호화 필요)
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - 기존 Alphix `packages/shared/`: https://github.com/Gangnamhaha/auto-trading-saas/tree/main/packages — 암호화 유틸 패턴

  **External References**:
  - Node.js crypto 문서: https://nodejs.org/api/crypto.html — AES-256-GCM 구현

  **WHY Each Reference Matters**:
  - 기존 Alphix의 암호화 방식을 그대로 복제하여 호환성 유지

  **Acceptance Criteria**:
  - [ ] TDD: 테스트 먼저 작성 후 구현
  - [ ] AES-256-GCM 암복호화 라운드트립 테스트 PASS
  - [ ] 잘못된 키 → 명확한 에러 메시지
  - [ ] bcrypt 해싱/검증 테스트 PASS
  - [ ] `bun test packages/shared/src/crypto/` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 암호화 라운드트립 검증
    Tool: Bash (bun test)
    Preconditions: crypto 모듈 구현
    Steps:
      1. bun test packages/shared/src/crypto/ → 전체 테스트 실행
      2. 테스트 케이스 확인: encrypt → decrypt → 원본 일치
      3. 잘못된 키 테스트: decrypt(data, wrongKey) → DecryptionError
    Expected Result: 모든 암호화 테스트 PASS, 에러 케이스 처리
    Evidence: .sisyphus/evidence/task-6-crypto-test.txt

  Scenario: bcrypt 해싱 성능 검증
    Tool: Bash (bun test)
    Steps:
      1. hashPassword("test123") → 해시 생성 (< 500ms)
      2. verifyPassword("test123", hash) → true
      3. verifyPassword("wrong", hash) → false
    Expected Result: 해싱 500ms 이내, 검증 정확
    Evidence: .sisyphus/evidence/task-6-bcrypt-test.txt
  ```

  **Commit**: YES (groups with T7)
  - Message: `feat(auth): supabase auth with encryption utils`
  - Files: `packages/shared/src/crypto/`

- [x] 7. Supabase Auth + 미들웨어 + 보호 라우트

  **What to do**:
  - Supabase Auth 설정:
    - 이메일/비밀번호 인증
    - 소셜 로그인 준비 (Google, Kakao — 프로바이더 설정만)
    - 이메일 확인 흐름
  - Next.js 15 미들웨어 (`packages/web/src/middleware.ts`):
    - Supabase 세션 검증
    - 보호 라우트 정의 (`/dashboard/*`, `/settings/*`, `/admin/*`)
    - 비인증 시 `/login` 리다이렉트
    - 관리자 라우트는 admin 역할 확인
  - Auth 유틸리티:
    - `getUser()` — 서버 컴포넌트에서 현재 사용자
    - `requireAuth()` — 인증 필수 (미인증 시 redirect)
    - `requireAdmin()` — 관리자 전용
  - Auth 컨텍스트 (클라이언트):
    - `AuthProvider` — Supabase 세션 상태 관리
    - `useAuth()` hook — 로그인 상태, 사용자 정보

  **Must NOT do**:
  - 커스텀 JWT 구현 (Supabase Auth 전적 활용)
  - 로그인/회원가입 UI (Task 24에서 구현)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 24-31 (모든 인증 필요 페이지/API)
  - **Blocked By**: Tasks 1, 2

  **References**:
  **External References**:
  - Supabase Auth + Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
  - Next.js 15 Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware

  **WHY Each Reference Matters**:
  - Supabase Auth: 서버/클라이언트 분리, 쿠키 기반 세션 관리 패턴
  - Next.js 15 Middleware: 라우트 보호, 리다이렉트 패턴

  **Acceptance Criteria**:
  - [ ] Supabase Auth 이메일/비밀번호 인증 동작
  - [ ] `/dashboard` 비인증 접근 → `/login` 리다이렉트
  - [ ] `getUser()` 서버 컴포넌트에서 사용자 정보 반환
  - [ ] `useAuth()` 클라이언트에서 로그인 상태 반영

  **QA Scenarios**:
  ```
  Scenario: 보호 라우트 리다이렉트 검증
    Tool: Playwright
    Preconditions: dev 서버 실행, 비로그인 상태
    Steps:
      1. 브라우저로 http://localhost:3000/dashboard 접근
      2. URL이 /login으로 리다이렉트되는지 확인
      3. http://localhost:3000/settings 접근 → /login 리다이렉트
      4. http://localhost:3000/ (랜딩) → 리다이렉트 없이 표시
    Expected Result: 보호 라우트는 /login으로 리다이렉트, 공개 라우트는 정상 접근
    Failure Indicators: 리다이렉트 안 됨, 무한 루프
    Evidence: .sisyphus/evidence/task-7-auth-redirect.png

  Scenario: 인증 세션 유지 검증
    Tool: Playwright
    Preconditions: Supabase Auth 설정 완료
    Steps:
      1. 테스트 계정으로 로그인 (이메일/비밀번호)
      2. /dashboard 접근 → 정상 표시 (리다이렉트 없음)
      3. 페이지 새로고침 → 세션 유지 (재로그인 불필요)
      4. 로그아웃 → /login으로 리다이렉트
    Expected Result: 세션 유지, 로그아웃 동작
    Evidence: .sisyphus/evidence/task-7-auth-session.png
  ```

  **Commit**: YES (groups with T6)
  - Message: `feat(auth): supabase auth with encryption utils`
  - Files: `packages/web/src/middleware.ts`, `packages/web/src/lib/auth/`

### Wave 2: Trading Engine Core

- [ ] 8. KIS 국내주식 브로커 어댑터

  **What to do**:
  - `packages/trading-engine/src/broker/kis/`:
    - `KisBrokerAdapter` 클래스 (implements `BrokerAdapter`)
    - OAuth 토큰 관리 (발급, 갱신, 만료 처리)
    - REST API 통합:
      - 잔고 조회 (`getBalance`)
      - 보유 종목 조회 (`getPositions`)
      - 주문 실행 (`placeOrder`) — 시장가/지정가
      - 주문 취소 (`cancelOrder`)
      - 시세 조회 (`getMarketData`) — KOSPI/KOSDAQ
      - 주문 체결 조회 (`getOrderStatus`)
    - WebSocket 실시간 시세 (Task 16에서 통합)
    - Rate Limit 핸들링 (초당 20건 제한)
    - 모의투자 모드 (KIS 모의투자 API 활용)
    - 에러 핸들링: 네트워크 에러, 토큰 만료, 주문 거부
    - 재시도 로직 (exponential backoff)
  - TDD: 모든 API 호출에 대한 mock 테스트

  **Must NOT do**:
  - 실제 KIS API 호출 (mock/모의투자만)
  - WebSocket 구현 (Task 16)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: 금융 API 통합, 에러 핸들링, 재시도 로직 등 깊은 도메인 지식 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (Tasks 8-15 모두 병렬)
  - **Blocks**: Tasks 16, 17, 21
  - **Blocked By**: Tasks 3, 6

  **References**:
  **Pattern References**:
  - 기존 Alphix broker 디렉토리: https://github.com/Gangnamhaha/auto-trading-saas/tree/main/packages/trading-engine — KIS 어댑터 패턴

  **External References**:
  - KIS Developers 포털: https://apiportal.koreainvestment.com/ — API 문서 (인증, 주문, 시세)
  - KIS Open API 가이드: https://apiportal.koreainvestment.com/apiservice — REST API 스펙

  **WHY Each Reference Matters**:
  - KIS API 포털: 인증 흐름(OAuth), 주문 API 파라미터, 응답 형태가 상세 기술
  - 기존 Alphix: 어댑터 패턴 구현 방식과 에러 처리 참고

  **Acceptance Criteria**:
  - [ ] TDD: 모든 메서드에 대한 테스트 선행
  - [ ] `BrokerAdapter` 인터페이스 100% 구현
  - [ ] OAuth 토큰 갱신 자동 처리
  - [ ] Rate Limit 초과 시 자동 대기 + 재시도
  - [ ] 모의투자 모드 동작
  - [ ] `bun test packages/trading-engine/src/broker/kis/` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: KIS 어댑터 mock 테스트
    Tool: Bash (bun test)
    Preconditions: shared types 정의 완료
    Steps:
      1. bun test packages/trading-engine/src/broker/kis/ → 전체 실행
      2. 토큰 갱신 테스트: 만료된 토큰 → 자동 갱신 → 재요청
      3. Rate Limit 테스트: 21번째 요청 → 대기 후 재시도
      4. 주문 실행 테스트: placeOrder({symbol: "005930", side: "BUY", quantity: 10}) → OrderResponse
    Expected Result: 모든 테스트 PASS, 에러 케이스 포함
    Evidence: .sisyphus/evidence/task-8-kis-broker.txt

  Scenario: 네트워크 에러 복구
    Tool: Bash (bun test)
    Steps:
      1. 네트워크 타임아웃 시뮬레이션 → 3회 재시도 후 에러
      2. 500 서버 에러 → exponential backoff 적용
    Expected Result: 재시도 로직 정상, 최대 재시도 후 명확한 에러
    Evidence: .sisyphus/evidence/task-8-kis-retry.txt
  ```

  **Commit**: YES (groups with T9-T13)
  - Message: `feat(broker): add 6 broker adapters (KIS/Alpaca/Kiwoom/Binance/Upbit)`
  - Files: `packages/trading-engine/src/broker/kis/`

- [ ] 9. KIS 해외주식 (미국) 브로커 어댑터

  **What to do**:
  - `packages/trading-engine/src/broker/kis-overseas/`:
    - `KisOverseasBrokerAdapter` 클래스 (implements `BrokerAdapter`)
    - KIS 해외주식 API 통합 (NYSE/NASDAQ)
    - Task 8의 KIS OAuth 토큰 재사용 (같은 인증)
    - 미국 주식 시세 조회 (USD 기반)
    - 해외주식 주문 (시장가/지정가)
    - 환율 처리 유틸리티
    - 미국 시장 운영시간 처리 (KST 기준 23:30-06:00)
  - TDD: mock 테스트

  **Must NOT do**:
  - 국내주식 로직 중복 (공통 부분은 KIS base 클래스로 추출)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 16, 17, 21
  - **Blocked By**: Tasks 3, 6

  **References**:
  **External References**:
  - KIS 해외주식 API: https://apiportal.koreainvestment.com/ — 해외주식 주문/시세 API

  **Acceptance Criteria**:
  - [ ] `BrokerAdapter` 인터페이스 100% 구현
  - [ ] 환율 변환 유틸리티 테스트 PASS
  - [ ] 미국 시장 시간 판별 테스트 PASS
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 해외주식 어댑터 검증
    Tool: Bash (bun test)
    Steps:
      1. bun test packages/trading-engine/src/broker/kis-overseas/ → 전체 실행
      2. placeOrder({symbol: "AAPL", side: "BUY", quantity: 5}) → OrderResponse 확인
      3. 미국 시장 시간 체크: isMarketOpen(KST 오전 10시) → false
    Expected Result: 모든 테스트 PASS
    Evidence: .sisyphus/evidence/task-9-kis-overseas.txt
  ```

  **Commit**: YES (groups with T8, T10-T13)

- [ ] 10. Alpaca 브로커 어댑터

  **What to do**:
  - `packages/trading-engine/src/broker/alpaca/`:
    - `AlpacaBrokerAdapter` 클래스 (implements `BrokerAdapter`)
    - Alpaca Markets API v2 통합
    - Paper Trading 모드 (Alpaca 기본 제공)
    - REST API: 주문, 포지션, 계좌, 시세
    - 분할 주문 (fractional shares) 지원
  - TDD: mock 테스트

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 16, 17, 21
  - **Blocked By**: Tasks 3, 6

  **References**:
  **External References**:
  - Alpaca API v2: https://docs.alpaca.markets/reference — REST API 문서

  **Acceptance Criteria**:
  - [ ] `BrokerAdapter` 인터페이스 100% 구현
  - [ ] Paper Trading URL 자동 전환
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: Alpaca 어댑터 mock 테스트
    Tool: Bash (bun test)
    Steps:
      1. bun test packages/trading-engine/src/broker/alpaca/ → 전체 실행
      2. connect(paperMode=true) → paper-api.alpaca.markets 사용 확인
    Expected Result: 모든 테스트 PASS, Paper/Live URL 분기 정상
    Evidence: .sisyphus/evidence/task-10-alpaca.txt
  ```

  **Commit**: YES (groups with T8-T9, T11-T13)

- [ ] 11. 키움증권 브로커 어댑터 + Windows 프록시

  **What to do**:
  - `packages/trading-engine/src/broker/kiwoom/`:
    - `KiwoomBrokerAdapter` 클래스 (implements `BrokerAdapter`)
    - Windows 프록시 패턴: 키움 API는 Windows COM/OCX → REST 프록시 서버 경유
    - 프록시 통신: HTTP/WebSocket으로 Windows 프록시와 통신
    - 프록시 헬스체크 + 연결 상태 관리
    - 프록시 미연결 시 graceful fallback
  - TDD: 프록시 통신 mock 테스트

  **Must NOT do**:
  - Windows 프록시 서버 자체 구현 (별도 프로젝트, 여기서는 클라이언트만)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 16, 17, 21
  - **Blocked By**: Tasks 3, 6

  **Acceptance Criteria**:
  - [ ] `BrokerAdapter` 인터페이스 100% 구현
  - [ ] 프록시 헬스체크 동작
  - [ ] 프록시 미연결 → 에러 메시지 (크래시 없음)
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 키움 프록시 연결 테스트
    Tool: Bash (bun test)
    Steps:
      1. bun test packages/trading-engine/src/broker/kiwoom/ → 전체 실행
      2. 프록시 미연결 시 connect() → KiwoomProxyNotAvailable 에러
      3. 프록시 연결 시 mock → placeOrder 정상 동작
    Expected Result: 프록시 유무에 따른 적절한 처리
    Evidence: .sisyphus/evidence/task-11-kiwoom.txt
  ```

  **Commit**: YES (groups with T8-T10, T12-T13)

- [ ] 12. Binance 브로커 어댑터

  **What to do**:
  - `packages/trading-engine/src/broker/binance/`:
    - `BinanceBrokerAdapter` 클래스 (implements `BrokerAdapter`)
    - Binance Spot API 통합
    - HMAC-SHA256 서명 인증
    - 현물 거래: 주문, 포지션, 잔고, 시세
    - Testnet (모의투자) 지원
    - 암호화폐 소수점 처리 (stepSize, tickSize)
  - TDD: mock 테스트

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 16, 17, 21
  - **Blocked By**: Tasks 3, 6

  **References**:
  **External References**:
  - Binance API: https://binance-docs.github.io/apidocs/spot/en/ — Spot API 문서

  **Acceptance Criteria**:
  - [ ] `BrokerAdapter` 인터페이스 100% 구현
  - [ ] HMAC-SHA256 서명 정확성 테스트
  - [ ] Testnet URL 자동 전환
  - [ ] 소수점 처리 (stepSize/tickSize) 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: Binance 어댑터 검증
    Tool: Bash (bun test)
    Steps:
      1. bun test packages/trading-engine/src/broker/binance/ → 전체 실행
      2. HMAC 서명 테스트: 알려진 입력/출력 쌍으로 검증
      3. 소수점 반올림: quantity=0.123456, stepSize=0.001 → 0.123
    Expected Result: 서명 정확, 소수점 처리 정상
    Evidence: .sisyphus/evidence/task-12-binance.txt
  ```

  **Commit**: YES (groups with T8-T11, T13)

- [ ] 13. Upbit 브로커 어댑터

  **What to do**:
  - `packages/trading-engine/src/broker/upbit/`:
    - `UpbitBrokerAdapter` 클래스 (implements `BrokerAdapter`)
    - Upbit Open API 통합
    - JWT 인증 (access_key + secret_key)
    - 현물 거래: 주문, 포지션, 잔고, 시세
    - KRW 마켓 + BTC 마켓 지원
    - 주문 최소 금액 처리 (5,000 KRW)
  - TDD: mock 테스트

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 16, 17, 21
  - **Blocked By**: Tasks 3, 6

  **References**:
  **External References**:
  - Upbit API: https://docs.upbit.com/reference — Open API 문서

  **Acceptance Criteria**:
  - [ ] `BrokerAdapter` 인터페이스 100% 구현
  - [ ] JWT 인증 토큰 생성 테스트
  - [ ] 최소 주문 금액 검증 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: Upbit 어댑터 검증
    Tool: Bash (bun test)
    Steps:
      1. bun test packages/trading-engine/src/broker/upbit/ → 전체 실행
      2. 최소 주문 금액: placeOrder(amount=3000KRW) → MinOrderAmountError
      3. JWT 토큰 생성: 올바른 payload 포함 확인
    Expected Result: 인증, 주문, 검증 모두 PASS
    Evidence: .sisyphus/evidence/task-13-upbit.txt
  ```

  **Commit**: YES (groups with T8-T12)

- [ ] 14. 전략 엔진 — MA 크로스오버 + RSI + 볼린저밴드

  **What to do**:
  - `packages/trading-engine/src/strategy/`:
    - `StrategyEngine` 기본 클래스 (implements `Strategy`)
    - `MACrossoverStrategy`: 5/20일 이동평균 교차
      - 골든크로스(5MA > 20MA) → BUY 시그널
      - 데드크로스(5MA < 20MA) → SELL 시그널
      - 커스텀 기간 파라미터 (shortPeriod, longPeriod)
    - `RSIStrategy`: RSI(14) 과매수/과매도
      - RSI < 30 → BUY, RSI > 70 → SELL
      - 커스텀 임계값 파라미터
    - `BollingerBandsStrategy`: 볼린저밴드 터치 매매
      - 하단밴드 터치 → BUY, 상단밴드 터치 → SELL
      - 표준편차 배수 파라미터 (기본 2)
    - 각 전략에 `getRequiredDataPoints()` 구현
    - 기술적 분석 유틸: `calculateSMA`, `calculateEMA`, `calculateRSI`, `calculateBollingerBands`
  - TDD: 알려진 가격 데이터로 시그널 검증

  **Must NOT do**:
  - 전략 내 부수효과 (주문 실행 등) — 순수하게 시그널만 반환
  - 외부 API 호출

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: 금융 기술 분석 알고리즘 정확한 구현 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 20, 21, 33
  - **Blocked By**: Task 3

  **References**:
  **Pattern References**:
  - 기존 Alphix strategy 디렉토리: https://github.com/Gangnamhaha/auto-trading-saas/tree/main/packages/trading-engine — 전략 구현 패턴

  **External References**:
  - Investopedia MA Crossover: https://www.investopedia.com/terms/m/movingaverage.asp
  - RSI Calculation: https://www.investopedia.com/terms/r/rsi.asp

  **WHY Each Reference Matters**:
  - 기존 Alphix: Strategy 인터페이스 구현 패턴, 시그널 반환 형태
  - Investopedia: 정확한 수학적 계산 공식 참고

  **Acceptance Criteria**:
  - [ ] TDD: 모든 전략에 대한 테스트 선행
  - [ ] `Strategy` 인터페이스 100% 구현 (3개 전략)
  - [ ] 알려진 가격 데이터로 시그널 정확성 검증
  - [ ] 기술분석 유틸 함수 독립 테스트
  - [ ] `bun test packages/trading-engine/src/strategy/` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: MA 크로스오버 시그널 검증
    Tool: Bash (bun test)
    Steps:
      1. 상승 추세 데이터 20일분 입력 → 골든크로스 → BUY 시그널
      2. 하락 추세 데이터 → 데드크로스 → SELL 시그널
      3. 횡보 데이터 → HOLD 시그널
    Expected Result: 정확한 시그널 반환
    Evidence: .sisyphus/evidence/task-14-ma-strategy.txt

  Scenario: RSI 경계값 테스트
    Tool: Bash (bun test)
    Steps:
      1. RSI=29 → BUY, RSI=30 → HOLD, RSI=70 → HOLD, RSI=71 → SELL
      2. 데이터 부족 (14일 미만) → InsufficientDataError
    Expected Result: 경계값 정확, 데이터 부족 에러 처리
    Evidence: .sisyphus/evidence/task-14-rsi-boundary.txt
  ```

  **Commit**: YES (groups with T15)
  - Message: `feat(strategy): add 6 strategies (MA/RSI/BB/MACD/Grid/AI)`
  - Files: `packages/trading-engine/src/strategy/`

- [ ] 15. 전략 엔진 — MACD + 그리드 + AI 분석

  **What to do**:
  - `packages/trading-engine/src/strategy/`:
    - `MACDStrategy`: MACD/시그널 라인 교차
      - MACD 라인 = EMA(12) - EMA(26)
      - 시그널 라인 = EMA(9) of MACD
      - MACD > Signal → BUY, MACD < Signal → SELL
    - `GridTradingStrategy`: 가격 구간 자동 매매
      - 가격 범위(상한/하한) + 그리드 수 설정
      - 각 그리드 레벨에 매수/매도 주문
      - 포지션 크기 균등 분배
    - `AIAnalysisStrategy`: LLM 기반 분석
      - GPT-4o / Claude API 연동 (환경변수)
      - 프롬프트: 가격 데이터 + 기술 지표 → 매매 시그널 + 근거
      - 응답 파싱 및 시그널 변환
      - Fallback: API 에러 시 HOLD 반환
      - Rate Limit 관리
  - TDD: 각 전략 테스트

  **Must NOT do**:
  - AI 전략에서 실제 LLM API 호출 (mock 테스트만)
  - 그리드 전략에서 직접 주문 실행

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 20, 21, 33
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] `Strategy` 인터페이스 100% 구현 (3개 전략)
  - [ ] MACD 계산 정확성 테스트
  - [ ] 그리드 레벨 생성 테스트
  - [ ] AI 전략 mock 테스트 (프롬프트 생성 + 응답 파싱)
  - [ ] AI API 에러 시 HOLD fallback 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 그리드 트레이딩 레벨 생성
    Tool: Bash (bun test)
    Steps:
      1. GridStrategy(lower=45000, upper=55000, grids=10) → 10개 레벨 생성
      2. 각 레벨 간격 = 1000원 확인
      3. 가격 45500 → BUY 시그널 (하단 그리드 근접)
    Expected Result: 10개 균등 그리드, 정확한 시그널
    Evidence: .sisyphus/evidence/task-15-grid.txt

  Scenario: AI 전략 fallback
    Tool: Bash (bun test)
    Steps:
      1. LLM API 타임아웃 시뮬레이션 → HOLD 반환
      2. LLM 응답 파싱 불가 → HOLD 반환 + 경고 로그
    Expected Result: 에러 시 안전하게 HOLD, 크래시 없음
    Evidence: .sisyphus/evidence/task-15-ai-fallback.txt
  ```

  **Commit**: YES (groups with T14)

### Wave 3: Engine Modules + Web Pages

- [ ] 16. 실시간 데이터 피드 + WebSocket 매니저

  **What to do**:
  - `packages/trading-engine/src/data/`:
    - `WebSocketManager` 클래스:
      - 다중 브로커 WebSocket 연결 관리
      - 자동 재연결 (exponential backoff)
      - 하트비트/핑 관리
      - 연결 상태 모니터링
    - `DataFeedManager`:
      - 실시간 시세 구독/해제
      - 데이터 정규화 (브로커별 → 공통 `MarketData` 형태)
      - 이벤트 기반 아키텍처 (EventEmitter)
      - 버퍼링 + 배치 처리 (UI 업데이트 최적화)
    - 각 브로커별 WebSocket 어댑터:
      - KIS: wss://ops.koreainvestment.com
      - Binance: wss://stream.binance.com
      - Upbit: wss://api.upbit.com/websocket/v1
  - TDD: mock WebSocket으로 테스트

  **Must NOT do**:
  - 실제 WebSocket 연결 (mock만)
  - 데이터 저장 (메모리 스트림만)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 8-13

  **Acceptance Criteria**:
  - [ ] WebSocket 자동 재연결 테스트 (3회 연결 끊김 → 재연결)
  - [ ] 데이터 정규화: 브로커별 → 공통 MarketData
  - [ ] 이벤트 발행/구독 패턴 동작
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: WebSocket 재연결 검증
    Tool: Bash (bun test)
    Steps:
      1. mock WebSocket 연결 → 강제 종료 → 자동 재연결
      2. 3회 연속 실패 → backoff 증가 확인 (1s, 2s, 4s)
      3. 재연결 성공 → 이전 구독 자동 복구
    Expected Result: 자동 재연결, backoff 증가, 구독 복구
    Evidence: .sisyphus/evidence/task-16-websocket.txt
  ```

  **Commit**: YES (groups with T17-T22)

- [ ] 17. 주문 관리 시스템 (OMS)

  **What to do**:
  - `packages/trading-engine/src/order/`:
    - `OrderManager` 클래스:
      - 주문 생성 → 검증 → 실행 → 추적 파이프라인
      - 주문 상태 관리 (PENDING → SUBMITTED → FILLED/REJECTED/CANCELLED)
      - 주문 중복 방지 (idempotency key)
      - 동시 주문 제어 (mutex/semaphore)
      - 부분 체결 처리
    - `OrderValidator`:
      - 최소/최대 주문 수량 검증
      - 잔고 충분성 확인
      - 시장 운영시간 확인
      - 회로차단기 상태 확인
    - `OrderTracker`:
      - 미체결 주문 모니터링
      - 체결 알림 발행
      - 주문 이력 기록 (Supabase)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 19, 21, 32
  - **Blocked By**: Tasks 8-13

  **Acceptance Criteria**:
  - [ ] 주문 상태 전이 테스트 (모든 가능한 전이)
  - [ ] 중복 주문 방지 테스트 (같은 idempotency key → 거부)
  - [ ] 동시 주문 제어 테스트 (2개 동시 → 순차 처리)
  - [ ] 잔고 부족 → 주문 거부
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 주문 라이프사이클 검증
    Tool: Bash (bun test)
    Steps:
      1. createOrder → status=PENDING
      2. submitOrder → status=SUBMITTED
      3. mock 체결 알림 → status=FILLED
      4. 같은 idempotency key로 재생성 → DuplicateOrderError
    Expected Result: 상태 전이 정확, 중복 방지 동작
    Evidence: .sisyphus/evidence/task-17-oms.txt
  ```

  **Commit**: YES (groups with T16, T18-T22)

- [ ] 18. 리스크 관리 + 회로차단기

  **What to do**:
  - `packages/trading-engine/src/risk/`:
    - `RiskManager`:
      - 일일 손실 한도 (기본 -5%)
      - 최대 포지션 크기 제한
      - 최대 동시 포지션 수 제한
      - 단일 종목 집중도 제한
    - `CircuitBreaker`:
      - 일일 손실 한도 도달 → 모든 전략 중지
      - 수동 리셋 필요 (자동 해제 불가)
      - 알림 발송 (이메일/텔레그램)
    - `PositionSizer`:
      - 고정 비율 (자산의 N%)
      - 켈리 기준법 (선택적)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 19, 21
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] 일일 손실 한도 도달 → 회로차단기 발동 테스트
  - [ ] 회로차단기 발동 후 주문 거부 테스트
  - [ ] 포지션 크기 계산 정확성 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 회로차단기 발동
    Tool: Bash (bun test)
    Steps:
      1. 일일 손실 -4.9% → 회로차단기 미발동, 주문 허용
      2. 일일 손실 -5.1% → 회로차단기 발동, 모든 주문 거부
      3. 수동 리셋 → 주문 재허용
    Expected Result: 정확한 임계값 발동, 수동 리셋만 허용
    Evidence: .sisyphus/evidence/task-18-circuit-breaker.txt
  ```

  **Commit**: YES (groups with T16-T17, T19-T22)

- [ ] 19. 페이퍼 트레이딩 엔진

  **What to do**:
  - `packages/trading-engine/src/paper/`:
    - `PaperTradingEngine`:
      - 가상 잔고 관리
      - 주문 시뮬레이션 (시장가 즉시 체결, 지정가 조건 체결)
      - 가상 포지션 추적
      - 실시간 P&L 계산
      - 수수료 시뮬레이션 (브로커별 수수료율)
      - 슬리피지 시뮬레이션 (configurable)
    - 30일 의무 기간 관리:
      - 사용자별 페이퍼 시작일 추적
      - 30일 미경과 시 실전 전환 차단
      - 페이퍼 성과 리포트

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 21
  - **Blocked By**: Tasks 17, 18

  **Acceptance Criteria**:
  - [ ] 가상 주문 체결 (시장가/지정가) 테스트
  - [ ] 수수료/슬리피지 반영 테스트
  - [ ] 30일 의무기간 로직 테스트
  - [ ] P&L 계산 정확성 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 페이퍼 트레이딩 수수료 반영
    Tool: Bash (bun test)
    Steps:
      1. 시장가 매수 100주 @ 50,000원, 수수료율 0.015%
      2. 체결 금액 = 5,000,000, 수수료 = 750원
      3. 잔고 차감 = 5,000,750원
    Expected Result: 수수료 정확히 반영
    Evidence: .sisyphus/evidence/task-19-paper-fees.txt

  Scenario: 30일 의무기간 검증
    Tool: Bash (bun test)
    Steps:
      1. 페이퍼 시작 15일차 → 실전 전환 시도 → PaperPeriodNotCompletedError
      2. 페이퍼 시작 31일차 → 실전 전환 → 성공
    Expected Result: 30일 미경과 시 실전 차단
    Evidence: .sisyphus/evidence/task-19-paper-period.txt
  ```

  **Commit**: YES (groups with T16-T18, T20-T22)

- [ ] 20. 백테스팅 엔진 (고급)

  **What to do**:
  - `packages/trading-engine/src/backtest/`:
    - `BacktestEngine`:
      - 전략 + 히스토리 데이터 → 가상 트레이딩 시뮬레이션
      - 수수료 반영 (브로커별 실제 수수료율)
      - 슬리피지 시뮬레이션 (고정/비율/볼륨 기반)
      - 멀티 타임프레임 지원 (1분/5분/1시간/1일)
    - `PerformanceAnalyzer`:
      - 총 수익률, 연간 수익률 (CAGR)
      - 최대 낙폭 (MDD)
      - 샤프 비율
      - 승률, 손익비
      - 거래 횟수, 평균 보유 기간
    - `DataProvider`:
      - CSV / JSON 히스토리 데이터 로더
      - 데이터 검증 (갭, 이상치 필터링)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
  - **Skills**: []
  - Reason: 정밀한 금융 시뮬레이션, 성과 지표 계산, 엣지 케이스 처리

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 34
  - **Blocked By**: Tasks 14, 15, 16

  **Acceptance Criteria**:
  - [ ] 알려진 결과로 백테스트 정확성 검증
  - [ ] 수수료/슬리피지 반영 후 수익률 차이 확인
  - [ ] 성과 지표 (MDD, 샤프, 승률) 계산 정확
  - [ ] 데이터 갭 처리 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 백테스트 정확성 검증
    Tool: Bash (bun test)
    Steps:
      1. 알려진 20일 가격 데이터 + MA 크로스오버 전략
      2. 수수료 0%, 슬리피지 0% → 기대 수익률과 비교
      3. 수수료 0.015% 추가 → 수익률 감소 확인
      4. MDD, 샤프 비율 계산 → 수동 계산 결과와 비교
    Expected Result: 수익률, MDD, 샤프 비율 모두 오차 0.01% 이내
    Evidence: .sisyphus/evidence/task-20-backtest-accuracy.txt

  Scenario: 빈 데이터 / 이상치 처리
    Tool: Bash (bun test)
    Steps:
      1. 빈 데이터 배열 → InsufficientDataError
      2. 음수 가격 포함 → 해당 행 필터링 + 경고
    Expected Result: 에러 처리, 이상치 필터링
    Evidence: .sisyphus/evidence/task-20-backtest-edge.txt
  ```

  **Commit**: YES (groups with T16-T19, T21-T22)

- [ ] 21. 자동매매 데몬

  **What to do**:
  - `packages/trading-engine/src/daemon/`:
    - `TradingDaemon`:
      - 전략별 실행 스케줄 관리
      - 시장 운영시간 기반 자동 시작/중지
      - 전략 실행 루프: 데이터 수집 → 시그널 분석 → 주문 실행
      - 동시 전략 실행 (Promise.allSettled)
      - 에러 격리 (한 전략 에러 → 다른 전략 영향 없음)
    - `ScheduleManager`:
      - 시장별 운영시간: KR(09:00-15:30), US(23:30-06:00 KST), Crypto(24시간)
      - 크론 기반 실행 주기 (1분/5분/1시간)
      - 공휴일/휴장일 처리
    - 데몬 시작/중지 CLI 명령:
      - `bun run daemon:paper` — 페이퍼 모드
      - `bun run daemon:live` — 실전 모드 (회로차단기 필수)
    - **런타임 주의**: 데몬은 장시간 실행 프로세스. Vercel 서버리스에서 실행 불가.
      - 개발: 로컬에서 `bun run daemon:paper`
      - 프로덕션: Railway / Fly.io / VPS에 별도 배포
      - Web API(Task 32)는 데몬 프로세스에 HTTP/WebSocket으로 통신
      - 데몬 미실행 시 API → "데몬 오프라인" 상태 반환 (crash 없음)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (다른 Wave 3 엔진 태스크와)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 8-15, 17, 18

  **Acceptance Criteria**:
  - [ ] 데몬 시작 → 전략 실행 루프 동작
  - [ ] 한 전략 에러 → 다른 전략 정상 실행
  - [ ] 시장 시간 외 → 자동 대기
  - [ ] `bun run daemon:paper` 명령 동작
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 데몬 에러 격리 검증
    Tool: Bash (bun test)
    Steps:
      1. 3개 전략 동시 실행, 2번째 전략 에러 발생
      2. 1번째, 3번째 전략 → 정상 실행 확인
      3. 에러 로그에 2번째 전략 에러 기록
    Expected Result: 에러 격리, 다른 전략 미영향
    Evidence: .sisyphus/evidence/task-21-daemon-isolation.txt

  Scenario: 데몬 CLI 구동
    Tool: interactive_bash (tmux)
    Steps:
      1. tmux에서 bun run daemon:paper 실행
      2. "Trading daemon started in PAPER mode" 메시지 확인
      3. Ctrl+C → 정상 종료 메시지
    Expected Result: 시작/종료 정상
    Evidence: .sisyphus/evidence/task-21-daemon-cli.txt
  ```

  **Commit**: YES (groups with T16-T20, T22)

- [ ] 22. 알림 시스템 + 텔레그램 봇

  **What to do**:
  - `packages/trading-engine/src/notifications/`:
    - `NotificationManager`:
      - 다중 채널 지원 (Console, Webhook, Email, Telegram)
      - 알림 유형: 주문체결, 에러, 회로차단기, 일일리포트
      - 알림 큐 + 배치 처리 (스팸 방지)
      - 알림 템플릿 시스템
    - `ConsoleNotifier`: 개발용 콘솔 출력
    - `WebhookNotifier`: 커스텀 웹훅 URL 호출
  - `packages/trading-engine/src/telegram/`:
    - `TelegramBot`:
      - 봇 명령어: /status, /positions, /orders, /stop, /start
      - 거래 알림 자동 전송
      - 인라인 키보드 (전략 선택, 확인/취소)
      - 사용자 인증 (Telegram ID ↔ Alphix 계정 연결)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 37
  - **Blocked By**: Task 3

  **Acceptance Criteria**:
  - [ ] Console/Webhook 알림 발송 테스트
  - [ ] 텔레그램 봇 명령어 핸들링 테스트 (mock)
  - [ ] 알림 큐 배치 처리 테스트
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 알림 배치 처리
    Tool: Bash (bun test)
    Steps:
      1. 1초 내 10개 알림 발생 → 배치로 묶어 1개 발송
      2. 알림 내용에 10개 이벤트 요약 포함
    Expected Result: 스팸 방지, 배치 발송
    Evidence: .sisyphus/evidence/task-22-notification-batch.txt

  Scenario: 텔레그램 봇 명령어
    Tool: Bash (bun test)
    Steps:
      1. /status 명령 → 현재 전략 상태 + P&L 응답
      2. /stop 명령 → "모든 전략 중지" 확인 키보드
      3. 미인증 사용자 → "계정 연결 필요" 메시지
    Expected Result: 모든 명령어 핸들링, 미인증 차단
    Evidence: .sisyphus/evidence/task-22-telegram-bot.txt
  ```

  **Commit**: YES (groups with T16-T21)

- [ ] 23. 랜딩 페이지

  **What to do**:
  - `packages/web/src/app/(landing)/page.tsx`:
    - Hero 섹션: 타이틀, 서브타이틀, CTA 버튼 (회원가입/데모)
    - Features 섹션: 3-4개 핵심 기능 카드 (한국 주식 특화, 노코드 전략, 백테스팅)
    - 지원 브로커 섹션: 6개 브로커 로고/설명
    - 전략 섹션: 6개 전략 요약
    - 요금제 섹션: Free/Basic/Pro 비교 테이블
    - FAQ 섹션: 아코디언
    - CTA 섹션: 베타 테스터 모집
    - 푸터: 링크, 법적 고지, 투자 위험 고지
  - SEO: 메타데이터, Open Graph, JSON-LD
  - 애니메이션: 스크롤 기반 fade-in (framer-motion)
  - 반응형: 모바일 first

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (Web Pages)
  - **Blocks**: Task 36
  - **Blocked By**: Task 4

  **References**:
  **Pattern References**:
  - 기존 Alphix 랜딩: https://alphix.vercel.app — 레이아웃 및 섹션 구성 참고

  **Acceptance Criteria**:
  - [ ] 7개 섹션 렌더링
  - [ ] CTA 버튼 → /signup 이동
  - [ ] 반응형 (모바일/데스크톱)
  - [ ] Lighthouse Performance > 90

  **QA Scenarios**:
  ```
  Scenario: 랜딩 페이지 렌더링 및 네비게이션
    Tool: Playwright
    Preconditions: dev 서버 실행
    Steps:
      1. http://localhost:3000 접근 → 200 응답
      2. h1 태그 "한국 주식 자동매매" 텍스트 확인
      3. "무료로 시작하기" 버튼 클릭 → /signup 이동
      4. 스크롤 다운 → 요금제 섹션 visible
      5. 뷰포트 375px → 모바일 레이아웃 확인
    Expected Result: 모든 섹션 렌더링, 네비게이션 동작
    Evidence: .sisyphus/evidence/task-23-landing.png
  ```

  **Commit**: YES (groups with T24-T30)

- [ ] 24. 인증 페이지 (로그인/회원가입/비밀번호 찾기)

  **What to do**:
  - `packages/web/src/app/(auth)/login/page.tsx`
  - `packages/web/src/app/(auth)/signup/page.tsx`
  - `packages/web/src/app/(auth)/forgot-password/page.tsx`
  - AuthLayout 사용 (센터 카드)
  - 폼 필드: 이메일, 비밀번호, 이름(회원가입만)
  - 소셜 로그인 버튼 (Google, Kakao) — UI만 (프로바이더 연동은 Supabase Auth)
  - 이메일 확인 안내 페이지
  - 폼 검증 (zod + react-hook-form)
  - 에러 메시지 한글화
  - 로딩 상태, 비활성화 처리

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (Web Pages)
  - **Blocks**: Task 36
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 로그인/회원가입/비밀번호찾기 3개 페이지 렌더링
  - [ ] 폼 검증 동작 (빈 필드, 잘못된 이메일 형식)
  - [ ] Supabase Auth 연동 (실제 로그인/회원가입)
  - [ ] 에러 메시지 한글

  **QA Scenarios**:
  ```
  Scenario: 회원가입 → 로그인 흐름
    Tool: Playwright
    Steps:
      1. /signup 접근 → 회원가입 폼 표시
      2. 빈 제출 → "이메일을 입력해주세요" 에러 표시
      3. test@example.com / Password123! 입력 → 제출
      4. 이메일 확인 안내 페이지 표시
      5. /login → 동일 계정으로 로그인
      6. /dashboard로 리다이렉트
    Expected Result: 전체 인증 흐름 정상
    Evidence: .sisyphus/evidence/task-24-auth-flow.png
  ```

  **Commit**: YES (groups with T23, T25-T30)

- [ ] 25. 대시보드 페이지

  **What to do**:
  - `packages/web/src/app/(dashboard)/dashboard/page.tsx`:
    - 포트폴리오 요약 카드: 총 자산, 일일 P&L, 총 수익률
    - 자산 추이 차트 (라인 차트, 7/30/90일)
    - 활성 전략 목록 (상태, 수익률, 마지막 실행)
    - 최근 거래 내역 (최근 10건)
    - 보유 포지션 테이블
    - 시장 현황 위젯 (KOSPI/KOSDAQ 지수, BTC 가격)
    - 실시간 업데이트 준비 (데이터 fetching hooks)
  - MainLayout 사용 (사이드바 + 헤더)
  - 목업 데이터로 초기 렌더링

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (Web Pages)
  - **Blocks**: Task 37
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 6개 위젯 렌더링 (요약 카드, 차트, 전략 목록, 거래내역, 포지션, 시장현황)
  - [ ] 차트 기간 전환 (7/30/90일)
  - [ ] 반응형 레이아웃
  - [ ] 사이드바 네비게이션 동작

  **QA Scenarios**:
  ```
  Scenario: 대시보드 위젯 렌더링
    Tool: Playwright
    Preconditions: 로그인 상태
    Steps:
      1. /dashboard 접근
      2. "총 자산" 카드 visible
      3. 차트 영역 visible, "30일" 탭 기본 선택
      4. "7일" 클릭 → 차트 업데이트
      5. "최근 거래" 테이블 → 행 존재
    Expected Result: 모든 위젯 렌더링, 인터랙션 동작
    Evidence: .sisyphus/evidence/task-25-dashboard.png
  ```

  **Commit**: YES (groups with T23-T24, T26-T30)

- [ ] 26. 전략 관리 페이지

  **What to do**:
  - `packages/web/src/app/(dashboard)/strategies/page.tsx`:
    - 전략 목록 (카드 그리드뷰)
    - 각 전략 카드: 이름, 타입, 상태(활성/비활성), 수익률, 브로커
    - 전략 생성 다이얼로그:
      - 전략 타입 선택 (6개)
      - 파라미터 설정 (전략별 다른 폼)
      - 브로커 선택
      - 실전/페이퍼 모드 선택
    - 전략 상세/편집 페이지
    - 전략 활성화/비활성화 토글
    - 전략별 수익률 미니 차트
    - 요금제에 따른 전략 수 제한 표시

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 36
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 전략 목록 렌더링 (카드 그리드)
  - [ ] 전략 생성 다이얼로그 → 타입별 파라미터 폼
  - [ ] 활성화/비활성화 토글 동작
  - [ ] 요금제 제한 표시 ("Free: 1/1 전략 사용 중")

  **QA Scenarios**:
  ```
  Scenario: 전략 생성 흐름
    Tool: Playwright
    Steps:
      1. /strategies 접근 → "새 전략" 버튼 클릭
      2. 다이얼로그 → "MA 크로스오버" 선택
      3. shortPeriod=5, longPeriod=20 입력
      4. 브로커: "KIS 국내주식" 선택
      5. "생성" 클릭 → 전략 목록에 새 카드 추가
    Expected Result: 전략 생성 성공, 목록 업데이트
    Evidence: .sisyphus/evidence/task-26-strategy-create.png
  ```

  **Commit**: YES (groups with T23-T25, T27-T30)

- [ ] 27. 백테스팅 페이지

  **What to do**:
  - `packages/web/src/app/(dashboard)/backtest/page.tsx`:
    - 백테스트 설정 폼:
      - 전략 선택
      - 종목 선택 (검색 + 자동완성)
      - 기간 선택 (날짜 피커)
      - 초기 자본금
      - 수수료/슬리피지 설정
    - 백테스트 결과 화면:
      - 자산 곡선 차트 (벤치마크 비교)
      - 성과 지표 카드 (수익률, MDD, 샤프, 승률)
      - 거래 내역 테이블
      - 월별 수익률 히트맵
    - 백테스트 이력 목록
    - 로딩 상태 (프로그레스 바)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 36
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 백테스트 설정 폼 렌더링
  - [ ] 결과 페이지: 차트 + 지표 + 거래내역
  - [ ] 히스토리 목록 표시
  - [ ] 로딩 상태 표시

  **QA Scenarios**:
  ```
  Scenario: 백테스트 실행 및 결과 표시
    Tool: Playwright
    Steps:
      1. /backtest 접근 → 설정 폼 표시
      2. MA 크로스오버 선택, 삼성전자(005930), 최근 1년
      3. "백테스트 실행" 클릭 → 프로그레스 바 표시
      4. 결과 페이지 → 자산 곡선 차트 visible
      5. 성과 지표 카드 → "수익률", "MDD", "샤프" 값 표시
    Expected Result: 설정→실행→결과 흐름 정상
    Evidence: .sisyphus/evidence/task-27-backtest-page.png
  ```

  **Commit**: YES (groups with T23-T26, T28-T30)

- [ ] 28. 거래 내역 + 포트폴리오 페이지

  **What to do**:
  - `packages/web/src/app/(dashboard)/portfolio/page.tsx`:
    - 보유 포지션 테이블 (종목, 수량, 평균가, 현재가, P&L, 수익률)
    - 포지션 비중 파이 차트
    - 브로커별 자산 분류
  - `packages/web/src/app/(dashboard)/history/page.tsx`:
    - 거래 내역 테이블 (날짜, 종목, 매수/매도, 수량, 가격, 상태)
    - 필터: 날짜 범위, 종목, 브로커, 전략
    - 페이지네이션
    - CSV 다운로드

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 36
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 포트폴리오: 포지션 테이블 + 파이 차트
  - [ ] 거래 내역: 필터 + 페이지네이션
  - [ ] CSV 다운로드 동작

  **QA Scenarios**:
  ```
  Scenario: 거래 내역 필터링
    Tool: Playwright
    Steps:
      1. /history 접근 → 전체 내역 표시
      2. 날짜 필터: 최근 7일 → 테이블 업데이트
      3. 브로커 필터: "KIS" → KIS 거래만 표시
      4. "CSV 다운로드" 클릭 → 파일 다운로드
    Expected Result: 필터 적용, CSV 다운로드 동작
    Evidence: .sisyphus/evidence/task-28-history-filter.png
  ```

  **Commit**: YES (groups with T23-T27, T29-T30)

- [ ] 29. 설정 페이지

  **What to do**:
  - `packages/web/src/app/(dashboard)/settings/page.tsx`:
    - 프로필 설정 (이름, 이메일)
    - 브로커 API 키 관리:
      - 브로커별 API 키 입력/수정/삭제
      - 암호화 저장 (AES-256-GCM)
      - 연결 테스트 버튼
    - 알림 설정 (이메일/텔레그램 ON/OFF)
    - 텔레그램 연동 (봇 연결 가이드 + 인증코드)
    - 구독 관리 (현재 플랜, 업그레이드/다운그레이드)
    - 위험 관리 설정 (일일 손실 한도, 최대 포지션)
    - 계정 삭제

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 36
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 프로필/브로커/알림/구독/리스크 탭 렌더링
  - [ ] API 키 입력 → 마스킹 처리 (****xxxx)
  - [ ] 연결 테스트 버튼 동작 (성공/실패 표시)
  - [ ] 계정 삭제 확인 다이얼로그

  **QA Scenarios**:
  ```
  Scenario: 브로커 API 키 설정
    Tool: Playwright
    Steps:
      1. /settings → "브로커" 탭 클릭
      2. "KIS 국내주식" → API 키 입력 필드
      3. "abc123" 입력 → 즉시 마스킹 (****23)
      4. "연결 테스트" 클릭 → "연결 성공" 또는 "연결 실패" 배지
    Expected Result: 키 마스킹, 연결 테스트 동작
    Evidence: .sisyphus/evidence/task-29-settings-broker.png
  ```

  **Commit**: YES (groups with T23-T28, T30)

- [ ] 30. 관리자 패널

  **What to do**:
  - `packages/web/src/app/(admin)/admin/page.tsx`:
    - 사용자 관리: 목록, 검색, 구독 상태, 차단
    - 구독 통계: 티어별 사용자 수, MRR(월 반복 수익)
    - 시스템 모니터링: 활성 데몬 수, 전략 실행 현황
    - 거래 현황: 전체 주문 수, 성공률, 에러율
    - 관리자 전용 미들웨어 (admin 역할 확인)
  - 관리자 계정 시딩 스크립트

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 36
  - **Blocked By**: Tasks 4, 7

  **Acceptance Criteria**:
  - [ ] 사용자 목록/검색 동작
  - [ ] 구독 통계 차트
  - [ ] 비관리자 접근 → 403
  - [ ] 관리자 시드 스크립트 동작

  **QA Scenarios**:
  ```
  Scenario: 관리자 접근 제어
    Tool: Playwright
    Steps:
      1. 일반 사용자로 /admin 접근 → 403 또는 리다이렉트
      2. 관리자로 /admin 접근 → 대시보드 표시
      3. 사용자 목록 → 테이블 렌더링
    Expected Result: 권한 기반 접근 제어 정상
    Evidence: .sisyphus/evidence/task-30-admin.png
  ```

  **Commit**: YES (groups with T23-T29)

### Wave 4: API Routes + Integration

- [ ] 31. API 라우트 — 인증 & 사용자

  **What to do**:
  - `packages/web/src/app/api/auth/`:
    - POST `/api/auth/signup` — 회원가입
    - POST `/api/auth/login` — 로그인
    - POST `/api/auth/logout` — 로그아웃
    - POST `/api/auth/forgot-password` — 비밀번호 재설정
    - GET `/api/auth/me` — 현재 사용자 정보
    - PATCH `/api/auth/profile` — 프로필 수정
  - 모든 라우트에 zod 입력 검증
  - Supabase Auth 연동
  - Rate Limiting (IP 기반)
  - 에러 응답 표준화 ({ error: string, code: string })

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 35
  - **Blocked By**: Tasks 2, 7

  **Acceptance Criteria**:
  - [ ] 6개 엔드포인트 동작
  - [ ] 입력 검증 (잘못된 이메일 → 400)
  - [ ] Rate Limiting (10회/분 초과 → 429)
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 인증 API 흐름
    Tool: Bash (curl)
    Steps:
      1. curl -X POST /api/auth/signup -d '{"email":"test@test.com","password":"Test123!"}' → 201
      2. curl -X POST /api/auth/login -d '{"email":"test@test.com","password":"Test123!"}' → 200 + token
      3. curl -X GET /api/auth/me -H "Authorization: Bearer <token>" → 200 + user info
      4. curl -X POST /api/auth/signup -d '{"email":"bad"}' → 400 + error
    Expected Result: CRUD 동작, 검증 에러 처리
    Evidence: .sisyphus/evidence/task-31-auth-api.txt
  ```

  **Commit**: YES (groups with T32-T34)

- [ ] 32. API 라우트 — 트레이딩 & 주문

  **What to do**:
  - `packages/web/src/app/api/trading/`:
    - POST `/api/trading/orders` — 주문 생성
    - GET `/api/trading/orders` — 주문 목록 (필터, 페이지네이션)
    - DELETE `/api/trading/orders/:id` — 주문 취소
    - GET `/api/trading/positions` — 보유 포지션
    - GET `/api/trading/balance` — 계좌 잔고
    - POST `/api/trading/daemon/start` — 데몬 시작 (데몬 프로세스에 HTTP 요청 전달)
    - POST `/api/trading/daemon/stop` — 데몬 중지
    - GET `/api/trading/daemon/status` — 데몬 상태 (데몬 오프라인 시 `{ status: "offline" }` 반환, 에러 없음)
    - **주의**: 데몬은 별도 프로세스(로컬/Railway). 이 API는 데몬에 HTTP 프록시하는 역할. 데몬 URL은 환경변수 `DAEMON_URL`로 설정.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 2, 17

  **Acceptance Criteria**:
  - [ ] 8개 엔드포인트 동작
  - [ ] 인증 필수 (비인증 → 401)
  - [ ] 주문 검증 (잔고 부족 → 400)
  - [ ] 페이지네이션 동작

  **QA Scenarios**:
  ```
  Scenario: 주문 API 흐름
    Tool: Bash (curl)
    Steps:
      1. curl POST /api/trading/orders (authenticated) → 201 + order
      2. curl GET /api/trading/orders?page=1&limit=10 → 200 + paginated list
      3. curl DELETE /api/trading/orders/123 → 200 + cancelled
      4. curl POST /api/trading/orders (unauthenticated) → 401
    Expected Result: CRUD + 인증 + 페이지네이션 동작
    Evidence: .sisyphus/evidence/task-32-trading-api.txt
  ```

  **Commit**: YES (groups with T31, T33-T34)

- [ ] 33. API 라우트 — 전략 관리

  **What to do**:
  - `packages/web/src/app/api/strategies/`:
    - GET `/api/strategies` — 전략 목록
    - POST `/api/strategies` — 전략 생성
    - PATCH `/api/strategies/:id` — 전략 수정
    - DELETE `/api/strategies/:id` — 전략 삭제
    - POST `/api/strategies/:id/activate` — 활성화
    - POST `/api/strategies/:id/deactivate` — 비활성화
  - 요금제별 전략 수 제한 검증

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 2, 14, 15

  **Acceptance Criteria**:
  - [ ] 6개 엔드포인트 동작
  - [ ] Free 티어: 2번째 전략 생성 → 403 + "요금제 업그레이드 필요"
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 전략 요금제 제한
    Tool: Bash (curl)
    Steps:
      1. Free 사용자 → 전략 1개 생성 → 201
      2. Free 사용자 → 전략 2번째 생성 → 403 + "upgrade required"
      3. Basic 사용자 → 전략 3개 생성 → 각각 201
    Expected Result: 티어별 제한 정확 적용
    Evidence: .sisyphus/evidence/task-33-strategy-limit.txt
  ```

  **Commit**: YES (groups with T31-T32, T34)

- [ ] 34. API 라우트 — 백테스팅 & 데이터

  **What to do**:
  - `packages/web/src/app/api/backtest/`:
    - POST `/api/backtest/run` — 백테스트 실행
    - GET `/api/backtest/results` — 결과 목록
    - GET `/api/backtest/results/:id` — 결과 상세
  - `packages/web/src/app/api/data/`:
    - GET `/api/data/market/:symbol` — 시세 조회
    - GET `/api/data/search?q=` — 종목 검색
  - 요금제별 백테스트 횟수 제한 (Free: 5회/월)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 2, 20

  **Acceptance Criteria**:
  - [ ] 5개 엔드포인트 동작
  - [ ] Free 사용자 백테스트 6번째 → 429
  - [ ] 종목 검색 자동완성 동작

  **QA Scenarios**:
  ```
  Scenario: 백테스트 API 흐름
    Tool: Bash (curl)
    Steps:
      1. POST /api/backtest/run → 202 (비동기 실행)
      2. GET /api/backtest/results → 200 + list
      3. GET /api/data/search?q=삼성 → 200 + 검색 결과
    Expected Result: 비동기 실행, 검색 동작
    Evidence: .sisyphus/evidence/task-34-backtest-api.txt
  ```

  **Commit**: YES (groups with T31-T33)

- [ ] 35. 토스페이먼츠 결제 통합

  **What to do**:
  - `packages/web/src/app/api/payments/`:
    - POST `/api/payments/subscribe` — 구독 결제 (토스 빌링키)
    - POST `/api/payments/webhook` — 토스 웹훅 처리
    - DELETE `/api/payments/cancel` — 구독 취소
    - GET `/api/payments/status` — 구독 상태 조회
  - 토스페이먼츠 SDK 연동:
    - 빌링키 발급 (카드 등록)
    - 정기 결제 (월 구독)
    - 결제 실패 처리 + 재시도
    - 웹훅 시그니처 검증
  - 구독 상태 관리:
    - 결제 성공 → 티어 업그레이드
    - 결제 실패 → 유예 기간 (3일) → 다운그레이드
    - 취소 → 현재 기간 끝까지 유지

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 2, 31

  **References**:
  **External References**:
  - 토스페이먼츠 개발자 문서: https://docs.tosspayments.com/ — 빌링키, 정기결제, 웹훅

  **Acceptance Criteria**:
  - [ ] 테스트 모드 결제 동작
  - [ ] 웹훅 시그니처 검증
  - [ ] 구독 상태 전이 (결제→활성→취소→만료)
  - [ ] `bun test` → 전체 PASS

  **QA Scenarios**:
  ```
  Scenario: 구독 결제 흐름 (테스트 모드)
    Tool: Playwright
    Steps:
      1. /settings → 구독 → "Basic 업그레이드" 클릭
      2. 토스 테스트 결제창 → 카드 정보 입력 (테스트 카드)
      3. 결제 완료 → 구독 상태 "Basic" 으로 변경
      4. 전략 3개 생성 가능 확인
    Expected Result: 결제→구독 업그레이드→기능 해제
    Evidence: .sisyphus/evidence/task-35-toss-payment.png

  Scenario: 결제 실패 처리
    Tool: Bash (curl)
    Steps:
      1. POST /api/payments/webhook (결제 실패 이벤트) → 200
      2. 구독 상태 → "유예 기간" (3일)
      3. 3일 후 자동 다운그레이드 확인
    Expected Result: 유예 기간 → 다운그레이드
    Evidence: .sisyphus/evidence/task-35-payment-failure.txt
  ```

  **Commit**: YES (groups with T36-T37)

- [ ] 36. PWA 설정 (매니페스트, 서비스 워커, 푸시 알림)

  **What to do**:
  - `packages/web/public/manifest.json`: 앱 이름, 아이콘, 테마 색상
  - 서비스 워커 (`next-pwa` 또는 `serwist`):
    - 오프라인 캐싱 (앱 셸 + 정적 자산)
    - 네트워크 우선 전략 (API 호출)
  - 푸시 알림:
    - FCM(Firebase Cloud Messaging) 또는 Web Push API
    - 알림 권한 요청 UI
    - 거래 체결 / 에러 / 일일 리포트 알림
  - 앱 아이콘 세트 (192x192, 512x512)
  - iOS/Android 설치 배너

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 23-30

  **Acceptance Criteria**:
  - [ ] PWA 설치 가능 (Chrome "앱 설치" 프롬프트)
  - [ ] 오프라인 접근 시 캐시된 앱 셸 표시
  - [ ] 푸시 알림 권한 요청 및 수신

  **QA Scenarios**:
  ```
  Scenario: PWA 설치 및 오프라인
    Tool: Playwright
    Steps:
      1. Chrome에서 http://localhost:3000 접근
      2. Lighthouse PWA 검사 → installable 확인
      3. 네트워크 오프라인 → 앱 셸 표시 (크래시 없음)
    Expected Result: PWA installable, 오프라인 동작
    Evidence: .sisyphus/evidence/task-36-pwa.png
  ```

  **Commit**: YES (groups with T35, T37)

- [ ] 37. 모니터링 & 알림 대시보드

  **What to do**:
  - `packages/web/src/app/(dashboard)/monitoring/page.tsx`:
    - 실시간 거래 로그 (스트리밍 테이블)
    - 전략별 P&L 실시간 차트
    - 에러 로그 (최근 에러, 심각도, 발생 시간)
    - 시스템 상태: 데몬 상태, WebSocket 연결 상태, 브로커 연결 상태
    - 알림 센터: 읽지 않은 알림 목록, 읽음 처리
  - 실시간 업데이트 (Server-Sent Events 또는 polling)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 38
  - **Blocked By**: Tasks 22, 25

  **Acceptance Criteria**:
  - [ ] 거래 로그 실시간 스트리밍
  - [ ] 에러 로그 심각도별 색상 코딩
  - [ ] 시스템 상태 카드 렌더링
  - [ ] 알림 읽음 처리

  **QA Scenarios**:
  ```
  Scenario: 모니터링 대시보드 렌더링
    Tool: Playwright
    Steps:
      1. /monitoring 접근 → 거래 로그 테이블 visible
      2. 시스템 상태 카드 → "데몬: 중지됨" 표시
      3. 알림 아이콘 → 배지 숫자 → 클릭 → 알림 목록
    Expected Result: 모든 모니터링 위젯 렌더링
    Evidence: .sisyphus/evidence/task-37-monitoring.png
  ```

  **Commit**: YES (groups with T35-T36)

- [ ] 38. 프론트엔드-백엔드 통합 연결

  **What to do**:
  - 모든 웹 페이지 ↔ API 라우트 연결:
    - React hooks: `useSWR` 또는 `@tanstack/react-query` 기반 데이터 fetching
    - 전역 API 클라이언트 (`packages/web/src/lib/api.ts`)
    - 에러 바운더리 + Toast 알림
    - 낙관적 업데이트 (주문, 전략 토글)
    - 목업 데이터 → 실제 API 데이터로 교체
  - 트레이딩 엔진 ↔ API 연결:
    - API 라우트에서 trading-engine 패키지 import
    - 데몬 시작/중지 명령 연결
    - 백테스트 실행 연결
  - End-to-end 흐름 검증:
    - 회원가입 → 로그인 → 브로커 설정 → 전략 생성 → 백테스트 → 페이퍼 트레이딩

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: 전체 시스템 통합, 경합 조건 해결, E2E 검증

  **Parallelization**:
  - **Can Run In Parallel**: NO (최종 통합)
  - **Parallel Group**: Wave 4 마지막
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 23-37

  **Acceptance Criteria**:
  - [ ] 모든 페이지에서 실제 API 데이터 표시 (목업 0개)
  - [ ] E2E 흐름: 회원가입 → 대시보드 → 전략 생성 → 백테스트
  - [ ] 에러 시 Toast 알림 표시
  - [ ] 낙관적 업데이트 동작 (전략 토글)
  - [ ] `bun run build` → 에러 0

  **QA Scenarios**:
  ```
  Scenario: E2E 전체 사용자 흐름
    Tool: Playwright
    Preconditions: 클린 환경 (DB 초기화)
    Steps:
      1. /signup → 새 계정 생성
      2. 이메일 확인 (또는 자동 확인 설정)
      3. /login → 로그인
      4. /dashboard → 빈 대시보드 표시
      5. /settings → 브로커 API 키 설정 (mock)
      6. /strategies → "새 전략" → MA 크로스오버 → 생성
      7. /backtest → 백테스트 실행 → 결과 표시
      8. /strategies → 전략 활성화 (페이퍼 모드)
      9. /monitoring → 거래 로그 표시
      10. /settings → 구독 → Basic 업그레이드
    Expected Result: 전체 흐름 end-to-end 동작
    Failure Indicators: 404, 500 에러, 빈 데이터, 무한 로딩
    Evidence: .sisyphus/evidence/task-38-e2e-flow.png

  Scenario: API 에러 핸들링
    Tool: Playwright
    Steps:
      1. 네트워크 오프라인 → API 호출 → Toast "네트워크 오류" 표시
      2. 존재하지 않는 전략 조회 → Toast "전략을 찾을 수 없습니다" 표시
    Expected Result: 사용자 친화적 에러 메시지
    Evidence: .sisyphus/evidence/task-38-error-handling.png
  ```

  **Commit**: YES
  - Message: `feat(integration): connect frontend to backend end-to-end`
  - Files: `packages/web/src/`
  - Pre-commit: `bun run build && bun run test`

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + linter + `bun run test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names (data/result/item/temp). **TDD compliance 검증 방법** (git log가 아닌): (1) 모든 엔진 모듈(`packages/trading-engine/src/`)에 대응하는 `.test.ts` 파일 존재 확인 (glob 패턴 매칭), (2) `bun test --coverage` 실행 → 엔진 모듈 커버리지 80%+ 확인, (3) 테스트 파일이 구현체를 import하고 있는지 확인 (테스트가 실제 코드를 검증). Git history 기반 증빙은 사용하지 않음 (wave 단위 커밋에서는 불가).
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Coverage [N%] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (`bun install && npx supabase start && bun run dev`). 환경: `.env.test` 사용 (로컬 Supabase + mock 브로커). Execute EVERY QA scenario from EVERY task. Test full user flows: signup → dashboard → create strategy → run backtest → enable paper trading → monitor. 브로커 연결은 **mock 모드**로 검증 (실제 API 호출 없음). 토스페이먼츠는 **테스트 모드**로 검증 (`.env.test`의 테스트 키 사용). 텔레그램 봇은 **mock 모드** (실제 봇 토큰 불필요). PWA install 검증. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Files |
|------|--------|---------|-------|
| 1 | T1 | `chore(scaffold): init turborepo monorepo with next.js 15` | root configs, packages/ |
| 1 | T2+T3 | `feat(shared): add supabase schema, types, and interfaces` | packages/shared/ |
| 1 | T4+T5 | `chore(web): setup shadcn/ui, tailwind, eslint, prettier` | packages/web/ |
| 1 | T6+T7 | `feat(auth): supabase auth with encryption utils` | packages/shared/, packages/web/ |
| 2 | T8-T13 | `feat(broker): add 6 broker adapters (KIS/Alpaca/Kiwoom/Binance/Upbit)` | packages/trading-engine/broker/ |
| 2 | T14+T15 | `feat(strategy): add 6 strategies (MA/RSI/BB/MACD/Grid/AI)` | packages/trading-engine/strategy/ |
| 3 | T16-T22 | `feat(engine): order mgmt, risk, paper, backtest, daemon, notifications` | packages/trading-engine/ |
| 3 | T23-T30 | `feat(web): add all 8 pages (landing to admin)` | packages/web/app/ |
| 4 | T31-T34 | `feat(api): add 16 API routes` | packages/web/app/api/ |
| 4 | T35-T37 | `feat(integration): toss payments, pwa, monitoring` | packages/web/ |
| 4 | T38 | `feat(integration): connect frontend to backend` | packages/web/ |
| FINAL | F1-F4 | `chore(verify): final QA and compliance audit` | .sisyphus/evidence/ |

---

## Success Criteria

### Verification Commands
```bash
cd ~/projects/alphix && bun install     # Expected: no errors
bun run build                            # Expected: build success
bun run test                             # Expected: 120+ tests, 0 failures
bun run dev                              # Expected: http://localhost:3000 accessible
bun run lint                             # Expected: 0 errors
```

### Final Checklist
- [ ] All "Must Have" present (6 brokers, 6 strategies, TDD, encryption, circuit breaker, RLS, etc.)
- [ ] All "Must NOT Have" absent (no native app, no `as any`, no hardcoded secrets, etc.)
- [ ] All tests pass (120+ with bun test)
- [ ] Full user flow works: signup → dashboard → strategy → backtest → paper trade
- [ ] All 6 brokers connect in paper mode
- [ ] Toss Payments test mode subscription works
- [ ] PWA installable + push notifications
- [ ] Telegram bot responds to commands
- [ ] Admin panel accessible with proper auth
- [ ] Monitoring dashboard shows real-time data
