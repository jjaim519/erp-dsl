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

// ── 모서리(반경 × 곡률) ────────────────────────────────────────────────────────
//  실험대는 걷었다 — 값이 정해졌으니 이 절은 «후보 대조»가 아니라 «채택된 것의 전시»다.
//  결정 근거는 theme.ts의 radius 주석에 있다(요지: 반경은 크기 대역의 함수고, r ≥ 높이/2면
//  브라우저가 클램프해 알약이 되므로 한 값이 16~600px 전 대역을 못 덮는다).
//
//  ⚠ 이 미리보기 박스는 raw div라 `squircle.css` 화이트리스트 밖이다 — 곡률을 직접 걸어줘야
//    실물과 같아진다. 그리고 `corner-shape`는 React가 아는 style 속성이 아니라 인라인 객체로
//    넣으면 조용히 떨어지므로, 클래스로 낸다.
//  ⚠ **`full`은 곡률을 안 받는다.** superellipse는 «원/알약의 둥근 곡선까지» 각지게 만들어서
//    알약이 둥근 사각이 된다 — 그래서 `squircle.css`가 blacklist가 아니라 **whitelist**다
//    (Button·Paper·Input·Modal·Popover·SegmentedControl만 켜고, Chip·Avatar·Switch·Radio는 자동 제외).
//    이 프리뷰가 처음에 full에도 곡률을 걸어 그 실패를 그대로 재현했다 — 아래 마지막 칸이 그 증거다.
const RADIUS_BANDS = [
  { key: 'xs', label: '작은 내부 요소', note: '스와치·마커·툴바 항목 (16~30px)', h: 24, curved: true },
  { key: 'sm', label: '컨트롤', note: 'Button·TextInput·Select (28~44px) · defaultRadius', h: 32, curved: true },
  { key: 'md', label: '면', note: 'Card·Modal·Popover·Drawer', h: 72, curved: true },
  { key: 'full', label: '알약 (직사각일 때)', note: 'Chip·Avatar·Switch — 곡률 제외(whitelist 밖)', h: 32, curved: false },
] as const;

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

      <Section title="radius — 단 이름이 곧 크기 대역이다">
        <Stack gap="sm">
          <style>{[
            ...RADIUS_BANDS.map((b) =>
              `.rb-${b.key}{border-radius:${theme.radius[b.key]};corner-shape:${b.curved ? 'var(--corner-shape)' : 'round'}}`),
            //  반증 칸 — full에 곡률을 걸면 알약이 둥근 사각이 된다(whitelist가 존재하는 이유).
            `.rb-full-bad{border-radius:${theme.radius.full};corner-shape:var(--corner-shape)}`,
          ].join('')}</style>
          <Group gap="xl" align="flex-end">
            {RADIUS_BANDS.map((b) => (
              <Stack key={b.key} gap="xxs" align="center" style={{ width: 128 }}>
                <Box className={`rb-${b.key}`} style={{ background: 'var(--mantine-color-primary-6)', width: 112, height: b.h }} />
                <Text size="xs" fw={700}>{b.key} · {theme.radius[b.key]}</Text>
                <Text size="xs" c="dimmed" ta="center">{b.label}</Text>
              </Stack>
            ))}
            {/* `full`은 **원이 아니라 «반경 = 높이/2»**다 — 박스가 정사각일 때만 그 결과가 원이 된다.
                라벨에 「알약·원」이라 써 놓고 직사각 하나만 그리면 Avatar(56×56 원)와 안 맞아 보인다.
                실제로 그 질문이 나왔다(2026-08-20) → 같은 토큰의 두 결과를 나란히 그린다. */}
            <Stack gap="xxs" align="center" style={{ width: 128 }}>
              <Box className="rb-full" style={{ background: 'var(--mantine-color-primary-6)', width: 44, height: 44 }} />
              <Text size="xs" fw={700}>full · 정사각</Text>
              <Text size="xs" c="dimmed" ta="center">= 원 (Avatar)</Text>
            </Stack>
            {/* 반증 — 알약에 곡률을 걸면 이렇게 된다. 「왜 whitelist인가」의 증거로 남긴다. */}
            <Stack gap="xxs" align="center" style={{ width: 128 }}>
              <Box className="rb-full-bad" style={{ background: 'var(--mantine-color-danger-5)', width: 112, height: 32 }} />
              <Text size="xs" fw={700}>full + 곡률</Text>
              <Text size="xs" c="dimmed" ta="center">✗ 알약이 둥근 사각이 된다</Text>
            </Stack>
          </Group>
          <UiText variant="caption" color="secondary">
            곡률은 <b>corner-shape: {String(theme.other.cornerShape)}</b> — 애플 quintic(수학 k5).
            CSS의 <code>superellipse(s)</code>에서 s는 수학 지수가 아니라 <b>k = 2<sup>s</sup></b>다(s1=원호 · s2=표준 스쿼클 · s2.32=애플).
            Chromium만 그린다 — Safari·FF는 평범한 둥근 모서리로 graceful fallback.
            <b> 곡률은 박스에만 켠다</b>(squircle.css whitelist) — 원·알약에 걸면 마지막 칸처럼 각져서 Chip·Avatar·Switch·Radio는 제외된다.
          </UiText>
          <UiText variant="caption" color="secondary">
            {RADIUS_BANDS.map((b) => `${b.key}=${b.note}`).join('  ·  ')}
          </UiText>
        </Stack>
      </Section>

      {/* 그림자는 **두 벌**이다 — Mantine 스케일(shadows.sm/md)과 우리 elevation(raised/overlay).
          전 프리뷰는 앞의 것만 그려서 «2축»(surface containment × elevation lift)이 화면에 없었다.
          둘은 짝이 정해져 있다: raised = 페이지 위에 뜬 위젯 / overlay = 모달·드롭다운. */}
      <Section title="그림자 — Mantine 스케일 · elevation 2축">
        <Group gap="xl" align="flex-end">
          {[
            { label: 'shadows.sm', box: theme.shadows.sm },
            { label: 'shadows.md', box: theme.shadows.md },
            { label: 'elevation-raised (위젯)', box: 'var(--elevation-raised)', surface: 'var(--surface-raised)' },
            { label: 'elevation-overlay (모달·드롭다운)', box: 'var(--elevation-overlay)', surface: 'var(--surface-overlay)' },
          ].map((e) => (
            <Stack key={e.label} gap="xxs" align="center" style={{ width: 168 }}>
              <Box style={{
                background: e.surface ?? 'var(--bg-primary)', width: 112, height: 72,
                boxShadow: e.box, borderRadius: theme.radius.md,
              }} />
              <Text size="xs" c="dimmed" ta="center">{e.label}</Text>
            </Stack>
          ))}
        </Group>
      </Section>

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
