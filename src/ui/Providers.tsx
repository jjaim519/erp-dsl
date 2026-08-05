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
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { theme, cssVariablesResolver } from './theme';
// 달력 드롭다운 안쪽(월 이름·요일 머리)은 **dayjs 로케일**이 그린다 — valueFormat으로는 안 고쳐진다.
//  이 import는 로케일을 *등록*만 한다(전역 기본값을 바꾸지 않는다). 실제 적용은 아래 DatesProvider가
//  컨텍스트로 내려 Mantine이 인스턴스에 거는 방식이라, _cells가 세운 규율("locale은 인스턴스로만 —
//  전역 부작용 없음")과 충돌하지 않는다.
//  ⚠ _cells에도 같은 import가 있지만 **지우지 말 것.** 소비처가 _cells를 안 거치고 Providers + DatePicker만
//    쓸 수 있고, 그때 등록이 안 돼 있으면 드롭다운이 영어로 돌아간다.
import 'dayjs/locale/ko';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      defaultColorScheme="light"
    >
      {/* 날짜 로케일 — 이 자리가 없으면 DatePicker 계열이 통째로 영어로 나온다(소비처 12개 파일에서 그랬다).
          firstDayOfWeek: **1(월요일)** — 우리 달력 셋이 전부 월요일 시작으로 못박혀 있다
          (Calendar.tsx "월요일 시작(내부 고정)" · CalendarPage · MobileCalendar).
          0(일요일)으로 두면 **DatePicker 드롭다운만** 주 시작이 달라져 같은 앱에서 달력이 갈린다. */}
      <DatesProvider settings={{ locale: 'ko', firstDayOfWeek: 1 }}>
        {/* 토스트 마운트 — 위치 우상단 고정(시스템 규약). 바깥은 notify.*만 호출. */}
        <Notifications position="top-right" />
        {children}
      </DatesProvider>
    </MantineProvider>
  );
}
