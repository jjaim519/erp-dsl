'use client';

// ─────────────────────────────────────────────────────────────
// 0단계 시각 검증용 dev 프리뷰. DSL 부품이 아니라 "화면 확인 도구"다.
// 격리 구역(src/ui) 안이라 Mantine을 직접 만질 수 있고, 토큰을 *읽어서*
// 그리기만 한다(hex 리터럴 없음 — gate 2는 여기서도 켜져 있음).
// ─────────────────────────────────────────────────────────────

import { useMantineTheme, Box, Group, Stack, Text, Title } from '@mantine/core';
import { Button } from './Button';
import { Title as UiTitle } from './Title';
import { Text as UiText } from './Text';
import { Divider } from './Divider';

const COLOR_NAMES = ['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const;
const SHADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const TYPO = ['display', 'heading', 'subheading', 'body', 'body-strong', 'caption'] as const;
const SPACING = ['xxs', 'xs', 'sm', 'md', 'lg', 'xl', 'xxl'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="sm">
      <Text fw={700} style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
        {title}
      </Text>
      {children}
    </Stack>
  );
}

// ── 곡률 실험대 ────────────────────────────────────────────────────────────────
//  왜 여기가 필요한가: 「스쿼클을 도입했다」는 결정이 화면에서 실현이 안 되고 있었다.
//  값(`superellipse(2)`)도 셀렉터(`mantine-Button-root`)도 정상인데 **반경이 작아서** 안 보인다 —
//  원호(k=2)와 스쿼클(k=4)이 45°에서 벌어지는 거리가 `0.189 × r`이라, r=8이면 1.5px이다.
//  즉 화면에서 제일 많이 보이는 물건(버튼·입력칸, radius sm=8)에 곡률이 사실상 없었다.
//
//  두 축의 곱이라 말로는 못 고른다 → 나란히 깔고 눈으로 고른다.
//   · 가로 = 반경 후보(4·8·12·16·24)  · 세로 = 곡률 후보
//   · `superellipse(s)`의 s는 **수학 지수가 아니다** — 수학 k = 2^s다.
//     원호 k2 = s1 / 표준 스쿼클(=`squircle` 키워드) k4 = s2 / **애플 quintic k5 = s2.32**.
//     (애플 실형상은 연속곡률 스플라인이라 순수 초타원이 아니고, n=5가 가장 가까운 단순 초타원이다.)
//   · Chromium만 그린다(Safari·FF는 평범한 둥근 모서리로 graceful fallback) — 크롬에서 볼 것.
const RADII = [4, 8, 12, 16, 24];
const CURVES = [
  { label: '원호  round (k2)', shape: 'round' },
  { label: '스쿼클 superellipse(2) — 현재 (k4)', shape: 'superellipse(2)' },
  { label: '애플  superellipse(2.32) (k5)', shape: 'superellipse(2.32)' },
  { label: '더 각짐 superellipse(3) (k8)', shape: 'superellipse(3)' },
];

function CornerLab() {
  return (
    <Section title="곡률 × 반경 실험대 (스쿼클이 어디서부터 보이나)">
      <Stack gap="md">
        <Group gap="xl" style={{ paddingLeft: 232 }}>
          {RADII.map((r) => <Text key={r} size="xs" c="dimmed" style={{ width: 72 }}>r {r}</Text>)}
        </Group>
        {/* `corner-shape`는 React가 아는 style 속성이 아니라 인라인 객체로 넣으면 조용히 떨어진다.
            클래스로 내면 브라우저가 그냥 파싱한다(미지원 브라우저는 이 선언만 무시 — fallback 그대로). */}
        <style>{CURVES.flatMap((c, ci) =>
          RADII.map((r) => `.cl-${ci}-${r}{border-radius:${r}px;corner-shape:${c.shape}}`),
        ).join('')}</style>
        {CURVES.map((c, ci) => (
          <Group key={c.shape} gap="xl" align="center">
            <Text size="xs" c="dimmed" style={{ width: 216 }}>{c.label}</Text>
            {RADII.map((r) => (
              <Box key={r} className={`cl-${ci}-${r}`}
                style={{ background: 'var(--mantine-color-primary-6)', width: 72, height: 40 }} />
            ))}
          </Group>
        ))}
        <UiText variant="caption" color="secondary">
          40px 높이 = 버튼 md와 같은 박스. 지금 버튼은 <b>r 8 · superellipse(2)</b> 칸이고, 원호 칸과 1.5px 차이라 구분이 안 된다.
          곡률이 읽히기 시작하는 건 <b>r 12</b>부터다(2.3px).
        </UiText>
      </Stack>
    </Section>
  );
}

export function DevTokenPreview() {
  const theme = useMantineTheme();
  return (
    <Stack gap="xl" p="xl" style={{ background: 'var(--bg-tertiary)', minHeight: '100vh' }}>
      <Title order={1} style={{ color: 'var(--text-primary)' }}>ERP DSL — 0단계 토큰 프리뷰</Title>
      <Text style={{ color: 'var(--text-secondary)' }}>
        아래 값은 전부 화면 검증에서 조정할 잠정값입니다. 구조·관계만 확정.
      </Text>

      <Section title="색 사다리 (10칸 · index 6 = 메인)">
        <Stack gap="xs">
          {COLOR_NAMES.map((name) => (
            <Group gap={0} key={name} wrap="nowrap">
              <Text w={90} style={{ color: 'var(--text-primary)' }} fw={600}>{name}</Text>
              {SHADES.map((i) => (
                <Box key={i} style={{
                  background: theme.colors[name][i],
                  width: 48, height: 40,
                  outline: i === 6 ? '2px solid var(--text-primary)' : 'none',
                  outlineOffset: -2,
                }} />
              ))}
            </Group>
          ))}
        </Stack>
      </Section>

      <Section title="시맨틱 역할 (모드 분기 지점)">
        <Group gap="lg">
          <Stack gap={4}>
            <Text style={{ color: 'var(--text-primary)' }}>text.primary</Text>
            <Text style={{ color: 'var(--text-secondary)' }}>text.secondary</Text>
            <Text style={{ color: 'var(--text-danger)' }}>text.danger</Text>
            <Text style={{ color: 'var(--text-disabled)' }}>text.disabled</Text>
          </Stack>
          <Group gap="xs">
            {(['primary', 'secondary', 'tertiary'] as const).map((k) => (
              <Box key={k} style={{ background: `var(--bg-${k})`, width: 80, height: 56, border: 'var(--border-width) solid var(--border-default)', borderRadius: theme.radius.sm }} />
            ))}
          </Group>
        </Group>
      </Section>

      <Section title="타이포 6단계">
        <Stack gap="xs">
          {TYPO.map((t) => {
            const spec = theme.other.typography[t];
            return (
              <Text key={t} style={{ color: 'var(--text-primary)', fontSize: spec.fontSize, fontWeight: spec.fontWeight, lineHeight: spec.lineHeight }}>
                {t} — 발주서 가나다 ABC 123
              </Text>
            );
          })}
        </Stack>
      </Section>

      <Section title="타이포 조합 시안 (6단계가 함께 놓였을 때)">
        <Box style={{ background: 'var(--bg-primary)', border: 'var(--border-width) solid var(--border-default)', borderRadius: theme.radius.md, padding: theme.spacing.lg }}>
          <Stack gap="md">
            {/* display + caption: 큰 수치 + 메타 */}
            <Stack gap="xxs">
              <UiTitle variant="display">₩12,840,000</UiTitle>
              <UiText variant="caption" color="secondary">이번 달 총 발주액 · 전월 대비 +8.2%</UiText>
            </Stack>
            <Divider />
            {/* heading + body + 인라인 body-strong */}
            <Stack gap="xs">
              <UiTitle variant="heading">최근 발주</UiTitle>
              <UiText variant="body">
                합판 200장 발주가 <UiText variant="body-strong">승인 대기</UiText> 상태입니다. 납기는 6월 20일이며, 단가는 확정되었습니다.
              </UiText>
            </Stack>
            {/* subheading + body + caption: 하위 구획 */}
            <Stack gap="xs">
              <UiTitle variant="subheading">담당자 메모</UiTitle>
              <UiText variant="body">단가 재확인이 필요합니다. 공급처 변경 가능성이 있어 다음 주 회의에서 논의 예정.</UiText>
              <UiText variant="caption" color="secondary">2026-06-15 오전 11:40 · 김병준</UiText>
            </Stack>
          </Stack>
        </Box>
      </Section>

      <Section title="간격 (4px 베이스)">
        <Stack gap="xs">
          {SPACING.map((s) => (
            <Group gap="xs" key={s} align="center">
              <Text w={48} style={{ color: 'var(--text-primary)' }}>{s}</Text>
              <Box style={{ background: theme.colors.primary[6], height: 16, width: theme.spacing[s] }} />
              <Text style={{ color: 'var(--text-secondary)' }}>{theme.spacing[s]}</Text>
            </Group>
          ))}
        </Stack>
      </Section>

      {/* 곡률 실험대는 아래 CornerLab — radius 스케일 자체를 정하는 자리라 이 절과 짝이다. */}
      <Section title="radius · 그림자">
        <Group gap="lg">
          {(['sm', 'md', 'full'] as const).map((r) => (
            <Box key={r} style={{ background: theme.colors.primary[6], width: 72, height: 56, borderRadius: theme.radius[r] }} />
          ))}
          {(['sm', 'md'] as const).map((sh) => (
            <Box key={sh} style={{ background: 'var(--bg-primary)', width: 72, height: 56, boxShadow: theme.shadows[sh], borderRadius: theme.radius.md }} />
          ))}
        </Group>
      </Section>

      <CornerLab />

      <Section title="Button 원자 (variant 5 × 밀도 3 + 상태)">
        <Group gap="md">
          <Button variant="primary">저장</Button>
          <Button variant="secondary">취소</Button>
          <Button variant="danger">삭제</Button>
          <Button variant="ghost">더보기</Button>
          <Button variant="accent">글쓰기</Button>
        </Group>
        <Group gap="md">
          <Button size="xs">28</Button>
          <Button size="sm">32</Button>
          <Button size="md">40</Button>
          <Button loading>loading</Button>
          <Button disabled>disabled</Button>
        </Group>
      </Section>
    </Stack>
  );
}
