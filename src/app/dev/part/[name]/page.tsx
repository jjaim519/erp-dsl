'use client';
// 부품 상세(전시) — 라이브 예시 + 닫힌 props + 구성요소(하이퍼링크) + 쓰인 곳(역참조).
// [전시 ↔ 편집] 중 편집은 확장 예정(슬롯만). 데이터는 _catalog, 라이브는 _registry.
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { findEntry, usedBy, basePart, PART_NAMES, type Composition } from '@/ui/_catalog';
import { Demo } from '@/ui/_dev';
import { MOBILE_DEMOS } from '@/ui/_mobileDemos';
import { MobileStage } from '../../_MobileStage';
import { Stack, Group, Card, Title, Text, Badge, Divider } from '@/ui';
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

      {/* 라이브 예시 — 모바일은 페이지 안에 그대로 못 넣는다(뷰포트·문서 잠금·셸 스코프).
          캔버스(/shell/m/part/[name])를 폰 프레임 iframe으로 임베드한다. _MobileStage 헤더 주석 참조. */}
      <Card variant="outlined" padding="lg">
        <Stack gap="sm">
          <Group gap="xs" align="center">
            <Text variant="caption" color="secondary">라이브 예시</Text>
            {mobileDemo?.note && <Text variant="caption" color="secondary">— {mobileDemo.note}</Text>}
          </Group>
          {mobileDemo
            ? <MobileStage name={entry.name} />
            : <Card variant="flat" padding="md"><Demo name={entry.name} /></Card>}
        </Stack>
      </Card>

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
