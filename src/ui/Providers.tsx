'use client';

// ─────────────────────────────────────────────────────────────
// App Router 배선 (부품이 아니라 플러밍). @mantine/core 직접 import는
// gate 1에 걸리므로 격리 구역(src/ui) 안에 가두고, 바깥엔 이 Providers만 노출.
// ─────────────────────────────────────────────────────────────

import './fonts.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './appshell.css';
import './calendar.css';
import './controls.css';
import './collector.css';
import './squircle.css';
import './fontscale.css';
import './a11y.css';        // 전역 층(L0) — keep-all · 고대비 · 모션. 06 §1
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { theme, cssVariablesResolver } from './theme';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
    >
      {/* 토스트 마운트 — 위치 우상단 고정(시스템 규약). 바깥은 notify.*만 호출. */}
      <Notifications position="top-right" />
      {children}
    </MantineProvider>
  );
}
