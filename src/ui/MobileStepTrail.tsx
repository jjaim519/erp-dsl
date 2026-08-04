'use client';
// MobileStepTrail (분자) — 단계의 진행. 전자결재의 *결재선*이 첫 소비처지만 부품은 결재를 모른다.
//
//  왜 MobileListRow로 안 되나: 그 행은 "누르면 다른 화면으로 간다"(chevron)인데 결재선은 읽는 것이고,
//   무엇보다 **단계 사이의 순서와 현재 위치**를 말해야 한다. 행 목록으론 "지금 누구 차례"가 안 보인다.
//  왜 Timeline이 아닌가: Timeline은 *일어난 일*의 기록이다. 여기는 **아직 안 일어난 단계까지** 그린다
//   ('plan'·'halt'). 미래를 그리는 건 타임라인의 일이 아니다.
//  왜 데스크탑 결재란 격자가 아닌가: 06 §5 — "결재란 격자는 폰에서 트레일로". 도장 칸을 가로로 늘어놓으면
//   폰 폭에 안 들어가고, 늘어놓을수록 "지금 어디"가 흐려진다.
//
//  · 기본은 **접힘**이다. 단계가 5~6개면 펼친 채로 화면을 다 먹는다. 접힌 줄은 *요약*을 말한다
//    ("2/4 · 옥성훈 차례") — 값을 숨기지 않는 접기다(MobileBoardWrite 수신자와 같은 규율).
//  · 코멘트는 **반려·중단에만** 보인다. 승인 코멘트까지 펼치면 트레일이 길어지고, 반려 사유는
//    "왜 멈췄나"라 본체지만 승인 사유는 대개 없거나 형식적이다.
import { useState } from 'react';
import { Icon } from './Icon';
import { Text } from './Text';
import './mobilelist.css';

/** 단계의 상태 — 닫힌 열거. 부품은 이 다섯 말고 모른다. */
export type StepState =
  | 'done'      // 끝난 단계(승인·상신)
  | 'current'   // 지금 여기
  | 'plan'      // 예정
  | 'reject'    // 반려 — 여기서 멈췄다
  | 'halt';     // 앞이 막혀 진행 못 함

export type TrailStep = {
  id: string;
  role: string;              // '기안' '1차' '최종' — 도메인 어휘는 소비처가 준다
  name: string;
  meta?: string;             // '인사팀 팀장 · 07.01 14:05' — 조합·포맷은 소비처
  state: StepState;
  stateLabel?: string;       // 배지 문구('승인'·'대기'). 없으면 배지를 안 그린다
  comment?: string;          // reject·halt에서만 그린다(위 헤더 주석)
};

type Props = {
  steps: TrailStep[];
  /** 접힌 줄의 요약. 안 주면 부품이 "n/N" 만 만든다(이름·차례는 도메인이라 부품이 못 지어낸다). */
  summary?: string;
  defaultOpen?: boolean;     // 기본 false = 접힘
  label?: string;            // 접힌 줄 좌측 이름표(기본 '결재선')
};

const NODE_GLYPH: Partial<Record<StepState, string>> = { done: '✓', reject: '✕' };

export function MobileStepTrail({ steps, summary, defaultOpen = false, label = '결재선' }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  const doneCount = steps.filter((s) => s.state === 'done').length;
  const auto = `${doneCount}/${steps.length}`;

  return (
    <div className="mtr">
      <button type="button" className="mtr-sum" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="mtr-sum-l">{label}</span>
        {/* 접어도 **값은 보인다** — 숨기는 건 단계 목록이지 "어디까지 왔나"가 아니다. */}
        <span className="mtr-sum-v">{summary ?? auto}</span>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size="sm" color="secondary" />
      </button>

      {open && (
        <ol className="mtr-list">
          {steps.map((s, i) => (
            <li key={s.id} className="mtr-step" data-state={s.state} data-last={i === steps.length - 1 ? '' : undefined}>
              <span className="mtr-node" aria-hidden>{NODE_GLYPH[s.state] ?? ''}</span>
              <span className="mtr-body">
                <span className="mtr-head">
                  <span className="mtr-role">{s.role}</span>
                  <span className="mtr-name">{s.name}</span>
                  {s.stateLabel && <span className="mtr-state">{s.stateLabel}</span>}
                </span>
                {s.meta && <Text variant="caption" color="secondary">{s.meta}</Text>}
                {/* 코멘트는 멈춘 단계에만 — 승인 코멘트까지 펼치면 트레일이 길어진다. */}
                {s.comment && (s.state === 'reject' || s.state === 'halt') && (
                  <span className="mtr-cmt">{s.comment}</span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
