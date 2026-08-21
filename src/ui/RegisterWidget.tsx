'use client';
// RegisterWidget (유기체) — **원장**. 이월 → 부호 있는 증감 → 행마다 누계 → 기말.
//  재무 원장(통장내역·계정별원장)과 재고 수불부는 **같은 골격**이다: 열 이름과 단위만 갈린다
//  (출금/입금/잔액 ↔ 출고/입고/현재고). 그래서 부품 하나에 `labels`·`unit`만 연다.
//
// ── DataSheet와 형제인 이유(§11-3) ────────────────────────────────────────────
//  겹쳐 보이지만 정체성이 다르다. **DataSheet는 저장된 행을 고칠 수 있고, 원장은 못 고친다** —
//  전기(轉記)된 기록은 수정이 아니라 반대 전표로 정정한다(Dynamics BC의 ledger entries가 읽기 전용인 이유).
//  그래서 여기엔 행 편집 기제가 통째로 없다. 대신 DataSheet엔 없는 세 축이 있다:
//   ① 누계(잔액) — 행이 정렬 순서에 묶인다. DataSheet의 자유 정렬과 양립 못 한다.
//   ② 이월/기말 — 기간 경계. ③ 대사(reconciliation) — 통장 화면의 절반.
//
// ── 불변식은 부품이 지킨다 ────────────────────────────────────────────────────
//  `balance`를 안 주면 **이월 + Σ(입−출)**로 누계를 부품이 만든다(그게 이 부품의 존재 이유다).
//  주면 그 값을 쓴다 — 서버가 계산한 잔액이 있는 경우.
//
// ── 노출은 데이터·콜백 유무가 정한다(토글 prop 아님) ──────────────────────────
//  입력행=onAdd · 이월행=carryOver · 기말=closing · 증빙열=evidence · ✓열=entry.reconciled · 뱃지=reconciledThrough ·
//  기간네비=period+onPeriodChange · 계좌셀렉트=accounts 2개 이상 · 전표열=entry.ref · 알약=kind.
//
// ── 스코프 존은 위젯이 하나뿐인 페이지에서만 ─────────────────────────────────
//  `actions`와 **같은 규율, 더 강하게**. 액션은 표 하나를 건드리지만 스코프(계좌·기간)는
//  페이지 전체의 숫자를 바꾼다 — KPI 카드와 원장이 같은 스코프를 공유하는 화면에서 스코프를
//  원장 안에 넣었더니 "기준이 아래 표 안에 들어 있는" 화면이 나왔다(kk 통장내역).
//  위젯이 둘 이상이면 `accounts`·`period`·`closing`을 **주지 않고** 페이지가 그린다
//  (기말잔액은 KPI 한 칸으로). 안 주면 스코프 존 자체가 없다.
//
// ── 한 거래 = 한 줄 ──────────────────────────────────────────────────────────
//  처음엔 QuickBooks처럼 2단 행(날짜/전표, 적요/계정)으로 그렸다가 걷어냈다. 행 높이가 들쭉날쭉해지면
//  옆 칸의 알약·글리프·버튼이 세로로 안 맞고, 그걸 맞추려 vertical-align을 손대기 시작하면 끝이 없다.
//  **열로 올릴 것은 열로**(전표) · **보조는 같은 줄에 흐린 글자로**(계정).
//  아무것도 안 주면 "날짜·적요·증감·잔액" 네 열짜리 최소 원장이 나온다 — 그게 기준선이다.
//
//  ── 카탈로그에서 옮겨온 설명(2026-08-21) ─────────────────────────────────────────
//   `_catalog`의 props 배열에 **산문이 prop인 척** 들어가 있었다 — 박물관이 배지 달린 prop처럼
//   그려서 「고를 수 있는 선택지」와 「왜 그런가」가 한 줄에 섞였다. 근거는 여기가 받는다.
//   · 스코프 존은 위젯이 하나뿐인 페이지에서만
//     `actions`와 같은 규율, 더 강하게. 액션은 표 하나를 건드리지만 스코프(계좌·기간)는 페이지 전체의 숫자를 바꾼다 — KPI 카드와 원장이 같은 스코프를 공유하는 화면에서
//     스코프를 원장 안에 넣었더니 "기준이 아래 표 안에 들어 있는" 화면이 나왔다(kk 통장내역, 오너 표현 "배치가 괴상하다"). 위젯이 둘 이상이면
//     `accounts`·`period`·`closing`을 안 주고 페이지가 그린다(기말잔액은 KPI 한 칸으로). 새 prop이 필요 없다 — A층이 이미 그 일을 한다
//   · 입력행 확정은 글자다
//     「기록」/「취소」 텍스트 버튼(`onAdd.submitLabel`). Enter만 열어 뒀더니 확정 통로가 발견되지 않았고, ✓ 아이콘을 붙였더니 "체크가 저장이라고 안 읽힌다", 배경을
//     갈랐더니 액션 없는 줄이 빈 구멍으로 보였다(kk 실사용자 3연속 검증). 손타기 전엔 자리만 있고 버튼이 없다. 잔액 칸도 「자동」이 아니라 현재 기말잔액을 회색으로 깔아 둔다 —
//     「자동」은 동작을 말하지 값을 말하지 않는다("자동이 뭔데"). 금액을 치면 그 자리에서 줄어들어 "이 칸은 결과다"가 설명 없이 전달된다
//   · A층 — 데이터·콜백 유무
//     입력행=`onAdd` · 이월행=`carryOver`(안 주면 행 없음. ⚠ 누계 시작점이기도 해서 없으면 0부터 쌓인다 = 잔액 열이 *실제 잔액*이 아니라 기간 내 누계. 이월 없이
//     실제 잔액을 그리려면 각 행에 `balance`를 직접 준다) · 기말잔액=`closing`(value 없으면 누계에서 파생. `accounts`도 `closing`도 없으면 헤더 띠
//     자체를 안 그린다 — 모달처럼 제목이 따로 있고 이력이 짧은 자리에서는 같은 수가 네 번 나온다: 모달 제목·목록 행·이 헤더·표 마지막 행) · ✓열=entry.reconciled가 한
//     줄이라도 있으면 · ✓클릭=`onReconcile` · 대사뱃지=`reconciledThrough` · 기간네비=`period`+`onPeriodChange` ·
//     계좌셀렉트=`accounts` 2개 이상(1개면 텍스트) · 두 줄 행=ref/sublabel/kindSub · 구분알약=entry.kind
//   · B층 — actions
//     표 툴바 우측. 위젯이 둘 이상인 페이지에서만 쓴다 — Fiori가 표 툴바에 액션을 두는 건 한 페이지에 표가 여럿일 때 "어느 표의 액션인가"를 가려야 해서다. 위젯 하나짜리 페이지면
//     그 구분이 사용자에게 안 보이고 액션 존만 40px 간격으로 두 개 쌓인다(화면에서 확인) → `PageHeader`로 보낸다. 안 주면 툴바 존 자체가 없다 — 건수만으로는 행을 만들지
//     않는다
import { useState } from 'react';
import { HEAD_CELL, renderAction, type Action, type BadgeColor } from './_cells';
import { Money } from './Money';
import { Badge } from './Badge';
import { Text } from './Text';
import { Icon } from './Icon';
import { Select } from './Select';
import { TextInput } from './TextInput';
import { DatePicker } from './DatePicker';
import { CurrencyInput } from './CurrencyInput';
import { NumberInput } from './NumberInput';
import { PeriodNavigator } from './PeriodNavigator';
import { EmptyState } from './EmptyState';
import { Button } from './Button';
import { Skeleton } from './Skeleton';
import type { Attachment } from './_attachment';
import type { IconName } from './Icon';
import './register.css';

/** 원장 한 줄. `out`/`in`은 **부호 없는 크기**다 — 방향은 어느 열에 담기느냐가 말한다. */
export type RegisterEntry = {
  id: string;
  date: string;                                   // 표시용 문자열(포맷은 소비처 — DATE_FORMAT 권장)
  label: string;                                  // 거래처·적요
  /** 계정·로트 등. **같은 줄에** 흐린 글자로 붙는다(둘째 줄로 안 내린다 — 행 높이가 흔들린다). */
  sublabel?: string;
  /** 전표번호. 있으면 **전표 열**이 열린다(날짜 칸 아래로 안 내린다). */
  ref?: string;
  kind?: { label: string; tone?: BadgeColor };    // 구분 알약(매출·매입·입고…)
  out?: number;                                   // 출금/출고
  in?: number;                                    // 입금/입고
  /** 없으면 부품이 누계를 만든다(이월 + Σ). 주면 그 값을 그린다. */
  balance?: number;
  /** 자유 텍스트 한 칸. 있으면 **비고 열**이 열린다 — 국내 거래내역서의 기재내용·전표의 비고란.
   *  `sublabel`(적요 옆 흐린 글자)과 다르다: 저건 적요의 부속이고 이건 독립 열이라 정렬·편집 대상이 된다. */
  memo?: string;
  /** 이 필드를 **한 줄이라도 가지면** ✓ 열이 열린다. 대사 개념이 없는 원장은 안 주면 된다. */
  reconciled?: boolean;
};

export type RegisterAccount = { label: string; value: string };

/** 증빙(세금계산서·입금증) — **행 하나 = 거래 한 건 = 증빙 한 묶음**.
 *  v1 목업엔 있다가 QuickBooks 열 순서를 따라가며 빠졌었다. 국내 원장에서 증빙은 선택 열이 아니다.
 *  뷰어는 여기 없다 — `onOpen`으로 신호만 보내고 무엇을 띄울지는 페이지가 정한다(Calendar 선례).
 *  파일 자체도 부품이 안 든다: 고르는 일은 `onAttach`가 소비처로 넘긴다(controlled 원칙). */
export type RegisterEvidence = {
  /** 그 행에 붙은 증빙. 개수만 그린다(0이면 조용한 칸 — DataSheet expand 선례). */
  of: (e: RegisterEntry) => Attachment[] | undefined;
  onOpen?: (entryId: string, items: Attachment[]) => void;
  /** 붙이기. 입력행에서는 `entryId`가 null이다(아직 행이 없다). */
  onAttach?: (entryId: string | null) => void;
  /** 입력행에 지금 붙어 있는 개수 — 값의 주인은 소비처. */
  draftCount?: number;
  /** 입력행에 **무엇이** 붙었는지(파일명 등). 개수만으로는 고른 걸 확인할 수 없다. */
  draftLabel?: string;
  /** 입력행 증빙 무르기. 없으면 ✕가 안 나온다. */
  onDraftClear?: () => void;
};

/** 새 줄 입력(표 **맨 위**). QuickBooks가 위에 두는 이유가 화면에서 드러난다 —
 *  누계는 아래로 흐르니까 입력행이 밑에 있으면 새 줄이 누계의 *끝*처럼 읽힌다. */
export type RegisterAdd = {
  kinds?: { label: string; value: string }[];
  labelPlaceholder?: string;
  /** 주면 입력행에 **비고 칸**이 열린다(비고 열도 함께). */
  memoPlaceholder?: string;
  /** 실패하면 { error } — 값은 남고 줄 아래에 오류가 붙는다(DataSheet 커밋 계약과 동형). */
  onSubmit: (v: { date: string | null; kind: string | null; label: string; out: number | null; in: number | null; memo: string })
    => Promise<{ error?: string } | void>;
  /** 확정 버튼 라벨(기본 '기록'). **텍스트 버튼이다** — ✓ 아이콘은 "저장"으로 안 읽혔다(kk 실사용자). */
  submitLabel?: string;
};

type Props = {
  entries: RegisterEntry[];

  // ── A층: 데이터·콜백 유무가 노출을 정한다 ──
  /** 이월행. 안 주면 **행 자체가 없다**(A층).
   *  ⚠ 다만 누계의 시작점이기도 하다 — 안 주면 0부터 쌓이므로 잔액 열이 *실제 잔액*이 아니라
   *  **기간 내 누계**가 된다. 이월 없이 실제 잔액을 그리려면 각 행에 `balance`를 직접 준다. */
  carryOver?: { label?: string; balance: number };
  /** 헤더 우상단 기말잔액. `value` 없으면 마지막 누계에서 파생한다. */
  closing?: { label?: string; value?: number; caption?: string };
  accounts?: RegisterAccount[];
  accountValue?: string;
  onAccountChange?: (v: string) => void;
  period?: string;
  onPeriodChange?: (dir: -1 | 1) => void;
  /** "○월 ○일까지 대사됨". **푸터의 대사 줄**에 붙는다(헤더 배지 아님 — QuickBooks도 작은 회색 글자다). */
  reconciledThrough?: string;
  /** 주면 ✓ 칸이 눌린다(controlled — 값 갱신은 소비처). */
  onReconcile?: (id: string, next: boolean) => void;
  onAdd?: RegisterAdd;
  /** 주면 증빙 열이 열린다. */
  evidence?: RegisterEvidence;

  // ── B층: 배열 길이 ──
  /** 표 툴바 우측 — **위젯이 둘 이상인 페이지에서만** 쓴다.
   *  Fiori가 표 툴바에 액션을 두는 건 한 페이지에 표가 여럿일 때 "어느 표의 액션인가"를 가려야 해서다.
   *  위젯 하나짜리 페이지면 그 구분이 사용자에게 안 보이고 액션 존만 두 개 쌓인다 — **`PageHeader`로 보낸다.**
   *  안 주면 툴바 존 자체가 없다(건수만으로는 행을 만들지 않는다). */
  actions?: Action[];

  // ── C층: 진짜 스위치(위 둘로 못 정하는 것만) ──
  /** 원장/수불부 어휘. 기본 = 원장. `account`는 스코프 존의 셀렉트 라벨(수불부면 '창고·품목'). */
  labels?: { out?: string; in?: string; balance?: string; account?: string };
  /** 표면(02 elevation 2축). 기본 `raised` = **페이지 위에 뜨는 위젯**.
   *  모달·서랍처럼 **이미 뜬 표면 안**에 넣을 땐 `flush` — 그림자를 겹치지 않는다
   *  ("위젯·오버레이만 그림자, 내부 요소는 flush" — 02). */
  surface?: 'raised' | 'flush';
  /** 증감 방향. 기본 `both`(출금·입금 두 열).
   *  수납 원장처럼 **한 방향만 존재하는 장부**는 `out`(감소만)·`in`(증가만) — 죽은 열과
   *  죽은 푸터 항목(청구·증액 ₩0)이 안 남는다. 푸터 기간합계도 따라간다. */
  sides?: 'both' | 'out' | 'in';
  /** 수량 단위(장·개). 주면 금액이 아니라 수량으로 그린다(₩ 없음). */
  unit?: string;
  /** 하단 기간 합계줄(출/입 총액). 파생값이라 데이터 유무로 가를 수 없어 스위치. */
  periodTotals?: boolean;

  /** 로딩 — 표만 자리표시로 바뀐다. **스코프 존·툴바는 남는다**(사라지면 "뭘 보고 있었는지"를 놓친다). */
  status?: 'loading' | 'ready';
  skeletonRows?: number;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

const num = (v: number | string): number | null => {
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && String(v) !== '' ? n : null;
};

export function RegisterWidget({
  entries, carryOver, closing, accounts, accountValue, onAccountChange,
  period, onPeriodChange, reconciledThrough, onReconcile, onAdd, evidence, actions,
  labels, unit, sides = 'both', periodTotals, surface = 'raised',
  status = 'ready', skeletonRows = 4, emptyState,
}: Props) {
  const L = {
    out: labels?.out ?? '출금', in: labels?.in ?? '입금',
    balance: labels?.balance ?? '잔액', account: labels?.account ?? '계좌',
  };
  // 표 *안*에서는 기호·단위를 뗀다 — 매 행에 ₩(또는 '장')가 붙으면 소음이고, 통화·단위는
  //  헤더의 기말잔액과 열 이름이 한 번씩만 말한다(Money 주석의 그 자리).
  const money = (v: number | null | undefined, opts?: { emphasis?: boolean; zeroDash?: boolean }) => (
    <Money value={v} symbol={false} emphasis={opts?.emphasis}
      zero={opts?.zeroDash ? 'dash' : 'number'} tone="auto" />
  );

  // 대사 열은 "한 줄이라도 reconciled를 갖는가"로 열린다 — 토글 prop이 아니다.
  // ⚠ 열림 조건은 **entries만 보면 안 된다.** 거래 0건인 달에서도 입력행은 그 칸이 필요하다 —
  //  안 그러면 그 달의 첫 줄을 칠 수가 없다(kk 실화면에서 잡힌 버그).
  const hasRecon = entries.some((e) => e.reconciled !== undefined) || reconciledThrough != null;
  const hasRef = entries.some((e) => e.ref);
  const hasKind = entries.some((e) => e.kind) || Boolean(onAdd?.kinds?.length);
  const hasMemo = entries.some((e) => e.memo != null) || Boolean(onAdd?.memoPlaceholder);

  // ── 누계: balance가 없으면 부품이 만든다(이월 + Σ). 이월이 없으면 0부터 = 기간 내 누계. ──
  let running = carryOver?.balance ?? 0;
  const rows = entries.map((e) => {
    running += (e.in ?? 0) - (e.out ?? 0);
    return { e, balance: e.balance ?? running };
  });
  const closingValue = closing?.value ?? (rows.length ? rows[rows.length - 1].balance : carryOver?.balance);
  const sumOut = entries.reduce((s, e) => s + (e.out ?? 0), 0);
  const sumIn = entries.reduce((s, e) => s + (e.in ?? 0), 0);
  const unrec = entries.filter((e) => e.reconciled === false);

  // ── 입력행 상태(부품이 드는 유일한 값 — 확정되면 소비처 entries로 편입된다) ──
  const [dDate, setDDate] = useState<string | null>(null);
  const [dKind, setDKind] = useState<string | null>(null);
  const [dLabel, setDLabel] = useState('');
  const [dOut, setDOut] = useState<number | string>('');
  const [dIn, setDIn] = useState<number | string>('');
  const [dMemo, setDMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dirty = Boolean(dLabel || dOut !== '' || dIn !== '' || dDate || dKind || dMemo || evidence?.draftCount);

  const reset = () => { setDDate(null); setDKind(null); setDLabel(''); setDOut(''); setDIn(''); setDMemo(''); setErr(null); };
  const submit = async () => {
    if (!onAdd || busy || !dirty) return;
    setBusy(true); setErr(null);
    const r = await onAdd.onSubmit({ date: dDate, kind: dKind, label: dLabel, out: num(dOut), in: num(dIn), memo: dMemo });
    setBusy(false);
    if (r && r.error) { setErr(r.error); return; }
    reset();
  };

  const sideCount = sides === 'both' ? 2 : 1;
  const colCount = 2 + (hasRef ? 1 : 0) + (hasKind ? 1 : 0) + sideCount
    + (hasMemo ? 1 : 0) + (hasRecon ? 1 : 0) + (evidence ? 1 : 0) + 1 + (onAdd ? 1 : 0);
  const AmountInput = unit ? NumberInput : CurrencyInput;

  // ── 스코프 존 — "무엇을 보고 있는가". Fiori 필터 바 규격: **라벨은 항상 입력칸 위**.
  //  계좌와 기간은 둘 다 스코프라 나란히 두고, 액션(엑셀·대사)은 아래 툴바 존으로 뺀다
  //  (Fiori: "표 툴바에 검색·필터를 두지 말 것" — 존이 다르다).
  const hasScope = Boolean((accounts && accounts.length > 0) || period || closing);
  const scope = !hasScope ? null : (
    <div className="erpRegScope">
      {accounts && accounts.length > 0 && (
        <div className="erpRegField">
          <span className="lb">{L.account}</span>
          {accounts.length > 1
            ? <Select size="sm" options={accounts} value={accountValue ?? accounts[0].value}
                onChange={(v) => v && onAccountChange?.(v)} />
            : <Text variant="body-strong">{accounts[0].label}</Text>}
        </div>
      )}
      {period && (
        <div className="erpRegField">
          <span className="lb">기간</span>
          <PeriodNavigator label={period} onPrev={() => onPeriodChange?.(-1)} onNext={() => onPeriodChange?.(1)} />
        </div>
      )}
      <div className="erpRegSpacer" />
      {closing && (
        <div className="erpRegClose">
          <Text variant="caption" color="secondary">{closing.label ?? (unit ? '현재고' : '기말잔액')}</Text>
          <div className="erpRegCloseVal">
            <Money value={closingValue} unit={unit} symbol={!unit} emphasis />
          </div>
          {closing.caption && <Text variant="caption" color="secondary">{closing.caption}</Text>}
        </div>
      )}
    </div>
  );

  // ── 툴바 존 — Fiori: 좌=건수, 우="표 전체에 영향을 주는 주요 액션". **액션이 없으면 존 자체가 없다.**
  const toolbar = actions && actions.length > 0 ? (
    <div className="erpRegBar">
      <Text variant="caption" color="secondary">{entries.length}건</Text>
      <div className="erpRegSpacer" />
      {actions.map((a, i) => renderAction(a, i, 'sm'))}
    </div>
  ) : null;

  if (status === 'loading')
    return (
      <div className={`erpReg is-${surface}`}>
        {scope}{toolbar}
        <div className="erpRegSkel">
          {Array.from({ length: skeletonRows }, (_, i) => <Skeleton key={i} variant="text" lines={1} />)}
        </div>
      </div>
    );

  if (entries.length === 0 && !onAdd && !carryOver)
    return (
      <div className={`erpReg is-${surface}`}>
        {scope}{toolbar}
        <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '거래 없음'} description={emptyState?.description} />
      </div>
    );

  return (
    <div className={`erpReg is-${surface}${onAdd ? ' has-commit' : ''}`}>
      {scope}
      {toolbar}
      <div className="erpRegScroll">
        <table className="erpRegTable">
          <thead>
            <tr>
              <th style={HEAD_CELL} className="w-date">날짜</th>
              {hasRef && <th style={HEAD_CELL} className="w-ref">전표</th>}
              {hasKind && <th style={HEAD_CELL} className="w-kind">구분</th>}
              <th style={HEAD_CELL} className="is-grow">적요</th>
              {sides !== 'in' && <th style={HEAD_CELL} className="is-num w-money">{L.out}</th>}
              {sides !== 'out' && <th style={HEAD_CELL} className="is-num w-money">{L.in}</th>}
              {hasMemo && <th style={HEAD_CELL} className="w-memo">비고</th>}
              {evidence && <th style={HEAD_CELL} className="is-mid w-evi">증빙</th>}
              {hasRecon && <th style={HEAD_CELL} className="is-mid w-rec" aria-label="대사">✓</th>}
              <th style={HEAD_CELL} className="is-num w-bal">{L.balance}</th>
              {onAdd && <th style={HEAD_CELL} className="w-commit" />}
            </tr>
          </thead>
          <tbody>
            {onAdd && (
              <>
                <tr className={`erpRegAdd${dirty ? ' is-dirty' : ''}`}>
                  <td><DatePicker size="sm" value={dDate} onChange={setDDate} placeholder="날짜" /></td>
                  {hasRef && <td />}
                  {hasKind && (
                    <td>{onAdd.kinds
                      ? <Select size="sm" options={onAdd.kinds} value={dKind} onChange={setDKind} placeholder="구분" />
                      : null}</td>
                  )}
                  <td className="is-grow">
                    <TextInput size="sm" value={dLabel} onChange={setDLabel}
                      placeholder={onAdd.labelPlaceholder ?? '거래처 · 적요'} onCommit={() => void submit()} />
                  </td>
                  {sides !== 'in' && (
                    <td className="is-num">
                      <AmountInput size="sm" value={dOut} onChange={(v) => setDOut(v as never)} placeholder="0" onCommit={() => void submit()} />
                    </td>
                  )}
                  {sides !== 'out' && (
                    <td className="is-num">
                      <AmountInput size="sm" value={dIn} onChange={(v) => setDIn(v as never)} placeholder="0" onCommit={() => void submit()} />
                    </td>
                  )}
                  {hasMemo && (
                    <td className="w-memo">
                      <TextInput size="sm" value={dMemo} onChange={setDMemo}
                        placeholder={onAdd.memoPlaceholder ?? '비고'} onCommit={() => void submit()} />
                    </td>
                  )}
                  {evidence && (
                    <td className="is-mid">
                      {/* 0건은 ＋(붙여라) · 있으면 클립+개수(붙어 있다). 흐리게만 하면 뜻이 안 바뀌고 약해지기만 한다. */}
                      <button type="button" className="erpRegEvi" onClick={() => evidence.onAttach?.(null)}
                        aria-label={evidence.draftCount ? `증빙 ${evidence.draftCount}건` : '증빙 첨부'}
                        title={evidence.draftLabel}>
                        {evidence.draftCount
                          ? <><Icon name="paperclip" size="sm" color="secondary" />{evidence.draftCount}</>
                          : <Icon name="plus" size="sm" color="secondary" />}
                      </button>
                      {evidence.draftCount && evidence.onDraftClear ? (
                        <button type="button" className="erpRegEviX" aria-label="증빙 무르기"
                          onClick={evidence.onDraftClear}><Icon name="x" size="sm" color="secondary" /></button>
                      ) : null}
                    </td>
                  )}
                  {hasRecon && <td className="is-mid"><span className="erpRegRecOpen">○</span></td>}
                  {/* 손타기 전에도 **현재 잔액**을 회색으로 깔아 둔다 — 「자동」은 동작을 말하지 값을 말하지 않는다.
                      금액을 치는 순간 그 자리에서 줄어들어 "이 칸은 결과다"가 설명 없이 전달된다. */}
                  <td className="is-num erpRegBal is-derived">
                    {money(closingValue == null ? null : closingValue + (num(dIn) ?? 0) - (num(dOut) ?? 0))}
                  </td>
                  {/* 확정은 **글자**다. ✓ 아이콘은 "저장"으로 안 읽혔고, 배경을 갈랐더니 액션 없는 줄이
                      빈 구멍으로 보였다(kk 실사용자 검증). 손타기 전엔 자리만 있고 버튼이 없다. */}
                  <td className="w-commit">
                    {dirty && (
                      <div className="erpRegCommit">
                        <Button variant="ghost" size="sm" onClick={reset}>취소</Button>
                        <Button variant="primary" size="sm" loading={busy} onClick={() => void submit()}>
                          {onAdd.submitLabel ?? '기록'}
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
                {err && (
                  <tr className="erpRegErr"><td colSpan={colCount}>
                    <span><Icon name="alert-triangle" size="sm" color="danger" /><Text variant="caption" color="danger">{err}</Text></span>
                  </td></tr>
                )}
              </>
            )}

            {carryOver && (
              <tr className="erpRegCarry">
                <td colSpan={colCount - 1}>{carryOver.label ?? '전월이월'}</td>
                <td className="is-num erpRegBal">{money(carryOver.balance)}</td>
              </tr>
            )}

            {rows.map(({ e, balance }) => (
              <tr key={e.id} className={e.reconciled === false ? 'is-unrec' : undefined}>
                <td className="w-date">{e.date}</td>
                {hasRef && <td className="w-ref">{e.ref}</td>}
                {hasKind && (
                  <td className="w-kind">
                    {e.kind && <Badge color={e.kind.tone ?? 'neutral'}>{e.kind.label}</Badge>}
                  </td>
                )}
                <td className="is-grow">
                  {e.label}
                  {e.sublabel && <span className="sub">{e.sublabel}</span>}
                </td>
                {sides !== 'in' && <td className="is-num">{money(e.out ?? 0, { emphasis: true, zeroDash: true })}</td>}
                {sides !== 'out' && <td className="is-num is-in">{money(e.in ?? 0, { emphasis: true, zeroDash: true })}</td>}
                {hasMemo && <td className="w-memo">{e.memo}</td>}
                {evidence && (() => {
                  const items = evidence.of(e) ?? [];
                  const n = items.length;
                  if (n === 0 && !evidence.onAttach) return <td className="is-mid" />;
                  return (
                    <td className="is-mid">
                      <button type="button" className="erpRegEvi"
                        aria-label={n > 0 ? `증빙 ${n}건` : '증빙 첨부'}
                        onClick={() => (n > 0 ? evidence.onOpen?.(e.id, items) : evidence.onAttach?.(e.id))}>
                        {n > 0
                          ? <><Icon name="paperclip" size="sm" color="secondary" />{n}</>
                          : <Icon name="plus" size="sm" color="secondary" />}
                      </button>
                    </td>
                  );
                })()}
                {hasRecon && (
                  <td className="is-mid">
                    {e.reconciled === undefined ? null : onReconcile ? (
                      <button type="button" className="erpRegRecBtn"
                        aria-label={e.reconciled ? '대사 해제' : '대사 표시'} aria-pressed={e.reconciled}
                        onClick={() => onReconcile(e.id, !e.reconciled)}>
                        {e.reconciled ? <Icon name="check" size="sm" /> : <span className="erpRegRecOpen">○</span>}
                      </button>
                    ) : e.reconciled ? <Icon name="check" size="sm" /> : <span className="erpRegRecOpen">○</span>}
                  </td>
                )}
                <td className="is-num erpRegBal">{money(balance)}</td>
                {onAdd && <td className="w-commit" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(periodTotals || reconciledThrough || (hasRecon && unrec.length > 0)) && (
        <div className="erpRegFoot">
          {/* 대사 얘기는 한 곳에서만 한다 — 기준선(reconciledThrough)과 미대사 집계가 같은 줄에 붙는다. */}
          <span>
            {reconciledThrough}
            {reconciledThrough && hasRecon && unrec.length > 0 && ' · '}
            {hasRecon && unrec.length > 0
              ? <>미대사 {unrec.length}건 · 순액 <Money value={unrec.reduce((s, e) => s + (e.in ?? 0) - (e.out ?? 0), 0)} unit={unit} symbol={!unit} /></>
              : null}
          </span>
          <span>{periodTotals ? (
            <>
              {sides !== 'in' && <>{L.out} <Money value={sumOut} unit={unit} symbol={!unit} /></>}
              {sides === 'both' && ' · '}
              {sides !== 'out' && <>{L.in} <Money value={sumIn} unit={unit} symbol={!unit} /></>}
            </>
          ) : null}</span>
        </div>
      )}
    </div>
  );
}

export type { Props as RegisterProps };
