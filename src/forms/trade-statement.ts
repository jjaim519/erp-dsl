// 거래명세서 — 표준 서식(① 라인 문서). 부품이 아니라 *데이터*다(헌법 1).
//  24열 격자. 넓히는 수단은 병합뿐이고 열 너비라는 개념이 없다.
//  이 파일은 "모델이 실물을 담는가"의 증거다 — 손으로 적어 validatePaper를 통과시킨다.
import type { PaperSpec, PaperEdge } from '../schema/paper';

const ALL: PaperEdge[] = ['t', 'r', 'b', 'l'];

export const tradeStatement: PaperSpec = {
  id: 'trade-statement',
  name: '거래명세서',
  columns: 24,
  orientation: 'portrait',

  // 문서 스코프 값 — 소비처가 채워 넘긴다.
  fields: [
    { name: 'docNo',       label: '문서번호',            type: 'text', required: true },
    { name: 'issueDate',   label: '작성일자',            type: 'date', required: true },
    { name: 'supplierNo',  label: '공급자 등록번호',      type: 'text', required: true,
      pattern: '^\\d{3}-\\d{2}-\\d{5}$' },
    { name: 'supplier',    label: '공급자 상호',          type: 'text', required: true },
    { name: 'supplierCeo', label: '공급자 대표자',        type: 'text' },
    { name: 'buyerNo',     label: '공급받는 자 등록번호',  type: 'text', required: true,
      pattern: '^\\d{3}-\\d{2}-\\d{5}$' },
    { name: 'buyer',       label: '공급받는 자 상호',      type: 'text', required: true },
    { name: 'buyerCeo',    label: '공급받는 자 대표자',    type: 'text' },
    { name: 'note',        label: '비고',                type: 'textarea' },
    { name: 'receiver',    label: '인수자',              type: 'text' },
    { name: 'receivedAt',  label: '인수일자',            type: 'date' },
  ],

  // 반복 원본 — 폼(FormSection)은 배열을 안 다루므로 FieldSpec을 오염시키지 않고 여기 둔다.
  arrays: [
    { name: 'lines', label: '품목', of: [
      { name: 'no',       label: '번호',   type: 'number' },
      { name: 'name',     label: '품명',   type: 'text', required: true },
      { name: 'spec',     label: '규격',   type: 'text' },
      { name: 'qty',      label: '수량',   type: 'number' },
      { name: 'price',    label: '단가',   type: 'currency' },
      { name: 'amount',   label: '공급가액', type: 'currency' },
      { name: 'vat',      label: '세액',   type: 'currency' },
      { name: 'category', label: '분류',   type: 'text' },
    ] },
  ],

  // 1단위(24px)가 아닌 행만 적는다.
  rows: [
    { r: 0,  h: 2 },   // 제목
    { r: 11, h: 3 },   // 비고 — 내용이 없어도 물리 크기가 필요한 칸
  ],

  // 행 범위 이름표. 앞서 "블록·밴드"라 부르던 것이 전부 여기로 수렴한다.
  bands: [
    { kind: 'columnHeader', r1: 5,  r2: 5,  reprint: true },
    { kind: 'groupHeader',  r1: 6,  r2: 6,  by: 'lines.category', reprint: true },
    { kind: 'repeat',       r1: 7,  r2: 7,  source: 'lines' },
    { kind: 'groupFooter',  r1: 8,  r2: 8,  by: 'lines.category' },
    { kind: 'summary',      r1: 9,  r2: 10 },
    { kind: 'pageFooter',   r1: 13, r2: 13 },
  ],

  // sparse — 채워진 칸만. 빈칸은 렌더러가 격자를 채워 만든다.
  cells: [
    // r0 — 제목. 테두리 없음(격자는 정렬 골격일 뿐이다)
    { r: 0, c: 0, cs: 24, text: '거 래 명 세 서', align: 'center', typo: 'display' },

    // r1~r3 — 좌: 공급자 / 우: 공급받는 자. 세로 라벨은 CSS writing-mode로 진짜 세로쓰기
    { r: 1, c: 0,  cs: 1, rs: 3, text: '공급자',     align: 'center', writing: 'vertical', fill: 'shade', border: ALL },
    { r: 1, c: 1,  cs: 3, text: '등록번호', fill: 'shade', border: ALL },
    { r: 1, c: 4,  cs: 8, field: 'supplierNo', border: ALL },
    { r: 1, c: 12, cs: 1, rs: 3, text: '공급받는 자', align: 'center', writing: 'vertical', fill: 'shade', border: ALL },
    { r: 1, c: 13, cs: 3, text: '등록번호', fill: 'shade', border: ALL },
    { r: 1, c: 16, cs: 8, field: 'buyerNo', border: ALL },

    { r: 2, c: 1,  cs: 3, text: '상호', fill: 'shade', border: ALL },
    { r: 2, c: 4,  cs: 8, field: 'supplier', border: ALL },
    { r: 2, c: 13, cs: 3, text: '상호', fill: 'shade', border: ALL },
    { r: 2, c: 16, cs: 8, field: 'buyer', border: ALL },

    { r: 3, c: 1,  cs: 3, text: '대표자', fill: 'shade', border: ALL },
    { r: 3, c: 4,  cs: 8, field: 'supplierCeo', border: ALL },
    { r: 3, c: 13, cs: 3, text: '대표자', fill: 'shade', border: ALL },
    { r: 3, c: 16, cs: 8, field: 'buyerCeo', border: ALL },

    // r4 — 작성일자 · 문서번호
    { r: 4, c: 0,  cs: 3, text: '작성일자', fill: 'shade', border: ALL },
    { r: 4, c: 3,  cs: 9, field: 'issueDate', format: 'date', border: ALL },
    { r: 4, c: 12, cs: 3, text: '문서번호', fill: 'shade', border: ALL },
    { r: 4, c: 15, cs: 9, field: 'docNo', border: ALL },

    // r5 — 열 머리. 쪽을 넘기면 다시 그려진다(reprint)
    { r: 5, c: 0,  cs: 2, text: 'No.',    align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 5, c: 2,  cs: 7, text: '품　명',  align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 5, c: 9,  cs: 5, text: '규　격',  align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 5, c: 14, cs: 2, text: '수량',    align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 5, c: 16, cs: 3, text: '단　가',  align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 5, c: 19, cs: 3, text: '공급가액', align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 5, c: 22, cs: 2, text: '세액',    align: 'center', fill: 'shade', typo: 'body-strong', border: ALL },

    // r6 — 그룹 머리(분류 밴드). 묶음이 바뀔 때 한 번
    { r: 6, c: 0, cs: 24, field: 'lines.category', fill: 'shade', typo: 'body-strong', border: ALL },

    // r7 — 반복(detail). 값이 오면 이 한 행이 배열 길이만큼 늘어난다
    { r: 7, c: 0,  cs: 2, field: 'lines.no',     align: 'center', format: 'number',   border: ALL },
    { r: 7, c: 2,  cs: 7, field: 'lines.name',   border: ALL },
    { r: 7, c: 9,  cs: 5, field: 'lines.spec',   border: ALL },
    { r: 7, c: 14, cs: 2, field: 'lines.qty',    align: 'center', format: 'number',   border: ALL },
    { r: 7, c: 16, cs: 3, field: 'lines.price',  align: 'end',    format: 'currency', border: ALL },
    { r: 7, c: 19, cs: 3, field: 'lines.amount', align: 'end',    format: 'currency', border: ALL },
    { r: 7, c: 22, cs: 2, field: 'lines.vat',    align: 'end',    format: 'currency', border: ALL },

    // r8 — 그룹 꼬리(소계). 집계는 서식이 선언하고 렌더러가 계산한다
    { r: 8, c: 0,  cs: 19, text: '소　계', align: 'end', fill: 'shade', border: ALL },
    { r: 8, c: 19, cs: 3,  agg: { fn: 'sum', of: 'lines.amount' }, align: 'end', format: 'currency', border: ALL },
    { r: 8, c: 22, cs: 2,  agg: { fn: 'sum', of: 'lines.vat' },    align: 'end', format: 'currency', border: ALL },

    // r9~r10 — 총계. 마지막 쪽에만 나온다
    { r: 9,  c: 0,  cs: 19, text: '합　계', align: 'end', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 9,  c: 19, cs: 3,  agg: { fn: 'sum', of: 'lines.amount' }, align: 'end', format: 'currency', border: ALL },
    { r: 9,  c: 22, cs: 2,  agg: { fn: 'sum', of: 'lines.vat' },    align: 'end', format: 'currency', border: ALL },
    { r: 10, c: 0,  cs: 19, text: '총　계 (공급가액 + 세액)', align: 'end', fill: 'shade', typo: 'body-strong', border: ALL },
    { r: 10, c: 19, cs: 5,  agg: { fn: 'sum', of: ['lines.amount', 'lines.vat'] },
      align: 'end', format: 'currency', typo: 'body-strong', border: ALL },

    // r11 — 비고. 3단위 높이 + 위 정렬(빈칸이어도 물리 크기를 갖는다)
    { r: 11, c: 0, cs: 3,  text: '비　고', fill: 'shade', valign: 'top', border: ALL },
    { r: 11, c: 3, cs: 21, field: 'note', valign: 'top', flow: 'wrap', border: ALL },

    // r12 — 인수 확인
    { r: 12, c: 0,  cs: 3, text: '인수자',   fill: 'shade', border: ALL },
    { r: 12, c: 3,  cs: 9, field: 'receiver', border: ALL },
    { r: 12, c: 12, cs: 3, text: '인수일자', fill: 'shade', border: ALL },
    { r: 12, c: 15, cs: 9, field: 'receivedAt', format: 'date', border: ALL },

    // r13 — 매 쪽 꼬리말. 쪽 번호는 분배가 끝나야 알 수 있어 시스템 값으로 받는다
    { r: 13, c: 0,  cs: 18, text: '본 명세서는 전자적으로 발행되었습니다.',
      typo: 'caption', ink: 'secondary', border: ['t'] },
    { r: 13, c: 18, cs: 6,  field: '@page', align: 'end', typo: 'caption', ink: 'secondary', border: ['t'] },
  ],
};
