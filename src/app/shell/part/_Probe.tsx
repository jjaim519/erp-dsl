'use client';
// 측정 탐침 — 캔버스에서 마우스가 지난 요소의 **실측치**를 화면 구석에 띄운다.
//
//  왜 DevTools가 아니라 이건가: **스크린샷에 찍히기 때문**이다. 이 레포의 검증 고리는
//  「사람이 캡처 → LLM이 읽음」이고(LLM은 dev 서버를 못 띄운다 — macOS TCC), 그 왕복에서
//  수치가 빠지면 받는 쪽이 node_modules를 뒤지게 된다. 2026-08-20에 실제로 그랬다:
//  「버튼이 촌스럽다」 + 스크린샷 한 장을 받고 Mantine styles.css를 뒤져서야 md=42px·글자 16px을 알았다.
//  화면이 자기 수치를 말하면 그 왕복이 통째로 사라진다.
//
//  · 값은 `getComputedStyle` **실측**이다 — 손으로 적은 수치는 언젠가 틀린다.
//  · 마우스가 캔버스를 벗어나도 **마지막 값을 안 지운다.** 캡처하러 손이 화면 밖으로 나가야 하니까.
//  · hover 상태의 수치가 그대로 읽힌다 — `:hover`는 CSS 신뢰 상태라 강제로 못 만들지만,
//    마우스를 올린 채 전체화면 캡처하면 «그 순간의» 값이 패널에 찍혀 있다.
//  · Option(Alt)+클릭 = 고정/해제. 데모의 클릭과 안 겹친다(캡처 단계에서 삼킨다).
//  · 이름은 **우리 클래스**를 먼저 찾는다 — Mantine 해시(`m_77c9d27d`)는 사람에게 안 읽힌다.
//
//  dev 전용(배포 제외 — src/app은 publish `files` 화이트리스트 밖).
import { useEffect, useState } from 'react';

type Reading = {
  name: string;
  box: string;
  type: string;
  space: string;
  paint: string;
};

/** computed 값의 px 꼬리를 떼고 반올림 — `13.3333px` 같은 소수가 표에서 눈을 잡아먹는다. */
const num = (v: string) => (v.endsWith('px') ? String(Math.round(parseFloat(v) * 10) / 10) : v);

/** rgb(a) → 짧은 표기. 투명은 «없음»으로(0을 색으로 읽으면 안 된다). */
function shortColor(v: string): string {
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return v;
  const parts = m[1].split(',').map((s) => parseFloat(s));
  const [r, g, b, a] = parts;
  if (a === 0) return '없음';
  const hex = [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
  return '#' + hex + (a !== undefined && a < 1 ? `·${a}` : '');
}

/** 네 변이 같으면 한 값으로, 다르면 상/우/하/좌. 「패딩이 22」인지 「위아래만 다른지」를 한눈에. */
const quad = (t: string, r: string, b: string, l: string) => {
  const v = [t, r, b, l].map(num);
  return v.every((x) => x === v[0]) ? v[0] : v.join(' ');
};

function nameOf(el: Element): string {
  const raw = typeof el.className === 'string' ? el.className : '';
  //  Mantine 해시(m_xxxx)와 Next 내부(__xxx)는 사람에게 정보가 0이라 걸러낸다.
  const ours = raw.split(/\s+/).find((c) => c && !/^m_/.test(c) && !/^__/.test(c));
  const tag = el.tagName.toLowerCase();
  return ours ? `${tag}.${ours}` : tag;
}

function readAt(el: Element): Reading {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const isTrack = cs.display.includes('flex') || cs.display.includes('grid');
  return {
    name: nameOf(el),
    box: `${Math.round(r.width)}×${Math.round(r.height)}`,
    type: `${num(cs.fontSize)} / ${cs.fontWeight} / lh ${num(cs.lineHeight)}`,
    space: [
      `p ${quad(cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft)}`,
      `r ${quad(cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius)}`,
      isTrack && cs.gap !== 'normal' ? `gap ${num(cs.rowGap)}` : '',
    ].filter(Boolean).join('  '),
    paint: [
      `글 ${shortColor(cs.color)}`,
      `면 ${shortColor(cs.backgroundColor)}`,
      parseFloat(cs.borderTopWidth) > 0 ? `선 ${num(cs.borderTopWidth)} ${shortColor(cs.borderTopColor)}` : '선 없음',
    ].join('  '),
  };
}

export function Probe() {
  const [reading, setReading] = useState<Reading | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (pinned) return;
      const el = e.target as Element | null;
      if (!el || !(el instanceof Element)) return;
      if (el.closest('[data-probe]')) return;   // 자기 자신은 안 잰다
      setReading(readAt(el));
    };
    //  Alt+클릭으로 고정 — **캡처 단계**에서 삼켜 데모의 onClick이 안 터지게 한다.
    //  (키보드 단축키를 안 쓰는 이유: 캔버스 안에 입력칸이 많아 글자가 들어간다.)
    const click = (e: MouseEvent) => {
      if (!e.altKey) return;
      e.preventDefault();
      e.stopPropagation();
      setPinned((p) => !p);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('click', click, true);
    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('click', click, true);
    };
  }, [pinned]);

  if (!reading) return null;

  return (
    <div
      data-probe
      style={{
        position: 'fixed', right: 8, bottom: 8, zIndex: 9999,
        //  역할 변수를 **뒤집어** 쓴다 — 라이트/다크 어느 캔버스에서도 패널이 바닥과 붙지 않는다.
        background: 'var(--text-primary)', color: 'var(--bg-primary)',
        borderRadius: 'var(--mantine-radius-xs)',
        padding: '6px 9px',
        font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
        pointerEvents: 'none',
        maxWidth: '60%',
        opacity: 0.94,
      }}
    >
      <div style={{ fontWeight: 700 }}>
        {reading.name} <span style={{ opacity: 0.7 }}>{reading.box}</span>
        {pinned && <span style={{ opacity: 0.7 }}> · 고정</span>}
      </div>
      <div style={{ opacity: 0.85 }}>{reading.type}</div>
      <div style={{ opacity: 0.85 }}>{reading.space}</div>
      <div style={{ opacity: 0.85 }}>{reading.paint}</div>
    </div>
  );
}
