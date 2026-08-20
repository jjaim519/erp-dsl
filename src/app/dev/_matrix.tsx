'use client';
// 상태 매트릭스 + 극단 콘텐츠 — 무대의 «둘째 보기».
//
//  `_registry`의 `Demo`와 가르는 선: Demo는 «이 부품이 무엇인가»를 보여주는 **한 장면**이고,
//  여기는 **축의 곱**이다(variant × size × 상태). 조사가 시각 버그의 다수를 「상호작용 상태를
//  건너뜀」으로 지목하는데, 한 장면짜리 데모는 그 축을 구조적으로 못 보여준다.
//
//  · 부품마다 축이 다르다(Button=variant×size / DataTable=열수×행수×빈상태) → **자동화 불가, 손으로 채운다.**
//    안 채운 부품은 무대가 「매트릭스 없음」으로 떨어지고 데모만 뜬다(퇴화 0). 층을 훑을 때 그 자리에서 채운다.
//  · **src/ui가 아니라 dev 앱에 둔다** — 공개 부품만 쓰므로 내부 import가 필요 없고, src/ui에 두면
//    이미 알려진 publish 누수(`_catalog`·`_registry`가 tarball에 들어간다 — 02 §패키지)를 넓히게 된다.
//  · 상태는 **prop인 것만** 깐다. `:hover`는 CSS 신뢰 상태라 JS로 못 만들고(흉내내려면 Mantine의
//    `.m_77c9d27d:hover`를 베껴야 하는데 그건 남의 클래스를 겨누는 짓이다), 대신 **탐침이 hover 값을 읽는다**.
//    `focus`는 진짜로 만들 수 있어 아래 「포커스」 줄이 `.focus()`를 건다.
//
//  dev 전용(배포 제외).
import { useEffect, useRef, type ReactNode } from 'react';
import { Button, Icon, Stack, Text } from '@/ui';

// ── 격자 크롬 ───────────────────────────────────────────────────────────────────
//  raw grid는 dev 앱 소유(`/dev/preview`·`_MobileStage` 선례) — 부품이 아니라 검증 도구의 자다.
function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <Stack gap="xs">
      <div>
        <Text variant="body-strong">{title}</Text>
        {note && <Text variant="caption" color="secondary">{note}</Text>}
      </div>
      {children}
    </Stack>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
      <span style={{ font: '11px/1 ui-monospace, Menlo, monospace', color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>{children}</div>;
}

// ── Button ──────────────────────────────────────────────────────────────────────
const BTN_VARIANTS = ['primary', 'secondary', 'danger', 'ghost', 'accent'] as const;
const BTN_SIZES = ['sm', 'md'] as const;

function FocusRow() {
  //  focus는 «신뢰 상태»가 아니라 프로그램으로 만들 수 있다 — 그래서 여기만 강제한다.
  //  마운트 직후 한 번 걸어 두면 스크린샷에 포커스 링이 그대로 찍힌다.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.querySelector('button')?.focus(); }, []);
  return (
    <div ref={ref}>
      <Row>
        <Cell label="focus(자동)"><Button variant="primary">저장</Button></Cell>
        <Cell label="focus 대조"><Button variant="primary">저장</Button></Cell>
      </Row>
    </div>
  );
}

function ButtonMatrix() {
  return (
    <Stack gap="xl">
      {BTN_SIZES.map((size) => (
        <Block key={size} title={`size = ${size}`} note="가로 = 상태(prop) · 세로 = variant">
          <Stack gap="sm">
            {BTN_VARIANTS.map((variant) => (
              <Row key={variant}>
                <div style={{ width: 84, font: '11px/2.4 ui-monospace, Menlo, monospace', color: 'var(--text-secondary)' }}>{variant}</div>
                <Cell label="기본"><Button variant={variant} size={size}>저장</Button></Cell>
                <Cell label="disabled"><Button variant={variant} size={size} disabled>저장</Button></Cell>
                <Cell label="loading"><Button variant={variant} size={size} loading>저장</Button></Cell>
                <Cell label="leftIcon"><Button variant={variant} size={size} leftIcon={<Icon name="download" size="sm" />}>저장</Button></Cell>
              </Row>
            ))}
          </Stack>
        </Block>
      ))}

      <Block title="포커스" note="focus는 프로그램으로 만들 수 있는 유일한 상태 — 왼쪽에 자동으로 걸어 둔다">
        <FocusRow />
      </Block>

      {/* 극단 콘텐츠 — 「일부러 틀린 걸 넣어서 막히는지 본다」(02 §9-1)의 콘텐츠판.
          한글 2음절은 라틴 4자(Save)와 폭이 달라서, 영어 라벨로는 안 보이는 결함이 여기서만 보인다. */}
      <Block title="극단 콘텐츠" note="라벨 길이가 기하를 어떻게 흔드나 — 한글 2음절 / 7음절 / 장문 / 전폭">
        <Stack gap="sm">
          <Row>
            <Cell label="2음절"><Button variant="primary">저장</Button></Cell>
            <Cell label="7음절"><Button variant="primary">발주 승인 요청</Button></Cell>
            <Cell label="라틴 4자"><Button variant="primary">Save</Button></Cell>
            <Cell label="숫자"><Button variant="secondary">12,340,000</Button></Cell>
          </Row>
          <Row>
            <Cell label="장문">
              <Button variant="secondary">이번 달 정산 명세서를 전부 내려받기</Button>
            </Cell>
          </Row>
          <Cell label="fullWidth">
            <div style={{ width: 320 }}><Button variant="primary" fullWidth>저장</Button></div>
          </Cell>
          <Row>
            <Cell label="나란히 3"><div style={{ display: 'flex', gap: 8 }}>
              <Button variant="ghost">취소</Button>
              <Button variant="secondary">임시저장</Button>
              <Button variant="primary">저장</Button>
            </div></Cell>
          </Row>
        </Stack>
      </Block>
    </Stack>
  );
}

// ── 레지스트리 ──────────────────────────────────────────────────────────────────
const MATRIX: Record<string, () => ReactNode> = {
  Button: ButtonMatrix,
};

export const hasMatrix = (name: string) => name in MATRIX;

export function DemoMatrix({ name }: { name: string }) {
  const M = MATRIX[name];
  if (!M) return <Text variant="caption" color="secondary">이 부품엔 아직 매트릭스가 없다 — 층을 훑을 때 채운다.</Text>;
  return <M />;
}
