'use client';
// PaperDoc (유기체) — 문서 정의(PaperSpec)를 받아 A4 여러 장으로 그린다. 도메인 0줄.
//  · 배치(쪽 나눔·반복 펼침·집계)는 순수 엔진(paperLayout)이 하고 여기는 그리기만 한다.
//  · 격자는 *정렬 골격*이고 선은 셀의 속성이다 — 테두리가 없는 칸도 자리를 지킨다(엑셀과 같다).
//  · **선 소유권**: 각 선은 정확히 한 셀이 그린다(자기 위·왼쪽). 인접 셀이 각자 4변을 그리면
//    맞닿은 자리가 2px이 되어 "안쪽만 굵은 표"가 된다 — 손으로 표를 그릴 때 매번 나는 그 결함.
//  · 빈 칸도 실제로 렌더한다(dense) — 그래야 위 규칙으로 블록의 아래·오른쪽 선을 아래·오른쪽 칸이 그린다.
import './paper.css';
import { useMemo } from 'react';
import {
  PAPER_CANON, PAPER_MARGIN, PAPER_ROW_UNIT,
  type PaperSpec, type PaperCell,
} from '../schema/paper';
import { layoutPaper, type OutRow } from './paperLayout';

type Props = {
  spec: PaperSpec;
  values?: Record<string, unknown>;
  /** 화면 축소 배율(1 = 원본 794px). 인쇄는 항상 물리 A4 1:1. */
  scale?: number;
};

type Placed = { cell: PaperCell; text: string; r: number };

// 한 장 = [머리말 … 본문 … 여백 … 꼬리말]. 여백이 꼬리말을 바닥으로 민다.
function assemble(page: { header: OutRow[]; body: OutRow[]; footer: OutRow[]; pad: number }) {
  const rows: OutRow[] = [];
  const placed: Placed[] = [];
  const push = (list: OutRow[]) => {
    list.forEach((row) => {
      row.cells.forEach((c) => placed.push({ cell: c.spec, text: c.text, r: rows.length }));
      rows.push(row);
    });
  };
  push(page.header);
  push(page.body);
  for (let i = 0; i < page.pad; i++) rows.push({ h: 1, cells: [] });
  push(page.footer);
  return { rows, placed };
}

export function PaperDoc({ spec, values = {}, scale = 1 }: Props) {
  const pages = useMemo(() => layoutPaper(spec, values), [spec, values]);
  const canon = PAPER_CANON[spec.orientation];

  return (
    <div className="erpPaperDoc">
      {pages.map((page, pi) => {
        const { rows, placed } = assemble(page);
        const total = rows.length;

        // ── 선 지도 — 셀이 "그리겠다"고 선언한 변을 격자선 좌표로 등록한다.
        const h = new Set<string>();   // 가로선: 행 r 위, 열 c
        const v = new Set<string>();   // 세로선: 열 c 왼쪽, 행 r
        placed.forEach(({ cell, r }) => {
          const cs = cell.cs ?? 1;
          const rs = cell.rs ?? 1;
          (cell.border ?? []).forEach((e) => {
            if (e === 't') for (let c = cell.c; c < cell.c + cs; c++) h.add(`${r}:${c}`);
            if (e === 'b') for (let c = cell.c; c < cell.c + cs; c++) h.add(`${r + rs}:${c}`);
            if (e === 'l') for (let y = r; y < r + rs; y++) v.add(`${y}:${cell.c}`);
            if (e === 'r') for (let y = r; y < r + rs; y++) v.add(`${y}:${cell.c + cs}`);
          });
        });

        // ── 빈 칸 채우기 — 격자를 빠짐없이 덮는다(선 소유권이 성립하려면 아래·오른쪽 칸이 있어야 한다).
        const taken = new Set<string>();
        placed.forEach(({ cell, r }) => {
          for (let y = r; y < r + (cell.rs ?? 1); y++)
            for (let c = cell.c; c < cell.c + (cell.cs ?? 1); c++) taken.add(`${y}:${c}`);
        });
        const fillers: { r: number; c: number }[] = [];
        for (let r = 0; r < total; r++)
          for (let c = 0; c < spec.columns; c++)
            if (!taken.has(`${r}:${c}`)) fillers.push({ r, c });

        const edges = (r: number, c: number, cs: number, rs: number) => [
          h.has(`${r}:${c}`) ? 'bt' : '',
          v.has(`${r}:${c}`) ? 'bl' : '',
          c + cs === spec.columns && v.has(`${r}:${spec.columns}`) ? 'br' : '',
          r + rs === total && h.has(`${total}:${c}`) ? 'bb' : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={pi}
            className="erpPaperSheet"
            style={{
              width: canon.w, height: canon.h,
              transform: scale === 1 ? undefined : `scale(${scale})`,
              marginBottom: scale === 1 ? undefined : canon.h * (scale - 1),
            }}
          >
            <div
              className="erpPaperGrid"
              style={{
                top: PAPER_MARGIN, left: PAPER_MARGIN,
                right: PAPER_MARGIN, bottom: PAPER_MARGIN,
                gridTemplateColumns: `repeat(${spec.columns}, 1fr)`,
                gridTemplateRows: rows.map((r) => `${r.h * PAPER_ROW_UNIT}px`).join(' '),
              }}
            >
              {placed.map(({ cell, text, r }, i) => {
                const cs = cell.cs ?? 1;
                const rs = cell.rs ?? 1;
                const cls = [
                  'erpPaperCell',
                  edges(r, cell.c, cs, rs),
                  `ax-${cell.align ?? 'start'}`,
                  `ay-${cell.valign ?? 'middle'}`,
                  `t-${cell.typo ?? 'body'}`,
                  `ink-${cell.ink ?? 'primary'}`,
                  cell.fill && cell.fill !== 'none' ? `fill-${cell.fill}` : '',
                  `flow-${cell.flow ?? 'wrap'}`,
                  cell.writing === 'vertical' ? 'wr-vertical' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div
                    key={`c${i}`}
                    className={cls}
                    style={{ gridArea: `${r + 1} / ${cell.c + 1} / span ${rs} / span ${cs}` }}
                  >
                    <span>{cell.image ? '' : text}</span>
                  </div>
                );
              })}
              {fillers.map((f, i) => (
                <div
                  key={`f${i}`}
                  className={`erpPaperCell ${edges(f.r, f.c, 1, 1)}`}
                  style={{ gridArea: `${f.r + 1} / ${f.c + 1} / span 1 / span 1` }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
