'use client';
// 부품 상세 — **3띠**: ① 헤더(정체) ② 무대(보는 곳) ③ 계약(읽는 곳).
//
//  띠를 셋으로 둔 이유(원래 넷이었다): 「매트릭스」를 별도 띠로 두려 했으나, 매트릭스가 필요로 하는
//  크롬(모드 병치·폭·탐침)이 무대의 것과 **하나도 안 다르다.** 별도 띠면 같은 컨트롤이 두 벌 서고
//  둘이 어긋나는 순간 어느 쪽 화면을 보고 있는지 알 수 없게 된다. 매트릭스는 «다른 띠»가 아니라
//  **무대의 다른 보기**다 — 그래서 무대 안 세그먼트로 들어갔다.
//
//  데이터는 `_catalog`(선언) · 라이브는 `_registry`(데모) / `_matrix`(축의 곱) · 무대는 iframe 캔버스.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { findEntry, usedBy, basePart, PART_NAMES, type Composition } from '@/ui/_catalog';
import { MOBILE_DEMOS } from '@/ui/_mobileDemos';
import { MobileStage } from '../../_MobileStage';
import { Stage } from '../../_Stage';
import { Stack, Group, Title, Text, Badge, Divider } from '@/ui';
import type { BadgeColor } from '@/ui';

const COMP_ORDER: (keyof Composition)[] = ['토큰', '의미 원자', '레이아웃 원자', '배치 프리미티브', '분자', '유기체', '위젯', '템플릿', '공유'];
const COMP_TONE: Record<string, BadgeColor> = {
  토큰: 'warning', '의미 원자': 'info', '레이아웃 원자': 'info', '배치 프리미티브': 'success',
  분자: 'danger', 유기체: 'danger', 템플릿: 'danger', 공유: 'neutral',
};
const propTone = (kind: string): BadgeColor => (kind === '스타일' ? 'info' : kind === '기능' ? 'success' : kind === '값' ? 'warning' : 'neutral');

export default function PartDetail() {
  const params = useParams();
  const name = String(params.name);
  const entry = findEntry(name);

  if (!entry) {
    return <Stack gap="sm"><Title variant="heading">{name}</Title><Text variant="body" color="secondary">알 수 없는 부품.</Text><Link href="/dev">← 박물관으로</Link></Stack>;
  }

  const usedByList = usedBy(name);
  const mobileDemo = MOBILE_DEMOS[entry.name];

  return (
    <Stack gap="lg">
      <Stack gap="xxs">
        <Group gap="xs" align="center">
          <Title variant="display">{entry.name}</Title>
          <Badge color="neutral">{entry.layer}</Badge>
          {entry.composition && <Text variant="caption" color="secondary">전시 · 편집(확장 예정)</Text>}
        </Group>
        <Text variant="body" color="secondary">{entry.role}</Text>
      </Stack>

      {/* ② 무대 — 데스크탑·모바일 **둘 다 iframe 캔버스**다(자체 뷰포트·문서 잠금 격리).
          모바일은 폰 프레임 안(`/shell/m/part/…`), 데스크탑은 폭 토글이 곧 뷰포트(`/shell/part/…`).
          카드로 감싸지 않는다 — 캔버스가 자기 윤곽을 갖고 있어 두 겹이 되고,
          무엇보다 카드 면이 «부품이 가진 면»과 섞여 raised 판정을 흐린다(0단계에서 재려던 바로 그 신호다). */}
      <Stack gap="sm">
        <Group gap="xs" align="center">
          <Text variant="caption" color="secondary">무대</Text>
          {mobileDemo?.note && <Text variant="caption" color="secondary">— {mobileDemo.note}</Text>}
        </Group>
        {mobileDemo ? <MobileStage name={entry.name} /> : <Stage name={entry.name} />}
      </Stack>

      <Group gap="lg" align="start" wrap>
        {/* 닫힌 props */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <Stack gap="xs">
            <Text variant="body-strong">노출 props (닫힌 선택지)</Text>
            <Stack gap="xxs">
              {entry.props.map((p) => (
                <div key={p.name} style={{ borderLeft: '2px solid var(--border-default)', paddingLeft: 8 }}>
                  <Group gap="xxs" align="center" wrap>
                    <Text variant="body-strong">{p.name}</Text>
                    <Badge color={propTone(p.kind)}>{p.kind}</Badge>
                  </Group>
                  <Text variant="caption" color="secondary">{p.values}</Text>
                </div>
              ))}
            </Stack>
          </Stack>
        </div>

        {/* 구성요소(하이퍼링크) + 쓰인 곳(역참조) */}
        {(entry.composition || usedByList.length > 0) && (
          <div style={{ flex: 1, minWidth: 280 }}>
            <Stack gap="md">
              {entry.composition && (
                <Stack gap="xs">
                  <Text variant="body-strong">구성요소 (무엇으로 조립되었나)</Text>
                  {COMP_ORDER.filter((k) => entry.composition![k]?.length).map((k) => (
                    <Stack key={k} gap="xxs">
                      <Text variant="caption" color="secondary">{k}</Text>
                      <Group gap="xxs" wrap>
                        {entry.composition![k]!.map((v) => {
                          const bp = basePart(v);
                          const badge = <Badge color={COMP_TONE[k]}>{v}</Badge>;
                          return PART_NAMES.has(bp)
                            ? <Link key={v} href={`/dev/part/${bp}`} style={{ textDecoration: 'none' }}>{badge}</Link>
                            : <span key={v}>{badge}</span>;
                        })}
                      </Group>
                    </Stack>
                  ))}
                </Stack>
              )}
              {usedByList.length > 0 && (
                <Stack gap="xs">
                  <Divider />
                  <Text variant="body-strong">쓰인 곳</Text>
                  <Group gap="xxs" wrap>
                    {usedByList.map((u) => (
                      <Link key={u} href={`/dev/part/${u}`} style={{ textDecoration: 'none' }}><Badge color="neutral">{u}</Badge></Link>
                    ))}
                  </Group>
                </Stack>
              )}
            </Stack>
          </div>
        )}
      </Group>

      <Link href="/dev" style={{ fontSize: 13 }}>← 박물관으로</Link>
    </Stack>
  );
}
