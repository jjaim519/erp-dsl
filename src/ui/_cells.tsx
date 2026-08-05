// 유기체 공유 패턴 — DataTable·DescriptionList가 "값을 어떤 표현으로 그리나"를 공유.
// 자유 render 함수 금지(raw 구멍). 새 타입은 큐레이션 추가(헌법 4).
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';
import { Text } from './Text';
import { Badge } from './Badge';
import { Button } from './Button';
import { Group } from './Group';
import { Stack } from './Stack';
import { Avatar } from './Avatar';
import { Anchor } from './Anchor';
import { Image } from './Image';
import { Icon, type IconName } from './Icon';
import { IconButton } from './IconButton';
import { Menu } from './Menu';

dayjs.extend(relativeTime); // relative-time 셀용. locale은 인스턴스(.locale('ko'))로만 적용해 전역 부작용 없음.

// 표/설명목록 셀이 나를 수 있는 값 타입(닫힌 집합 — 큐레이션, 헌법 4). 자유 render 금지.
//  · user={name,src?} / tags=string[] / link={label,href} / percent=number /
//    secondary={primary,secondary?} / relative-time=ISO / thumbnail=src
export type CellType =
  | 'text' | 'badge' | 'number' | 'currency' | 'date' | 'boolean' | 'actions' | 'menu'
  | 'user' | 'tags' | 'link' | 'percent' | 'secondary' | 'relative-time' | 'thumbnail' | 'chevron';
// accent = 채우지 않는 진입·조작(글쓰기·더보기·초기화). 커밋(primary)은 하단 고정이 받는다 — Button.tsx VARIANT 주석.
export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
// 행위 중심 액션은 좌측 아이콘(icon) 또는 아이콘 전용(iconOnly). 중립 액션(취소·이동)은 둘 다 생략 → 텍스트.
export type Action = {
  label: string;
  variant?: ActionVariant;
  onClick: () => void;
  icon?: IconName;
  iconOnly?: boolean;        // true면 IconButton(aria-label=label). icon 필수.
};
export type BadgeColor = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

// ── 표 셀 정렬·헤더밴드·클립 — DataTable·ListWidget 공유(단일 출처, 두 곳 드리프트 차단) ──
// 셀 타입 → 정렬(관습): 숫자·돈·액션·퍼센트=우측 / boolean·썸네일·디스클로저=가운데 / 그 외=좌측.
export type CellAlign = 'left' | 'center' | 'right';
const CELL_RIGHT = new Set<CellType>(['number', 'currency', 'actions', 'menu', 'percent']);
const CELL_CENTER = new Set<CellType>(['boolean', 'thumbnail', 'chevron']);
export const cellAlign = (t: CellType): CellAlign => (CELL_RIGHT.has(t) ? 'right' : CELL_CENTER.has(t) ? 'center' : 'left');
export const alignToFlex = (a: CellAlign): 'flex-end' | 'center' | 'flex-start' =>
  (a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start');
export const cellJustify = (t: CellType) => alignToFlex(cellAlign(t));
// 헤더 셀 밴드 — 회색 + 하단 1px divider(inset boxShadow라 sticky로 핀돼도 그려진다; thead/tr 배경·보더는 sticky서 페인트 안 됨).
export const HEAD_CELL = { background: 'var(--bg-secondary)', boxShadow: 'inset 0 -1px 0 var(--border-default)' } as const;
// 셀 말줄임(넘치면 …).
export const CELL_CLIP = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const };

// 액션 1개 렌더 — 모든 호출처(표·PageHeader·Modal·EmptyState·DetailPage) 공유.
//  iconOnly+icon → IconButton / icon+label → Button leftIcon / 그 외 → 텍스트 Button.
export function renderAction(a: Action, key: number | string, size: 'sm' | 'md' = 'md') {
  if (a.iconOnly && a.icon) {
    return <IconButton key={key} icon={a.icon} label={a.label} variant={a.variant ?? 'ghost'} size={size} onClick={a.onClick} />;
  }
  return (
    <Button key={key} variant={a.variant ?? 'secondary'} size={size}
      leftIcon={a.icon ? <Icon name={a.icon} size={size} /> : undefined} onClick={a.onClick}>
      {a.label}
    </Button>
  );
}

function fmtDate(v: unknown): string {
  if (v == null || v === '') return '';
  const d = dayjs(v as string);
  return d.isValid() ? d.format('YYYY-MM-DD') : String(v);
}

// 한국 소비자 기준(잠정 — 다국어화 시 locale은 토큰/설정으로 분리).
const NUM = new Intl.NumberFormat('ko-KR');
const KRW = new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 });
// 통화·숫자 포맷의 단일 진실 공급원 — 셀뿐 아니라 분자(SummaryCard·TotalRow)도 이걸 재사용한다.
export function fmtNumber(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  return v == null || v === '' || Number.isNaN(n) ? '' : NUM.format(n); // 천 단위 ,
}
export function fmtCurrency(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  return v == null || v === '' || Number.isNaN(n) ? '' : KRW.format(n); // ₩ + 천 단위 ,
}

// badge 값→색 매핑은 스키마 주입(컬럼/아이템이 badgeColors로 넘김).
export function renderCell(
  type: CellType,
  value: unknown,
  opts?: { badgeColors?: Record<string, BadgeColor> },
) {
  switch (type) {
    case 'text':
      return <Text variant="body">{value == null ? '' : String(value)}</Text>;
    case 'number':
      return <Text variant="body">{fmtNumber(value)}</Text>;
    case 'currency':
      return <Text variant="body">{fmtCurrency(value)}</Text>;
    case 'date':
      return <Text variant="body">{fmtDate(value)}</Text>;
    case 'badge': {
      const v = String(value ?? '');
      const color = opts?.badgeColors?.[v] ?? 'neutral';
      return <Badge color={color}>{v}</Badge>;
    }
    case 'boolean':
      // true → check 아이콘(primary), false → 엷은 대시(비활성 색). 빈 칸 대신 명시적 false 표시.
      return value
        ? <Icon name="check" color="primary" />
        : <span style={{ color: 'var(--text-disabled)' }}>—</span>;
    case 'user': {
      const u = (value ?? {}) as { name?: string; src?: string };
      const nm = u.name ?? '';
      return (
        <Group gap="xs" align="center" wrap={false}>
          <Avatar size="sm" src={u.src}>{nm.slice(0, 1)}</Avatar>
          <Text variant="body">{nm}</Text>
        </Group>
      );
    }
    case 'tags': {
      const tags = Array.isArray(value) ? (value as string[]) : [];
      return <Group gap="xxs" wrap>{tags.map((t, i) => <Badge key={i} color="neutral">{t}</Badge>)}</Group>;
    }
    case 'link': {
      const l = (value ?? {}) as { label?: string; href?: string };
      return l.href ? <Anchor href={l.href}>{l.label ?? l.href}</Anchor> : <Text variant="body">{l.label ?? ''}</Text>;
    }
    case 'percent': {
      const n = typeof value === 'number' ? value : Number(value);
      return <Text variant="body">{Number.isNaN(n) ? '' : `${n}%`}</Text>;
    }
    case 'secondary': {
      const s = (value ?? {}) as { primary?: string; secondary?: string };
      return (
        <Stack gap="xxs">
          <Text variant="body">{s.primary ?? ''}</Text>
          {s.secondary && <Text variant="caption" color="secondary">{s.secondary}</Text>}
        </Stack>
      );
    }
    case 'relative-time': {
      const d = dayjs(value as string);
      return <Text variant="body">{d.isValid() ? d.locale('ko').fromNow() : ''}</Text>;
    }
    case 'thumbnail': {
      // src 문자열 또는 { src?, icon? } — 사진 없으면 폴백 글리프(목록에서도 '얼굴' 유지), 그것도 없으면 대시.
      const t = value == null || typeof value === 'string'
        ? { src: value as string | undefined, icon: undefined as IconName | undefined }
        : (value as { src?: string; icon?: IconName });
      if (t.src) return <Image src={t.src} alt="" size="sm" />;
      if (t.icon)
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 'var(--mantine-radius-sm)', background: 'var(--bg-secondary)' }}>
            <Icon name={t.icon} color="secondary" />
          </span>
        );
      return <span style={{ color: 'var(--text-disabled)' }}>—</span>;
    }
    case 'actions': {
      const acts = (value as Action[] | undefined) ?? [];
      return (
        <Group gap="xs" justify="end">
          {acts.map((a, i) => renderAction(a, i, 'sm'))}
        </Group>
      );
    }
    case 'menu': {
      // 행 액션을 케밥(⋯) 하나로 수납 — 큰 버튼이 행마다 꾸역꾸역 들어가는 걸 차단(좁은 표·다행 목록용).
      const acts = (value as Action[] | undefined) ?? [];
      if (acts.length === 0) return null;
      return (
        <Group gap="xs" justify="end">
          <Menu trigger={<IconButton icon="dots-vertical" label="더보기" variant="ghost" size="sm" />} items={acts} position="bottom" />
        </Group>
      );
    }
    case 'chevron':
      // 디스클로저 표시(›) — 이 행이 클릭하면 상세로 인도한다는 *시각적 장치*. 자체 동작 없음(클릭은 행 onRowClick으로 버블).
      //  value(boolean, 기본 true)로 행별 노출 제어 — false면 비드릴 행(빈 칸).
      return value === false
        ? null
        : <span style={{ display: 'inline-flex', color: 'var(--text-secondary)' }}><Icon name="chevron-right" size="sm" color="secondary" /></span>;
  }
}
