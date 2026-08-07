import { createTheme, type MantineColorsTuple, type CSSVariablesResolver } from '@mantine/core';

// ─────────────────────────────────────────────────────────────
// theme.ts — 시스템 전체에서 hex가 사는 "유일한" 파일 (헌법 3·8).
// 컴포넌트는 hex를 직접 안 본다. 오직 역할 이름(primary/neutral/text.*/...)만 참조.
// ※ 값(hex·px)은 전부 화면 검증에서 조정할 잠정값. 구조·관계만 확정이다.
// ─────────────────────────────────────────────────────────────

// 색 사다리 (각 10칸: index 0 = 50(가장 밝음) … 9 = 900(가장 어두움)) ─────────

// primary = 미지수 그릇. 지금은 navy(hue 216). index 6(#1E4178)이 메인.
// 회사가 바뀌면 이 배열만 통째로 교체 → 전체 화면이 따라온다.
const primary: MantineColorsTuple = [
  '#EEF2F9', '#D6E0F0', '#B0C2DF', '#7E9AC6', '#4F72AB',
  '#2F5490', '#1E4178', '#173360', '#11264A', '#0B1A35',
];

// neutral = f(primary). primary와 같은 hue(216), 채도만 ~7%로 죽인 차가운 회색.
const neutral: MantineColorsTuple = [
  '#F8F9FA', '#F1F2F4', '#E2E4E9', '#CBCED6', '#9CA1AD',
  '#6E7480', '#4F545E', '#383C44', '#24272D', '#16181C',
];

// 상태색 — "A-deep(jewel-tone)" 개정(2026-07). Tailwind 기본 스케일이 곧 "AI/부트스트랩 어디서나 본 그 색"
// = 바이브 코딩 냄새의 주범이라, 각 색을 미묘한 사촌으로 옮기고 한 단계 깊게(heritage/premium). index 6 = 메인 솔리드.
//  · success  : 순green → forest jade(초록에 청록기 — cool 팔레트 정합)
//  · warning  : 순yellow → deep amber/honey(순노랑이 최대 tell이라 폐기. 예전 "더 노란 yellow" 결정을 뒤집음)
//  · danger   : 순red(소방차) → garnet(청색기 도는 깊은 로즈레드)
//  · info     : 순blue → deep indigo(네이비 primary와 근접하되 구분 — 남색 계열로 "한 식구")
// 값은 라이트 앵커 기반 10단계(대비 검증). 다크는 resolver가 text 역할에서 인덱스 낮춰 매핑(아래 semantic).
const success: MantineColorsTuple = [
  '#E7F4EF', '#C6E8DD', '#97D5C4', '#5FBFA6', '#2AA085',
  '#10896C', '#0B7357', '#0A5B45', '#084636', '#06342A',
];

const warning: MantineColorsTuple = [
  '#FAF0D8', '#F4E0AC', '#EAC873', '#DBAB3C', '#C08E1A',
  '#B07C10', '#A5700D', '#7A4E06', '#5A3A05', '#412A05',
];

const danger: MantineColorsTuple = [
  '#F9E6EB', '#F2C6D1', '#E79BAD', '#D96A87', '#C93F63',
  '#BE3352', '#B62E4A', '#8C1B38', '#691329', '#4C0D1E',
];

const info: MantineColorsTuple = [
  '#EBEDF9', '#D3D6F2', '#AEB4E7', '#8189D8', '#5A63C5',
  '#454FB6', '#3A46AE', '#2A3388', '#1F2666', '#161B49',
];

// ── 시맨틱 역할 (텍스트·배경·보더) — 모드 분기가 일어나는 "유일한" 층 ──────
// 컴포넌트(Title 등)는 text.primary만 참조하고 검정/흰색 분기를 모른다.
// 색이 뒤집히는 책임은 토큰(여기)이 진다. (02 "시맨틱 역할" 절)
// boder color는 독립 토큰이 아니라 neutral/primary 사다리를 참조한다(02).
const semantic = {
  text: {
    primary:   { light: neutral[9], dark: neutral[0] }, // 기본 본문·제목
    secondary: { light: neutral[6], dark: neutral[3] }, // 보조·흐림
    danger:    { light: danger[6],  dark: danger[4]  }, // 에러
    // success = 텍스트 어휘의 비대칭을 메운다. Badge·Icon·Stat은 success를 쓸 수 있는데 Text만 못 썼다
    //  (TextColor가 primary|secondary|danger 셋뿐이라, "확정됨"을 초록으로 쓰려면 raw span으로 내려가야 했다).
    //  danger와 같은 짜임(라이트=index 6, 다크=index 4)이라 새 규칙이 아니다.
    success:   { light: success[6], dark: success[4] },
    disabled:  { light: neutral[4], dark: neutral[6] },
  },
  bg: {
    primary:   { light: '#FFFFFF',  dark: neutral[9] }, // 기본 면
    secondary: { light: neutral[0], dark: neutral[8] }, // 표면(카드 등)
    tertiary:  { light: neutral[1], dark: '#0B0D10'  }, // 페이지 바닥 (카드보다 살짝 어두운 연회색, 잠정)
  },
  border: {
    default: { light: neutral[2], dark: neutral[7] }, // 기본 = neutral 200
    strong:  { light: neutral[3], dark: neutral[6] }, // 강조 = neutral 300
    focus:   { light: primary[6], dark: primary[4] }, // 포커스 = primary 600
    // field = 입력칸 윤곽 전용(데스크탑). default를 빌려 쓰던 것을 끊는다 — 그건 *구분선* 값이라
    //  입력칸이 섹션 헤어라인과 같은 색이 됐다(라이트 1.27:1, 칸과 선이 구분 불가).
    //  WCAG 1.4.11(비문자 대비 3:1)은 구분선엔 안 걸리고 **입력칸 경계**에 걸린다 — 그래서 역할을 가른다.
    //  ⚠ 값은 3:1(neutral[5])이 아니라 neutral[4] = **2.59:1로 의도적 미달**이다(06 §1-3).
    //   3:1 단은 데스크탑 폼에서 과하게 무겁다고 판단했고, 미달분은 고대비 모드(a11y.css)가 받는다.
    field:   { light: neutral[4], dark: neutral[5] },
    // fieldStrong = 고대비 모드에서만 쓰는 입력칸 경계. 3:1을 확실히 넘는 단(라이트 7.60:1).
    //  기본값(field 2.59:1 · 모바일 면 1.09:1)이 의도적 미달이므로, 그 미달분을 받는 자리가 필요하다.
    //  a11y.css의 prefers-contrast/forced-colors 블록에서만 참조한다.
    fieldStrong: { light: neutral[6], dark: neutral[3] },
  },
  // ── surface (containment 축) — "윤곽 대신 음영·톤으로 구획" (02 elevation 2축) ──
  // 섀도(=lift)와 분리된 별개 축이다: surface는 *톤*으로 "어디에 박혀 있나"를 말한다.
  //  · sunken  = 우묵한 well·페이지 바닥 (한 톤 낮춤, 섀도 0)
  //  · default = 카드·flush 본문 표면 (섀도 0 — 평면 영역)
  //  · raised  = 페이지 위에 *떠 있는* 타일/위젯 (--elevation-raised 와 짝)
  //  · overlay = 모달·드롭다운 (다른 UI 위에 뜬 레이어, --elevation-overlay 와 짝)
  // 규칙(Atlassian·Carbon·Material 수렴): raised/overlay만 그림자와 짝지운다.
  //   기본/평면/sunken엔 그림자 0. 한 위젯 내부 구획은 sunken·divider·여백으로(섀도 금지).
  // 다크: raised일수록 표면을 *밝게*(M3 — 다크에선 섀도 대신 톤으로 깊이).
  surface: {
    sunken:  { light: neutral[1], dark: neutral[9] }, // 페이지·well
    default: { light: '#FFFFFF',  dark: neutral[8] }, // 카드 본문
    raised:  { light: '#FFFFFF',  dark: neutral[7] }, // 떠 있는 위젯(+그림자)
    overlay: { light: '#FFFFFF',  dark: neutral[7] }, // 모달·드롭다운(+그림자)
    // input = 모바일 입력칸의 *면*. 모바일은 윤곽이 아니라 채움으로 "쓸 수 있는 자리"를 말한다(06 §3-3).
    //  ⚠ sunken을 재사용할 수 없다: 다크가 neutral[9]인데 모바일 페이지 배경(bg.primary 다크)과 **같은 값**이라
    //   다크에서 면이 통째로 사라진다. 다크는 M3 규칙대로 페이지보다 *밝은* 톤(neutral[8])을 쓴다.
    input:   { light: neutral[1], dark: neutral[8] },
  },
} as const;

// elevation(lift 축) — surface.raised/overlay 와 *짝으로만* 쓴다(섞지 말 것).
// 다층 저불투명 그림자(Tailwind·Material 패턴). flat은 키 없음(=그림자 0).
const elevation = {
  raised:  '0 1px 3px rgba(11, 26, 53, 0.08), 0 6px 20px rgba(11, 26, 53, 0.06)',
  overlay: '0 10px 32px rgba(11, 26, 53, 0.16)',
} as const;

// 타이포 6단계 {크기·굵기·행간}. body-strong = body 크기 + 굵게(강조). (단일 진실 공급원)
// 모듈 상수로 둬서 createTheme(other)와 resolver가 같은 값을 공유한다.
type TypographyStep =
  | 'display' | 'heading' | 'subheading' | 'body' | 'body-strong' | 'caption';
const typography: Record<TypographyStep, { fontSize: string; fontWeight: number; lineHeight: number }> = {
  display:       { fontSize: '1.75rem',  fontWeight: 700, lineHeight: 1.2 },
  heading:       { fontSize: '1.25rem',  fontWeight: 700, lineHeight: 1.3 },
  subheading:    { fontSize: '1rem',     fontWeight: 600, lineHeight: 1.4 },
  body:          { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
  'body-strong': { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
  caption:       { fontSize: '0.75rem',  fontWeight: 400, lineHeight: 1.4 },
};

// 모바일 타이포 스케일 — 데스크탑과 *다른 값*을 갖는다(같은 역할 이름, 다른 크기).
//  왜: 데스크탑 body 14px는 폰에서 심각하게 작다. iOS Dynamic Type(Large 기본)의 Body는 **17pt**이고
//  Toss도 이 대역이다. 데스크탑 스케일을 그대로 쓰면 21% 작아 답답해 보인다(화면 검증에서 확인).
//  적용 방식: 역할 변수 통로를 그대로 쓴다 — MobileShell 루트에 이 변수를 깔면 Text·Title·Badge 등
//  *모든* 자손이 자동으로 따라온다(원자는 여전히 크기를 모른다). 색·타이포가 같은 구조라 새 기제 0.
//  ※ **적용은 `_mobileScope.useMobileTypoScope()`가 한다(v0.73.2, 06 §1-9).** 여기는 값만 갖는다.
//    엘리먼트 스코프(.ms 인라인)만 쓰던 시절 구멍이 둘 있었다 — ① 포털(Drawer·Modal·Popover·Menu)은
//    DOM상 .ms 밖이라 데스크탑 값으로 떨어졌고(MobileDecisionBar·MobileAttachmentViewer의 메뉴가
//    여러 릴리스 동안 그랬다), ② 셸 크롬을 안 쓰는 자리에선 스케일이 통째로 사라졌다.
//    그래서 스코프는 **문서 루트**에 깔고 **크롬과 분리**한다.
const typographyMobile: Record<TypographyStep, { fontSize: string; fontWeight: number; lineHeight: number }> = {
  display:       { fontSize: '2.125rem',  fontWeight: 700, lineHeight: 1.2 },  // iOS Large Title 34
  heading:       { fontSize: '1.75rem',   fontWeight: 700, lineHeight: 1.25 }, // iOS Title1 28
  subheading:    { fontSize: '1.25rem',   fontWeight: 600, lineHeight: 1.35 }, // iOS Title3 20
  body:          { fontSize: '1.0625rem', fontWeight: 400, lineHeight: 1.55 }, // iOS Body 17 (한글이라 행간 넉넉히)
  'body-strong': { fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.45 }, // iOS Headline 17 semibold
  caption:       { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4 },  // iOS Footnote 13
};

const typoVarsOf = (t: Record<TypographyStep, { fontSize: string; fontWeight: number; lineHeight: number }>) =>
  Object.fromEntries(
    Object.entries(t).flatMap(([step, spec]) => [
      [`--typo-${step}-size`, spec.fontSize],
      [`--typo-${step}-weight`, String(spec.fontWeight)],
      [`--typo-${step}-lh`, String(spec.lineHeight)],
    ]),
  ) as Record<string, string>;

// 모바일 스코프에 깔 CSS 변수 묶음 — MobileShell이 루트 style로 적용한다(단일 출처는 여기).
export const mobileTypoVars: Record<string, string> = typoVarsOf(typographyMobile);

/**
 * **데스크탑 타이포로 되돌리는** 변수 묶음 — 06 §1-9(모바일 규격은 문서 단위)의 *유일한 예외* 통로다.
 *
 * 왜 필요한가: A4 장표는 **인쇄 좌표계**(794×1123 @96dpi)에 그려지고 그 캔버스는 데스크탑 타이포(body 14)를
 * 전제로 짜여 있다. 모바일 스코프 안에서 그대로 그리면 body가 17px이 되어 **794px 캔버스가 깨진다**
 * (행 높이·줄바꿈·열 폭이 전부 밀린다). 그래서 캔버스 루트에서만 데스크탑 값으로 되돌린다.
 *
 * ⚠ 이 예외를 다른 자리에 쓰지 말 것. 기준은 "고정 px 좌표계 위에 그려진 문서인가" 하나다 —
 *   화면 UI는 예외 없이 모바일 타이포를 쓴다(폰에서 14px는 심각하게 작다는 게 그 스코프의 존재 이유다).
 */
export const desktopTypoVars: Record<string, string> = typoVarsOf(typography);

const borderWidth = '1px';            // 보더 굵기 1종
const iconBaselineShift = '-0.125em'; // 아이콘 광학정렬 보정(폰트 크기 비례 토큰, 1/8 룰)

// ── 모션 — 지속시간 3단 + 이징 1종 ──────────────────────────────────────────
// 레포에 모션 토큰이 **0개**였고 12곳이 각자 0.1s/0.12s/0.15s/350ms를 박고 있었다(06 §1).
//  값은 지금 쓰이는 것을 그대로 옮긴다 — **느낌을 바꾸지 않는 순수 정리**다. 바꿀 일이 생기면 여기 한 곳.
//  단을 셋으로 닫는 이유: 관측된 값이 "즉각 반응 / 위치 이동 / 설명하는 전이" 세 무리로 갈렸다.
//  이징을 하나만 여는 이유: 12곳이 전부 `ease`다. 두 번째가 필요한 사례가 세 번 나오면 그때 연다(rule of three).
//  ⚠ prefers-reduced-motion은 여기서 0으로 만들지 않는다 — a11y.css의 전역 차단이 그 일을 한다.
//    Mantine 내부 애니메이션은 우리 토큰을 안 쓰므로 어차피 그물이 필요하고, 두 기제가 한 일을 하면 안 된다.
const motion = {
  fast: '120ms',   // 색·배경·불투명도 — 눌렀다는 걸 즉시 말해야 하는 것
  base: '150ms',   // 변형(transform)·펼침 — 위치가 바뀌는 것
  slow: '350ms',   // 상태 전이가 *설명*을 해야 할 때(주의 카드 톤 전환)
} as const;
const easingStandard = 'ease';

// 모서리 곡률(애플식 squircle). corner-shape: superellipse(2)=squircle.
// radius 스케일(sm/md/full)·값은 안 건드리고, 그 위에 *연속 곡률*만 얹는 단일 토큰.
// border·box-shadow·outline·overflow가 이 모양을 네이티브로 따라간다(충돌 없음).
// 미지원 브라우저(Safari/Firefox)는 무시 → 평범한 둥근 모서리로 graceful fallback.
// 값은 화면 검증에서 조정(더 부드럽게=superellipse(1.8) 등). 컴포넌트엔 prop으로 안 연다(헌법 5).
const cornerShape = 'superellipse(2)';

// 페이지 콘텐츠 폭 천장 — AppShell 아래 "모든" 화면의 유일한 폭 캡(중앙정렬은 Page 원자가 소유).
// 1200 = 앱/정보형 정석 대역(Mesh 1200 · Tailwind max-w-7xl 1280 · Bootstrap xxl 1320 의 하단) +
//        Bento 12열 × ~85px 눈금(1200 − 열간격 ≈ 1024 ÷ 12)과 정합. 콘텐츠는 260 넷바 옆에 캡되므로
//        전체 설계폭 ≈1460(24" 모니터급). ≥1280 기준선에선 안 걸리고 넓은 화면에서만 캡+중앙정렬.
// 값은 화면 검증(/dev/preview 폭 스윕)에서 미세조정할 잠정치 — Page는 var(--page-max)만 참조.
const pageMaxWidth = '1200px';

// ─────────────────────────────────────────────────────────────
export const theme = createTheme({
  white: '#FFFFFF',
  black: neutral[9],

  colors: { primary, neutral, success, warning, danger, info },
  primaryColor: 'primary',
  primaryShade: 6, // index 6 = #1E4178 (메인 navy)

  fontFamily: '"Pretendard GOV Variable", "Pretendard GOV", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

  // 간격: 4px 베이스 (xxs4·xs8·sm12·md16·lg24·xl32·xxl48). 임의 px 금지.
  spacing: {
    xxs: '0.25rem', xs: '0.5rem', sm: '0.75rem', md: '1rem',
    lg: '1.5rem', xl: '2rem', xxl: '3rem',
  },

  // Mantine 호환용 크기 칸(단일 진실 공급원은 other.typography).
  fontSizes: {
    xs: '0.75rem', sm: '0.875rem', md: '1rem', lg: '1.25rem', xl: '1.75rem',
  },

  // xs(4px): sm을 4→8로 키운 squircle bump이 "작은 내부 요소(메뉴항목·컬럼항목·스테퍼 버튼 등)"가
  // 쓸 ~4px 토큰을 고아로 만들어, 그 자리에 px 하드코딩 drift가 생겼었다. xs를 도로 열어 그 자리를 토큰으로 메운다.
  radius: { xs: '4px', sm: '8px', md: '16px', full: '9999px' }, // md 키움(squircle 곡률이 보이려면 큰 반경 필요 — 8px는 안 드러남)
  defaultRadius: 'sm',

  // 그림자: none은 "안 줌"이라 키 없음. sm(카드)·md(모달)만.
  shadows: {
    sm: '0 1px 2px rgba(11, 26, 53, 0.12)',
    md: '0 4px 12px rgba(11, 26, 53, 0.16)',
  },

  // ── theme.other: 단일 진실 공급원의 자유 공간 (위 모듈 상수를 그대로 싣는다) ──
  other: {
    typography,
    semantic,
    borderWidth,
    iconBaselineShift,
    cornerShape,
  },
});

// ─────────────────────────────────────────────────────────────
// 시맨틱 역할 → CSS 변수. 모드 분기는 여기서 일어난다.
// 컴포넌트는 var(--text-primary) 등 "역할 이름"만 쓰고 라이트/다크를 모른다.
// (Providers의 MantineProvider에 주입)
// ─────────────────────────────────────────────────────────────
// 모듈 상수(typography·semantic·borderWidth·iconBaselineShift)를 직접 읽는다.
// t.other를 거치지 않으므로 mantine.d.ts의 module augmentation에 의존하지 않는다.
// → 패키지 자기 tsc와 소비자 next build(augmentation 미적용) 가 동일하게 통과한다.
//   (resolver는 어차피 이 테마 전용이라, 같은 상수를 직접 쓰는 게 단일 진실 공급원에도 맞다)
export const cssVariablesResolver: CSSVariablesResolver = () => {
  const s = semantic;

  // 타이포 6단계도 같은 통로(CSS 변수)로 흘려보낸다.
  // → Text/Title/Label 원자는 var(--typo-body-size) 식 역할 이름만 부르고
  //   실제 크기·굵기·행간(typography)은 모른다. (색과 동일 구조)
  const typoVars: Record<string, string> = {};
  for (const [step, spec] of Object.entries(typography)) {
    typoVars[`--typo-${step}-size`]   = spec.fontSize;
    typoVars[`--typo-${step}-weight`] = String(spec.fontWeight);
    typoVars[`--typo-${step}-lh`]     = String(spec.lineHeight);
  }

  const pick = (mode: 'light' | 'dark') => ({
    '--text-primary':   s.text.primary[mode],
    '--text-secondary': s.text.secondary[mode],
    '--text-danger':    s.text.danger[mode],
    '--text-success':   s.text.success[mode],
    '--text-disabled':  s.text.disabled[mode],
    '--bg-primary':     s.bg.primary[mode],
    '--bg-secondary':   s.bg.secondary[mode],
    '--bg-tertiary':    s.bg.tertiary[mode],
    '--border-default': s.border.default[mode],
    '--border-strong':  s.border.strong[mode],
    '--border-focus':   s.border.focus[mode],
    '--border-field':        s.border.field[mode],
    '--border-field-strong': s.border.fieldStrong[mode],
    '--surface-sunken':  s.surface.sunken[mode],
    '--surface-default': s.surface.default[mode],
    '--surface-raised':  s.surface.raised[mode],
    '--surface-overlay': s.surface.overlay[mode],
    '--surface-input':   s.surface.input[mode],
  });
  return {
    variables: {
      '--border-width':        borderWidth,
      '--icon-baseline-shift': iconBaselineShift,
      '--corner-shape':        cornerShape,
      '--motion-fast':         motion.fast,
      '--motion-base':         motion.base,
      '--motion-slow':         motion.slow,
      '--easing-standard':     easingStandard,
      '--page-max':            pageMaxWidth,   // 페이지 콘텐츠 폭 캡(Page 원자 전용)
      '--elevation-raised':    elevation.raised,   // surface.raised 와 짝
      '--elevation-overlay':   elevation.overlay,  // surface.overlay 와 짝
      ...typoVars,
    },
    light: pick('light'),
    dark: pick('dark'),
  };
};
