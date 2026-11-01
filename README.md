# 카러플 군 계산기

카트라이더 러쉬플러스 군표 계산 · 엘칭방 군체크 사이트.
**Astro 5 + TypeScript → Cloudflare Workers** (D1 · KV · Durable Objects(SQLite) 사용, R2 미사용)

| 기능 | 저장소 |
|---|---|
| 회원(아이디+비번, PBKDF2) · 저장된 군표 | D1 |
| 로그인 세션 · 점수표 설정 · 로그인 시도 제한 | KV |
| 엘칭방 실시간 군체크 | Durable Object (SQLite) |

## 배포 (GitHub 에 push 하면 끝)
Actions 가 D1·KV 생성 → 마이그레이션 → 빌드 → 배포 → 관리자 시크릿 반영까지 자동으로 합니다.

**1) Cloudflare API 토큰 만들기**
대시보드 → My Profile → API Tokens → Create Token → *Custom token*, 권한:
- Account · Workers Scripts · Edit
- Account · D1 · Edit
- Account · Workers KV Storage · Edit

계정 ID 는 대시보드 우측(Workers & Pages 개요)에서 복사합니다.

**2) GitHub 저장소 → Settings → Secrets and variables → Actions → New repository secret** 에 4개 등록

| 이름 | 값 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | 위에서 만든 토큰 |
| `CLOUDFLARE_ACCOUNT_ID` | 계정 ID |
| `ADMIN_ID` | 관리자 아이디 |
| `ADMIN_PASSWORD` | 관리자 비밀번호 |

**3) push**
```bash
git init && git add . && git commit -m "init"
git branch -M main
git remote add origin https://github.com/<내계정>/<저장소>.git
git push -u origin main
```
Actions 탭에서 *Deploy to Cloudflare* 가 초록색이면 완료입니다. 주소는 `https://carrush-goon-calc.<서브도메인>.workers.dev` 입니다.
관리자 비밀번호를 바꾸려면 GitHub Secret 을 수정하고 Actions 를 다시 실행(Run workflow)하세요.

## 도메인/SEO
1. `astro.config.mjs` 의 `site` 를 실제 도메인으로 변경
2. `public/robots.txt` 의 `Sitemap:` 주소 변경
3. Google Search Console / 네이버 서치어드바이저에 `https://도메인/sitemap.xml` 제출

## 로컬 개발
```bash
cp .dev.vars.example .dev.vars   # 관리자 계정 입력
npm run db:migrate:local
npm run preview                  # wrangler dev (D1/KV/DO 로컬 에뮬레이션)
```

## 구조
```
src/worker.ts          Worker 진입점 + ClubRoom(Durable Object)
src/lib/auth.ts        해시, 세션, 점수표, 시도 제한
src/pages/             index(군표) · room(군체크) · login · admin · 404 · sitemap.xml
src/pages/api/         auth · scores · check · admin
migrations/            D1 스키마
```
