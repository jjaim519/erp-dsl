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
  PAPER_CANON, PAPER_MARGIN, rowUnitOf,
  type PaperSpec, type PaperCell,
} from '../schema/paper';
import type { FieldSpec } from '../schema/fields';
import { layoutPaper, paperRead, paperWrite, type OutRow } from './paperLayout';
import { TextInput } from './TextInput';
import { NumberInput } from './NumberInput';
import { CurrencyInput } from './CurrencyInput';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { DatePicker } from './DatePicker';
import { Checkbox } from './Checkbox';

type Props = {
  spec: PaperSpec;
  values?: Record<string, unknown>;
  /** 화면 축소 배율(1 = 원본 794px). 인쇄는 항상 물리 A4 1:1. */
  scale?: number;
  /**
   * `edit`이면 데이터 자리가 입력칸이 된다. **문서 기하는 그대로다** — 칸이 곧 입력의 크기고,
   * 입력은 자기 크롬을 벗는다(칸이 이미 테두리를 그리므로 이중이 안 되게).
   */
  mode?: 'view' | 'edit';
  /** `edit` 전용 — 바뀐 **값 전체**를 준다. 소비처는 setState 하나로 받는다. */
  onChange?: (next: Record<string, unknown>) => void;
  /**
   * `edit` 전용 — 데이터에서 끌어오는 값(시공팀·시공일…). 보이되 못 고친다.
   * **서식이 아니라 소비처가 정한다** — 어느 값이 어디서 오는지는 소비처만 알기 때문에
   * 스키마(엑셀)에 「출처」를 적게 하지 않았다. 반복 안 필드는 `"부속.개수"`처럼 점 경로로 적는다.
   */
  readonlyFields?: string[];
};

type Placed = { cell: PaperCell; text: string; at?: number; depth?: number; r: number };

// 한 장 = [머리말 … 본문 … 여백 … 꼬리말]. 여백이 꼬리말을 바닥으로 민다.
function assemble(page: { header: OutRow[]; body: OutRow[]; footer: OutRow[]; pad: number }) {
  const rows: OutRow[] = [];
  const placed: Placed[] = [];
  const push = (list: OutRow[]) => {
    list.forEach((row) => {
      row.cells.forEach((c) => placed.push({ cell: c.spec, text: c.text, at: c.at, depth: c.depth, r: rows.length }));
      rows.push(row);
    });
  };
  push(page.header);
  push(page.body);
  for (let i = 0; i < page.pad; i++) rows.push({ h: 1, cells: [] });
  push(page.footer);
  return { rows, placed };
}

// 문서 자리 → 입력 부품. **컨트롤을 손으로 만들지 않는다** — 부품이 나르는 동작·키보드·낭독이
//  전부 거기 있다. 문서가 정하는 건 «어디에 놓느냐»뿐이고, 종류는 「필드」 시트가 말한 타입에서 온다.
function CellInput({ field, value, onChange }: {
  field: FieldSpec; value: unknown; onChange: (v: unknown) => void;
}) {
  const str = value == null ? '' : String(value);
  switch (field.type) {
    case 'number':   return <NumberInput size="sm" value={value as number ?? ''} onChange={onChange} placeholder={field.placeholder} />;
    case 'currency': return <CurrencyInput size="sm" value={value as number ?? ''} onChange={onChange} placeholder={field.placeholder} />;
    case 'textarea': return <Textarea size="sm" value={str} onChange={onChange} placeholder={field.placeholder} />;
    case 'select':   return <Select size="sm" options={field.options ?? []} value={str || null} onChange={onChange} placeholder={field.placeholder} />;
    case 'date':     return <DatePicker size="sm" value={str || null} onChange={onChange} placeholder={field.placeholder} />;
    case 'checkbox': return <Checkbox checked={!!value} onChange={onChange} />;
    // lookup은 조회 배선이 소비처에 있다 — 문서 안에서는 글자 입력으로 둔다.
    default:         return <TextInput size="sm" value={str} onChange={onChange} placeholder={field.placeholder} />;
  }
}

export function PaperDoc({
  spec, values = {}, scale = 1, mode = 'view', onChange, readonlyFields,
}: Props) {
  const pages = useMemo(() => layoutPaper(spec, values), [spec, values]);
  const canon = PAPER_CANON[spec.orientation];
  const rowUnit = rowUnitOf(spec);   // 쪽당 행 수에서 도출 — 글자 크기도 여기서 딸려온다

  // 필드 이름 → 명세. 문서 스코프와 반복 안(점 경로)을 한 지도에 담는다.
  const fieldOf = useMemo(() => {
    const m = new Map<string, FieldSpec>();
    spec.fields.forEach((f) => m.set(f.name, f));
    (spec.arrays ?? []).forEach((a) => a.of.forEach((f) => m.set(`${a.name}.${f.name}`, f)));
    return m;
  }, [spec]);
  const locked = useMemo(() => new Set(readonlyFields ?? []), [readonlyFields]);

  // 고칠 수 있는 칸 — 데이터 자리이면서 ① 시스템 값(@쪽)이 아니고 ② 소비처가 안 잠갔고
  //  ③ 「필드」 시트가 아는 이름이다. 집계·이어붙이기·고정 글자는 애초에 «값»이 아니라 대상이 아니다.
  //
  // ④ **반복 안 필드는 «몇 번째 항목인가»를 알 때만 고칠 수 있다.** 그룹 머리·꼬리의 `품목.분류`는
  //    한 항목이 아니라 *묶음 전체*를 대표해 찍힌 값이라 되쓸 자리가 없다 — 입력으로 바꾸면
  //    분류 이름이 빈칸으로 사라진다(실제로 그랬다). 걸침 칸(`scope: 'group'`)도 같은 이유로 제외되는데,
  //    거기다 그건 *묶는 기준*이라 고치는 순간 표가 통째로 재편된다.
  const editableAt = (cell: PaperCell, at?: number): FieldSpec | undefined => {
    if (mode !== 'edit' || !onChange) return undefined;
    if (!cell.field || cell.field.startsWith('@')) return undefined;
    if (cell.scope === 'group' || locked.has(cell.field)) return undefined;
    if (cell.field.includes('.') && at == null) return undefined;
    return fieldOf.get(cell.field);
  };

  /**
   * 이미지 자리(로고·도장·도면)의 값. **문서 스코프다** — 반복 안 이미지는 아직 없다.
   *
   * 값이 없으면 **빈 칸으로 둔다.** 로고 없는 발행처가 있고, 그때 자리만 비는 게 맞다 —
   * 대체 글자를 넣으면 종이에 「발행처로고」라는 글자가 인쇄된다.
   *
   * ⚠ 그리는 건 `<img>`이지 배경 이미지가 아니다. 배경으로 두면 브라우저의
   *   **「배경 그래픽 끄기」에 걸려 인쇄물에서 로고가 통째로 사라진다**(기본값이 꺼짐인 브라우저도 있다).
   */
  const imageSrc = (name: string): string | undefined => {
    const v = values[name];
    return typeof v === 'string' && v ? v : undefined;
  };

  // 「보이되 못 고친다」를 **소비처가 잠근 것에만** 표시한다 — 편집 가능함은 쉼 상태를 안 건드리고
  //  대비로 드러내는 게 표 계열의 관습이라(paper.css 주석), 죽일 대상을 정확히 골라야 한다.
  //  고정 글자·라벨은 «잠긴 값»이 아니라 애초에 값이 아니므로 제외한다.
  const isLocked = (cell: PaperCell) =>
    mode === 'edit' && !!cell.field && locked.has(cell.field);

  // 인쇄 @page — 방향별 A4 + margin 0. **margin 0이 브라우저 기본 머리말·꼬리말(URL·날짜·쪽번호)을 없앤다.**
  //  여백은 종이 안쪽(PAPER_MARGIN)이 이미 갖고 있으므로 페이지 여백은 0이어야 1:1이 된다.
  //  방향이 닫힌 enum이라 주입 문자열에 임의값이 안 들어간다(PaperModal 선례).
  const pageRule = `@media print{@page{size:A4 ${spec.orientation};margin:0}`
    + `.erpPaperSheet{width:${spec.orientation === 'landscape' ? '297mm' : '210mm'} !important;`
    + `height:${spec.orientation === 'landscape' ? '210mm' : '297mm'} !important}}`;

  return (
    <div className="erpPaperDoc" data-mode={mode}>
      <style>{pageRule}</style>
      {pages.map((page, pi) => {
        const { rows, placed } = assemble(page);
        const total = rows.length;

        // ── 선 지도 — 셀이 "그리겠다"고 선언한 변을 격자선 좌표에 등록한다.
        //  값은 굵기(1=얇음, 2=굵음). 같은 선을 양쪽 칸이 서로 다르게 선언하면 **굵은 쪽이 이긴다**
        //  (표 바깥은 굵고 안쪽은 얇은 장표 관습에서, 경계선은 굵어야 맞기 때문).
        const h = new Map<string, number>();   // 가로선: 행 r 위, 열 c
        const v = new Map<string, number>();   // 세로선: 열 c 왼쪽, 행 r
        const put = (m: Map<string, number>, k: string, w: number) => m.set(k, Math.max(m.get(k) ?? 0, w));
        placed.forEach(({ cell, r }) => {
          const cs = cell.cs ?? 1;
          const rs = cell.rs ?? 1;
          const mark = (edges: PaperCell['border'], w: number) => (edges ?? []).forEach((e) => {
            if (e === 't') for (let c = cell.c; c < cell.c + cs; c++) put(h, `${r}:${c}`, w);
            if (e === 'b') for (let c = cell.c; c < cell.c + cs; c++) put(h, `${r + rs}:${c}`, w);
            if (e === 'l') for (let y = r; y < r + rs; y++) put(v, `${y}:${cell.c}`, w);
            if (e === 'r') for (let y = r; y < r + rs; y++) put(v, `${y}:${cell.c + cs}`, w);
          });
          mark(cell.border, 1);
          mark(cell.borderStrong, 2);
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

        const cls1 = (side: string, w?: number) => (w ? `b${side}${w === 2 ? ' b' + side + '-s' : ''}` : '');
        const edges = (r: number, c: number, cs: number, rs: number) => [
          cls1('t', h.get(`${r}:${c}`)),
          cls1('l', v.get(`${r}:${c}`)),
          c + cs === spec.columns ? cls1('r', v.get(`${r}:${spec.columns}`)) : '',
          r + rs === total ? cls1('b', h.get(`${total}:${c}`)) : '',
        ].filter(Boolean).join(' ');

        return (
          <div
            key={pi}
            className="erpPaperSheet"
            style={{
              width: canon.w, height: canon.h,
              ['--paper-row' as string]: `${rowUnit}px`,
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
                gridTemplateRows: rows.map((r) => `${r.h * rowUnit}px`).join(' '),
              }}
            >
              {placed.map(({ cell, text, at, depth, r }, i) => {
                const cs = cell.cs ?? 1;
                const rs = cell.rs ?? 1;
                const field = editableAt(cell, at);
                // 서식이 색을 **직접** 말한 칸(엑셀에서 온 헥스). 토큰이 아니라 종이 절대색이라
                //  클래스가 아니라 인라인으로 간다 — `fill-#D9D9D9`는 클래스 이름이 될 수 없다.
                const fillHex = cell.fill?.startsWith('#') ? cell.fill : undefined;
                const cls = [
                  'erpPaperCell',
                  edges(r, cell.c, cs, rs),
                  `ax-${cell.align ?? 'start'}`,
                  `ay-${cell.valign ?? 'middle'}`,
                  `t-${cell.typo ?? 'body'}`,
                  `ink-${cell.ink ?? 'primary'}`,
                  fillHex ? 'fill-raw' : (cell.fill && cell.fill !== 'none' ? `fill-${cell.fill}` : ''),
                  `flow-${cell.flow ?? 'wrap'}`,
                  cell.writing === 'vertical' ? 'wr-vertical' : '',
                  depth ? 'is-indent' : '',
                  field ? 'is-edit' : '',
                  isLocked(cell) ? 'is-locked' : '',
                ].filter(Boolean).join(' ');
                return (
                  <div
                    key={`c${i}`}
                    className={cls}
                    style={{
                      gridArea: `${r + 1} / ${cell.c + 1} / span ${rs} / span ${cs}`,
                      ...(fillHex ? { background: fillHex } : {}),
                      // 깊이는 «수»만 넘긴다 — 한 계단이 몇 px인지는 paper.css가 정한다(서식이 못 정한다).
                      ...(depth ? { ['--paper-depth' as string]: depth } : {}),
                    }}
                  >
                    {field ? (
                      <CellInput
                        field={field}
                        value={paperRead(values, cell.field!, at)}
                        onChange={(v) => onChange!(paperWrite(values, cell.field!, at, v))}
                      />
                    ) : cell.image ? (
                      imageSrc(cell.image) && (
                        <img className="erpPaperImage" src={imageSrc(cell.image)} alt={cell.image} />
                      )
                    ) : (
                      <span>{text}</span>
                    )}
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
