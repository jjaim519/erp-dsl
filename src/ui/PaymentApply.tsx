'use client';
// PaymentApply (유기체) — **수납 적용**. 받은 돈 한 건을 미결 청구 여러 건에 배분한다.
//  NetSuite Customer Payment의 뼈대(실화면 확인): 헤더 tally = To Apply / Applied / **Unapplied**,
//  본체 = 미결 목록에 `적용액`을 치는 표, 그리고 Invoices / Credits / Deposits 세 출처.
//  "한 입금 = 한 청구"가 아니라는 게 이 부품의 존재 이유다 — 그 가정이면 그냥 폼 하나면 된다.
//
// ── 불변식은 부품이 지킨다 ────────────────────────────────────────────────────
//  ① 적용 = Σ(적용액) + Σ(조정)   ② 미적용 = 수납액 − 적용   ③ 행 적용액 ≤ 행 잔액(overApply로 열림)
//  소비처는 값만 들고, 이 셋은 부품이 계산해서 보여준다. 미적용이 눈에 안 보이면 배분이 끝났는지 알 수 없다.
//
// ── tally를 하단 바에 둔 이유 ─────────────────────────────────────────────────
//  NetSuite는 우상단 작은 박스에 둔다. 그대로 안 따랐다 — 배분은 표를 훑으며 하는 일이라
//  **작업하는 내내 보여야 하는 값**이고, 위에 있으면 스크롤로 표에 가린다. 하단 고정 = DecisionPanel 선례.
//
// ── 조정(±) 열: 실물을 의도적으로 안 따른 자리 ────────────────────────────────
//  NetSuite엔 조기결제 할인 두 열(DISC. AVAIL / DISC. TAKEN)이 있다. 국내 상거래엔 그 관행이 거의 없고
//  대신 에누리·단수조정이 실재한다 — 두 열을 부호 있는 한 열로 접었다. `onAdjust`를 안 주면 열이 없다.
import { useMemo } from 'react';
import { HEAD_CELL, renderAction, type Action, type BadgeColor } from './_cells';
import { Money } from './Money';
import { Text } from './Text';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { CurrencyInput } from './CurrencyInput';
import { EmptyState } from './EmptyState';
import type { IconName } from './Icon';
import './paymentapply.css';

/** 배분 대상 한 줄(청구·대변메모·선수금 공통). `open`이 이 줄에 남은 금액. */
export type ApplyLine = {
  id: string;
  label: string;
  sublabel?: string;
  /** 만기·발행일 등 날짜 한 칸. 없으면 그 열이 안 열린다. */
  date?: string;
  /** 연령 알약(70일 경과 / 미도래). 값 판단은 소비처 — 부품은 라벨과 톤만 받는다. */
  age?: { label: string; tone?: BadgeColor };
  /** 원금액(청구 총액). */
  gross: number;
  /** 지금 남은 금액. 적용액의 상한이다. */
  open: number;
};

/** 출처 탭. **하나면 탭을 안 그린다** — 탭 하나짜리 탭바는 크롬만 늘린다. */
export type ApplySource = {
  key: string;
  label: string;
  lines: ApplyLine[];
};

type Props = {
  sources: ApplySource[];
  activeSource?: string;
  onSourceChange?: (key: string) => void;

  /** 받은 금액(controlled). 헤더 폼은 소비처 슬롯이라 값만 받는다. */
  amount: number;
  /** 줄별 적용액 — { lineId: 금액 }. 값의 주인은 소비처. */
  applied: Record<string, number>;
  onApplyChange: (lineId: string, value: number) => void;

  // ── A층: 데이터·콜백 유무 ──
  /** 수납 정보(수납일·수단·계좌)는 소비처마다 달라 **슬롯**이다. 안 주면 표만 나온다. */
  header?: React.ReactNode;
  /** 주면 조정(±) 열이 열린다. */
  adjustments?: Record<string, number>;
  onAdjust?: (lineId: string, value: number) => void;
  /** 주면 좌측 체크박스 열이 열린다(체크 해제 = 적용액 0). 안 주면 적용액 칸만으로 배분한다. */
  onToggleLine?: (lineId: string, next: boolean) => void;

  // ── B층: 배열 길이 ──
  /** 전액 배분 / 오래된 것부터 / 해제 — **안 주면 줄 자체가 없다**. 배분 규칙은 소비처 정책이다. */
  bulkActions?: Action[];

  // ── C층: 스위치 ──
  /** 자동 배분 체크박스 노출(기본 안 보임). 켜짐 상태·동작은 소비처. */
  autoApply?: { checked: boolean; onChange: (v: boolean) => void; label?: string };
  /** 미적용 잔액 정책. warn(기본) = 경고만 — 선수금으로 남기는 건 실무에서 정상이다. */
  unapplied?: 'allow' | 'warn' | 'block';
  /** 행 잔액을 넘겨 적용하도록 허용. */
  overApply?: boolean;

  /** 하단 확정 버튼. disabled 판단(미적용 block·초과)은 부품이 얹는다. */
  submit: { label?: string; onSubmit: () => void; busy?: boolean };
  onCancel?: () => void;
  emptyState?: { icon?: IconName; title: string; description?: string };
};

export function PaymentApply({
  sources, activeSource, onSourceChange, amount, applied, onApplyChange,
  header, adjustments, onAdjust, onToggleLine, bulkActions, autoApply,
  unapplied = 'warn', overApply, submit, onCancel, emptyState,
}: Props) {
  const active = sources.find((s) => s.key === (activeSource ?? sources[0]?.key)) ?? sources[0];
  const showAdjust = Boolean(onAdjust);

  // ── 불변식 ──
  const { sumApply, sumAdjust, over } = useMemo(() => {
    let a = 0, j = 0;
    const bad: string[] = [];
    for (const s of sources) for (const l of s.lines) {
      const v = applied[l.id] ?? 0;
      a += v;
      j += adjustments?.[l.id] ?? 0;
      if (!overApply && v + (adjustments?.[l.id] ?? 0) > l.open) bad.push(l.id);
    }
    return { sumApply: a, sumAdjust: j, over: bad };
  }, [sources, applied, adjustments, overApply]);

  const appliedTotal = sumApply + sumAdjust;
  const rest = amount - appliedTotal;
  const blocked = (unapplied === 'block' && rest !== 0) || over.length > 0 || rest < 0;

  const showDate = active?.lines.some((l) => l.date || l.age);
  const colCount = 1 + (onToggleLine ? 1 : 0) + (showDate ? 1 : 0) + 2 + (showAdjust ? 1 : 0) + 1;

  const restTone = rest === 0 ? 'is-done' : rest < 0 ? 'is-over' : 'is-rest';

  return (
    <div className="erpPa">
      {header && <div className="erpPaHeader">{header}</div>}

      {(sources.length > 1 || autoApply) && (
        <div className="erpPaBar">
          {sources.length > 1 && (
            <div className="erpPaTabs" role="tablist">
              {sources.map((s) => (
                <button key={s.key} type="button" role="tab" aria-selected={s.key === active?.key}
                  className={`erpPaTab${s.key === active?.key ? ' is-on' : ''}`}
                  onClick={() => onSourceChange?.(s.key)}>
                  {s.label}<span className="n">{s.lines.length}</span>
                </button>
              ))}
            </div>
          )}
          <div className="erpPaSpacer" />
          {autoApply && (
            <Checkbox label={autoApply.label ?? '자동 배분'} checked={autoApply.checked} onChange={autoApply.onChange} />
          )}
        </div>
      )}

      {bulkActions && bulkActions.length > 0 && (
        <div className="erpPaBulk">{bulkActions.map((a, i) => renderAction(a, i, 'sm'))}</div>
      )}

      {!active || active.lines.length === 0 ? (
        <EmptyState icon={emptyState?.icon} title={emptyState?.title ?? '적용할 건이 없습니다'} description={emptyState?.description} />
      ) : (
        <div className="erpPaScroll">
          <table className="erpPaTable">
            <thead>
              <tr>
                {onToggleLine && <th style={HEAD_CELL} className="w-check" aria-label="선택" />}
                <th style={HEAD_CELL} className="is-grow">{active.label}</th>
                {showDate && <th style={HEAD_CELL} className="w-date">만기</th>}
                <th style={HEAD_CELL} className="is-num w-money">원금액</th>
                <th style={HEAD_CELL} className="is-num w-money">잔액</th>
                {showAdjust && <th style={HEAD_CELL} className="is-num w-adjust">조정</th>}
                <th style={HEAD_CELL} className="is-num w-apply">적용액</th>
              </tr>
            </thead>
            <tbody>
              {active.lines.map((l) => {
                const v = applied[l.id] ?? 0;
                const picked = v !== 0;
                const bad = over.includes(l.id);
                return (
                  <tr key={l.id} className={[picked ? 'is-picked' : '', bad ? 'is-over' : ''].filter(Boolean).join(' ')}>
                    {onToggleLine && (
                      <td className="w-check">
                        <Checkbox checked={picked} onChange={(next) => onToggleLine(l.id, next)} />
                      </td>
                    )}
                    <td className="is-grow">
                      {l.label}
                      {l.sublabel && <span className="sub">{l.sublabel}</span>}
                    </td>
                    {showDate && (
                      <td className="w-date">
                        {l.date}
                        {l.age && <span className="sub"><Badge color={l.age.tone ?? 'neutral'}>{l.age.label}</Badge></span>}
                      </td>
                    )}
                    <td className="is-num"><Money value={l.gross} symbol={false} /></td>
                    <td className="is-num"><Money value={l.open} symbol={false} emphasis /></td>
                    {showAdjust && (
                      <td className="is-num">
                        <CurrencyInput size="sm" value={adjustments?.[l.id] ?? ''} placeholder="0"
                          onChange={(x) => onAdjust!(l.id, Number(x) || 0)} />
                      </td>
                    )}
                    <td className="is-num">
                      <CurrencyInput size="sm" value={v || ''} placeholder="0"
                        onChange={(x) => onApplyChange(l.id, Number(x) || 0)} />
                    </td>
                  </tr>
                );
              })}
              {over.length > 0 && (
                <tr className="erpPaErr"><td colSpan={colCount}>
                  <span><Icon name="alert-triangle" size="sm" color="danger" />
                    <Text variant="caption" color="danger">잔액을 넘겨 적용한 줄이 {over.length}건 있습니다.</Text></span>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 하단 고정 — 배분하는 내내 보여야 하는 값. */}
      <div className="erpPaFoot">
        <div className="erpPaTally">
          <div className="c">
            <Text variant="caption" color="secondary">수납액</Text>
            <div className="v"><Money value={amount} emphasis /></div>
          </div>
          <div className="c">
            <Text variant="caption" color="secondary">적용</Text>
            <div className="v"><Money value={appliedTotal} emphasis /></div>
            {sumAdjust !== 0 && (
              <Text variant="caption" color="secondary">조정 {sumAdjust > 0 ? '+' : '−'}{Math.abs(sumAdjust).toLocaleString('ko-KR')}</Text>
            )}
          </div>
          <div className={`c ${restTone}`}>
            <Text variant="caption" color="secondary">미적용</Text>
            <div className="v"><Money value={rest} emphasis tone="plain" /></div>
            <span className="erpPaRestNote">
              {rest < 0 ? '수납액을 초과했습니다'
                : rest === 0 ? '전액 적용'
                : unapplied === 'block' ? '전액 배분해야 기록할 수 있습니다'
                : '선수금으로 남습니다'}
            </span>
          </div>
        </div>
        <div className="erpPaSpacer" />
        <div className="erpPaActs">
          {onCancel && <Button variant="secondary" onClick={onCancel}>취소</Button>}
          <Button variant="primary" onClick={submit.onSubmit} disabled={blocked} loading={submit.busy}>
            {submit.label ?? '수납 기록'}
          </Button>
        </div>
      </div>
    </div>
  );
}
