// PageHeader 유기체 — 상단 제목(좌) + 제목 우측에 "쌓이는" 정보 원자 + 액션(우). 도메인 무관 골격.
//  · 하단 보조 설명(description)은 폐지 — 정체성 밴드는 1줄. 정보는 제목 우측 meta로만 얹는다.
//  · meta = 닫힌 3종(배지·아이콘·정보텍스트)의 순서 배열. 열린 ReactNode 슬롯은 안 준다(임의 조립 금지).
//  · 관습: 액션 버튼은 size=sm 고정 — 제목(heading)이 페이지 주인공이므로 버튼 세로를 낮춰 위계를 잡는다.
import { Group } from './Group';
import { Title } from './Title';
import { Text } from './Text';
import { Badge } from './Badge';
import { Icon, type IconName } from './Icon';
import type { Action, BadgeColor } from './_cells';
import { renderAction } from './_cells';

// 제목 우측에 쌓이는 정보 원자 — 배지(상태)·아이콘(표식)·텍스트(부가 진술). 순서대로 렌더.
export type HeaderMeta =
  | { kind: 'badge'; label: string; tone: BadgeColor }
  | { kind: 'icon'; name: IconName; color?: 'primary' | 'secondary' | 'danger' }
  | { kind: 'text'; label: string };

function renderMeta(m: HeaderMeta, i: number) {
  if (m.kind === 'badge') return <Badge key={i} color={m.tone}>{m.label}</Badge>;
  if (m.kind === 'icon') return <Icon key={i} name={m.name} size="sm" color={m.color ?? 'secondary'} />;
  return <Text key={i} variant="body" color="secondary">{m.label}</Text>;
}

type Props = {
  title: string;
  meta?: HeaderMeta[]; // 제목 우측 정보(optional — 안 주면 미조립, 회귀 없음)
  actions?: Action[];
};

export function PageHeader({ title, meta, actions }: Props) {
  return (
    <Group justify="between" align="center">
      <Group gap="sm" align="center" wrap={false}>
        <Title variant="heading">{title}</Title>
        {meta && meta.length > 0 && meta.map(renderMeta)}
      </Group>
      {actions && actions.length > 0 && (
        <Group gap="xs">
          {actions.map((a, i) => renderAction(a, i, 'sm'))}
        </Group>
      )}
    </Group>
  );
}
