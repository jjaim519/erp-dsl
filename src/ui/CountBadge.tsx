// CountBadge 의미 원자 — 알림 카운트(미처리 건수). 카톡/Gmail/Slack식 "빨강 N 동그라미".
//  · Badge(상태 알약, 반투명 light)와 *역할이 다르다*: 상태=무엇인가 / 카운트=처리해야 할 건수의 주의 환기.
//    그래서 솔리드 채움(불투명) — 옅은 틴트로는 "여기 와서 해라"가 안 선다(시각적 무게가 행동요구를 표한다).
//  · count=0이면 렌더 안 함(null) — 배지의 존재 자체가 "나를 위한 일이 있다"는 신호. 0건엔 깨끗.
//  · max 초과시 "N+"(기본 99+). 단일/두 자리는 원형, 길어지면 알약으로 자연히 늘어난다(minWidth=height).
//  · tone: danger(기본=행동요구 빨강) / neutral(정보 카운트 회색). 핵심은 *대비* — 행동요구만 빨강, 정보는 중립.
//    (탭마다 빨강이면 아무것도 안 튄다. 새 주문=danger / 진행·완료=neutral 또는 () 텍스트.)
//  · dot=true → 숫자 없이 점만(개수가 무의미하고 "뭔가 새 거 있음"만 알릴 때). 멘탈모델: 탭 라벨 뒤·나브 항목 뒤에 붙는다.
//  · 색은 토큰 var(danger-6/neutral-6)·흰 글자 var로 직접 참조 — Mantine Badge(light 고정)로는 솔리드가 안 나와서 별도 부품.

type Tone = 'danger' | 'neutral';
type Props = {
  count: number;        // 미처리 건수. 기본은 0 이하면 안 보인다(showZero로 뒤집는다).
  tone?: Tone;          // 기본 danger(행동요구). 정보성 카운트는 neutral.
  max?: number;         // 초과시 "N+"(기본 99).
  dot?: boolean;        // true면 숫자 없이 점만.
  showZero?: boolean;   // 0도 그린다. 아래 주석 참조.
};

// showZero — "0건도 정보"인 맥락용(기본 false라 기존 소비처 불변).
//  · 기본 규칙(0=숨김)은 *알림*의 문법이다: 배지의 존재 자체가 "나를 위한 일이 있다"는 신호라 0건엔 깨끗해야 한다.
//  · 그런데 단계별 큐(견적 대기 N / 계약 대기 N / 시공 배정 N)는 다르다 — 여기선 숫자가 "어느 단계가 존재하고
//    지금 얼마나 쌓였나"를 말하므로 0도 읽혀야 한다("이 단계는 비었다" 역시 답이다). 숨기면 소비처가 라벨 문자열에
//    숫자를 박아 우회하고, 그 순간 배지 층위가 통째로 사라진다(kk가 실제로 그 상태였다).
//  · 0을 danger로 칠하면 "행동요구만 빨강"이 무너진다 — showZero를 쓸 땐 tone='neutral'을 함께 주는 게 맞다.
export function CountBadge({ count, tone = 'danger', max = 99, dot = false, showZero = false }: Props) {
  if (count < 0 || (count === 0 && !showZero)) return null;
  const bg = `var(--mantine-color-${tone}-6)`;
  if (dot) {
    // rem — 폰트 스케일(접근성 줌)에 함께 커진다. 라벨은 rem인데 점만 px면 줌에서 쪼그라든다.
    return <span aria-hidden style={{ display: 'inline-block', width: '0.5rem', height: '0.5rem', borderRadius: 'var(--mantine-radius-full)', background: bg }} />;
  }
  const label = count > max ? `${max}+` : String(count);
  return (
    <span
      role="status"
      aria-label={`${count}건`}
      style={{
        // 치수·폰트 전부 rem — 옆 라벨(rem)과 함께 줌(고령 클라이언트 폰트 스케일). 18px=1.125rem, 11px=0.6875rem.
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: '1.125rem', height: '1.125rem', padding: '0 0.3125rem', borderRadius: 'var(--mantine-radius-full)',
        background: bg, color: 'var(--mantine-color-white)',
        fontSize: '0.6875rem', fontWeight: 700, lineHeight: 1, flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}
