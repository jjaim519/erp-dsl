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
import './week.css';        // 요일 색(토파랑·일빨강·공휴일) — 날짜 입력 드롭다운은 포털이라 전역이어야 닿는다
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import type { ReactNode } from 'react';
import { theme, cssVariablesResolver } from './theme';
import { WEEK_START } from './_week';
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
          주 시작은 **여기서 정하지 않는다**(_week.WEEK_START) — 달력 넷이 한 값을 봐야 하고,
          이 파일은 그중 하나(드롭다운)만 정할 수 있는 자리라 진실을 둘 데가 아니다.
          weekendDays: **[]** — 주말 색은 우리가 그린다(week.css). Mantine 기본은 토·일을 한 색으로
          칠하는데 한국 관습은 토=파랑·일=빨강 둘이라, 켜 두면 한 채널에 두 진실이 겹친다. */}
      <DatesProvider settings={{ locale: 'ko', firstDayOfWeek: WEEK_START, weekendDays: [] }}>
        {/* 토스트 마운트 — 위치 우상단 고정(시스템 규약). 바깥은 notify.*만 호출. */}
        <Notifications position="top-right" />
        {children}
      </DatesProvider>
    </MantineProvider>
  );
}
