'use client';
// MobileDisclosure (분자) — 그 자리에서 펼쳐지는 행. MobileListRow(다른 화면으로 이동)의 짝.
//  · 행동이 다르므로 별개 named 부품이다 — 하나에 옵션으로 얹지 않는다(§11-3).
//    이동은 chevron-right, 펼침은 chevron-down(회전) — 어포던스가 방향으로 갈린다.
//  · 데스크탑 Collapsible을 쓰지 않는 이유: 그 부품은 Card(면) 위에 서는데, 모바일은 면을 안 쓰고
//    헤어라인으로만 나눈다. 행동은 같아도 표면 체계가 반대라 재사용하면 두 체계가 섞인다.
//  · 펼침 상태는 UI 표현이라 내부 상태(uncontrolled, defaultOpen) — Collapsible과 같은 판단.
//  · "여러 개 중 하나만 열림"은 이 부품 일이 아니다. 여러 개를 세로로 쌓아 구성한다(Collapsible과 동일 경계).
import { useState, type ReactNode } from 'react';
import { Icon } from './Icon';
import './mobilelist.css';

type Props = {
  title: string;
  // 제목 옆 보조 — 한 줄 안의 **타이포 위계**. title을 ReactNode로 열지 않은 이유:
  //  raw 슬롯이면 무엇이든 들어와 한 줄의 규격이 소비처마다 갈린다(06 §3-1 — 축이 추가될 때만 연다).
  //  요구는 "위계가 두 단"이고 그건 축 하나로 닫힌다. 짧아야 한다 — meta처럼 flex:none이라
  //  길면 제목을 밀어낸다(보조가 주를 밀면 그건 보조가 아니다).
  sub?: string;
  meta?: string;          // 접힌 상태에서도 보이는 우측 요약값(금액·건수 등)
  defaultOpen?: boolean;
  children: ReactNode;    // 펼쳐지는 내용 — raw 슬롯
};

export function MobileDisclosure({ title, sub, meta, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mdis" data-open={open || undefined}>
      <button type="button" className="mdis-hd" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {/* 제목+보조는 한 묶음으로 폭을 갖는다 — 따로 두면 보조가 우측 meta 쪽으로 밀려
            "제목 옆 보조"가 아니라 "또 하나의 우측 값"으로 읽힌다. */}
        <span className="mdis-t">
          <span className="mdis-title">{title}</span>
          {sub && <span className="mdis-sub">{sub}</span>}
        </span>
        {meta && <span className="mdis-meta">{meta}</span>}
        <span className="mdis-chev"><Icon name="chevron-down" size="sm" color="secondary" /></span>
      </button>
      {open && <div className="mdis-body">{children}</div>}
    </div>
  );
}
