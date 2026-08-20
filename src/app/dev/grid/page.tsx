'use client';
// Bento 실험대 — 세 가지를 «화면에서» 정하려고 만든 자리다. 말로는 안 서는 것들:
//
//  ① ROW_UNIT 값       — 정의는 「가장 작은 자기완결 위젯의 자연 높이를 8px 스냅」이다.
//                        그래서 고르는 게 아니라 **재는** 것이다. 아래 ①절이 실측을 띄운다.
//  ② 흐름 ↔ 작업면      — 업무 화면은 스크롤한다(Grafana·Fiori OVP·Viva 전부). iOS의 「무스크롤」은
//                        스크롤을 없앤 게 아니라 세로 스크롤을 «페이지 넘김»으로 바꾼 것이라 전제가 다르다.
//                        우리 답은 둘 다 갖는 것이고 코드엔 이미 둘 다 있다(fill이 「한 화면」의 대응물).
//  ③ colSpan 집합       — 12의 약수 제한은 `Grid`(균등 분할) 규칙을 잘못 옮긴 것이었다.
//                        8+4(본문+사이드)·9+3(목록+필터)이 업무에서 제일 흔한 쌍인데 표현이 안 됐다.
//                        **닫힘은 격자가 아니라 위젯의 footprint 선언에서 일어난다.**
//
//  raw CSS grid는 dev 앱 소유(`/dev/preview`·`_MobileStage` 선례) — 실측 절은 «높이를 안 고정한» 격자가
//  필요해서 Bento를 못 쓴다(Bento의 본질이 높이 고정이라 그걸 쓰면 재려는 값이 사라진다).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bento, SummaryCard, Stat, Card, DataTable, Title, Text, Stack, Group, SegmentedControl } from '@/ui';

const COLS = 12;
const GAP = 24;                       // --mantine-spacing-lg
//  후보는 px과 rem을 섞어 둔다 — 「아주크게」에서 px 후보만 잘리는 걸 한 화면에서 보라고.
const ROW_CANDIDATES = [
  { value: '140px', label: '140px (옛값)' },
  { value: '9rem', label: '9rem = 144 (채택)' },
  { value: '10rem', label: '10rem = 160' },
];

// ── 실측 ────────────────────────────────────────────────────────────────────────
//  높이를 안 정한 칸에 위젯을 넣고 «스스로 얼마나 되는지»를 잰다. 이게 ROW_UNIT의 정의 그대로다.
function Measure({ label, span, children }: { label: string; span: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setH(el.getBoundingClientRect().height);
    const ro = new ResizeObserver(read);
    ro.observe(el);
    read();
    return () => ro.disconnect();
  }, []);
  const snap = Math.ceil(h / 8) * 8;
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <div ref={ref}>{children}</div>
      <div style={{ marginTop: 6, font: '11px/1.5 ui-monospace, Menlo, monospace', color: 'var(--text-secondary)' }}>
        {label} · span {span} — <b style={{ color: 'var(--text-primary)' }}>{Math.round(h)}px</b> → 8px 스냅 <b style={{ color: 'var(--text-primary)' }}>{snap}</b>
      </div>
    </div>
  );
}

// 배치 시연용 더미 타일 — 위젯이 아니라 «칸»을 보여주는 자리라 부품을 안 쓴다.
function Slab({ label }: { label: string }) {
  return (
    <div style={{
      height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface-raised)', boxShadow: 'var(--elevation-raised)',
      borderRadius: 'var(--mantine-radius-md)', color: 'var(--text-secondary)',
      font: '600 13px/1 ui-monospace, Menlo, monospace',
    }}>{label}</div>
  );
}

const TABLE = (
  <Card variant="elevated" padding="none" fill>
    <div style={{ height: '100%', overflowY: 'auto' }}>
      <DataTable
        columns={[
          { key: 'name', label: '거래처', type: 'text', sortable: true },
          { key: 'owner', label: '담당', type: 'user' },
          { key: 'status', label: '상태', type: 'badge' },
          { key: 'amount', label: '금액', type: 'currency', sortable: true },
        ]}
        rows={[
          { id: '1', name: '가구상사', owner: { name: '김병준' }, status: '확정', amount: 1200000, badgeColors: { 확정: 'success' } },
          { id: '2', name: '목재유통', owner: { name: '이수연' }, status: '대기', amount: 880000, badgeColors: { 대기: 'warning' } },
          { id: '3', name: '한샘하드웨어', owner: { name: '박지훈' }, status: '확정', amount: 2450000, badgeColors: { 확정: 'success' } },
        ]}
        status="ready"
      />
    </div>
  </Card>
);

export default function BentoLab() {
  const [row, setRow] = useState('9rem');

  return (
    <Stack gap="xl">
      <Stack gap="xxs">
        <Title variant="display">Bento 실험대</Title>
        <Text variant="body" color="secondary">
          ROW_UNIT 실측 · 흐름↔작업면 · colSpan 쌍(8+4 · 9+3). 격자는 12열 고정, 간격 lg(24).
        </Text>
      </Stack>

      {/* ① 실측 — 높이를 안 고정한 격자라 위젯이 «자기 높이»를 말한다 */}
      <Stack gap="sm">
        <Text variant="body-strong">① ROW_UNIT 실측 — 가장 작은 자기완결 위젯의 자연 높이</Text>
        <Text variant="caption" color="secondary">
          높이를 안 준 칸에 실제 위젯을 넣고 잰다. 이 값의 8px 스냅이 ROW_UNIT 후보다 — 고르는 게 아니라 재는 것.
        </Text>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, minmax(0,1fr))`, gap: GAP }}>
          <Measure label="SummaryCard" span={3}>
            <SummaryCard label="승인 대기" icon="clock" tone="warning" count={12} amount={3400000} />
          </Measure>
          <Measure label="SummaryCard(금액 없음)" span={3}>
            <SummaryCard label="반려" icon="x-circle" tone="danger" count={3} />
          </Measure>
          <Measure label="Stat" span={3}>
            <Stat label="이번 달 발주액" value="₩12,840,000" trend="up" delta="전월 +8.2%" icon="chart-bar" />
          </Measure>
          <Measure label="SummaryCard" span={4}>
            <SummaryCard label="확정" icon="check-circle" tone="success" count={48} amount={18200000} />
          </Measure>
        </div>
      </Stack>

      {/* ② 흐름 모드 + ROW_UNIT 후보 갈아 끼우기 */}
      <Stack gap="sm">
        <Group gap="md" align="center" wrap>
          <Text variant="body-strong">② 흐름 모드 — 페이지가 세로로 스크롤한다</Text>
          <SegmentedControl size="sm" value={row} onChange={setRow}
            options={ROW_CANDIDATES} />
        </Group>
        <Text variant="caption" color="secondary">
          업무 화면은 스크롤한다(Grafana·Fiori OVP·Viva 전부). 단 <b>높이는 내용이 못 정한다</b>는 유지 —
          스크롤은 「칸이 몇 줄이냐」의 문제지 「칸이 늘어나느냐」의 문제가 아니다.
        </Text>
        {/* ROW_UNIT은 공개 prop이 아니라 내부 CSS 변수다 — 실험대만 이렇게 갈아 끼운다. */}
        <div style={{ ['--bento-row' as string]: row }}>
          <Bento columns={12} gap="lg">
            <Bento.Tile colSpan={3}><SummaryCard label="승인 대기" icon="clock" tone="warning" count={12} amount={3400000} /></Bento.Tile>
            <Bento.Tile colSpan={3}><SummaryCard label="확정" icon="check-circle" tone="success" count={48} amount={18200000} /></Bento.Tile>
            <Bento.Tile colSpan={3}><SummaryCard label="반려" icon="x-circle" tone="danger" count={3} /></Bento.Tile>
            <Bento.Tile colSpan={3}><Stat label="발주액" value="₩12.8M" trend="up" delta="+8.2%" icon="chart-bar" /></Bento.Tile>
            <Bento.Tile colSpan={12} rowSpan={2}>{TABLE}</Bento.Tile>
          </Bento>
        </div>
      </Stack>

      {/* ③ colSpan 쌍 — 12의 약수가 아닌 것들이 실제로 쓸 만한가 */}
      <Stack gap="sm">
        <Text variant="body-strong">③ colSpan 쌍 — 8+4 · 9+3은 약수가 아니지만 완결된다</Text>
        <Text variant="caption" color="secondary">
          지금 문서(05 §1-3)는 w를 12의 약수 5종으로 닫아 뒀는데, 그러면 <b>본문+사이드 레일(8+4)</b>과
          <b> 목록+필터(9+3)</b>가 표현이 안 된다. 격자는 좌표계만 주고, 무엇을 쓸지는 위젯이 선언한다.
        </Text>
        <Bento columns={12} gap="lg">
          <Bento.Tile colSpan={8} rowSpan={2}>{TABLE}</Bento.Tile>
          <Bento.Tile colSpan={4}><SummaryCard label="미수금" icon="wallet" tone="warning" count={7} amount={4300000} /></Bento.Tile>
          <Bento.Tile colSpan={4}><Slab label="4 — 사이드" /></Bento.Tile>
          <Bento.Tile colSpan={9}><Slab label="9 — 목록" /></Bento.Tile>
          <Bento.Tile colSpan={3}><Slab label="3 — 필터" /></Bento.Tile>
          <Bento.Tile colSpan={6}><Slab label="6" /></Bento.Tile>
          <Bento.Tile colSpan={6}><Slab label="6" /></Bento.Tile>
          <Bento.Tile colSpan={10}><Slab label="10 — 본문" /></Bento.Tile>
          <Bento.Tile colSpan={2}><Slab label="2" /></Bento.Tile>
        </Bento>
      </Stack>

      {/* ④ 작업면 — 스크롤 0. iOS 「한 화면」의 우리식 대응물 */}
      <Stack gap="sm">
        <Text variant="body-strong">④ 작업면(fill) — 스크롤 0, 행이 잔여고를 등분</Text>
        <Text variant="caption" color="secondary">
          2-pane 저작 화면처럼 <b>스크롤이 있으면 안 되는</b> 자리. <b>높이는 부모가 준다</b> —
          실전에선 AppShell → Page 배관이 흘려주는 <b>뷰포트 잔여고</b>이고, 여기선 그걸 흉내내려고
          <code> calc(100dvh − 12rem)</code>을 쓴다(옛 520px 고정은 실제보다 절반쯤 짧아 오해를 줬다).
          행에는 <b>ROW_UNIT 하한</b>이 걸려 있어, 잔여고가 모자라면 칸이 줄어 잘리는 대신 넘쳐서 무너진다.
        </Text>
        <div style={{ height: 'calc(100dvh - 12rem)', minHeight: 360 }}>
          <Bento columns={12} gap="lg" fill>
            <Bento.Tile colSpan={4} rowSpan={2}><Slab label="4×2 — 좌 구조" /></Bento.Tile>
            <Bento.Tile colSpan={8}><Slab label="8×1 — 우 상단" /></Bento.Tile>
            <Bento.Tile colSpan={8}><Slab label="8×1 — 우 하단" /></Bento.Tile>
          </Bento>
        </div>
      </Stack>
    </Stack>
  );
}
