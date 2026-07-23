'use client';
// ExpressionField 위젯 — 닫힌 DSL 수식 편집기. "문법·검증·삽입 팔레트는 패키지, 변수는 소비처"가 원칙.
//  · 도메인 무지(헌법 1): dimensions/options가 뭔지 모른다 — 유효 변수 경로 목록만 받아 렉싱·검증한다.
//  · 경량 렉서(풀 파서 아님): 토큰화 → 하이라이트 + 검증(미지 변수/함수·괄호 균형·비교 리터럴 코드 대조).
//    options.<var> == 'code' 의 우변은 변수의 닫힌 value_code 집합(variables[].values)과 대조한다(핸드오프 ②).
//  · 하이라이트: 투명 textarea 위 동일 지오메트리 <pre>(오버레이 기법) — 편집은 textarea, 색은 pre가 그린다.
//  · 함수/연산자는 §4.5 기본셋 내장(연산자는 DSL 고정, 함수만 override 가능).
import { useMemo, useRef } from 'react';
import { Icon } from './Icon';
import './exprfield.css';

export type ExprVariable = { path: string; label?: string; group?: string; values?: { code: string; label?: string }[] };
export type ExprFunction = { name: string; hint?: string };

const DEFAULT_FUNCTIONS: ExprFunction[] = [
  { name: 'CEIL' }, { name: 'FLOOR' }, { name: 'ROUND' }, { name: 'MIN' }, { name: 'MAX' }, { name: 'ABS' }, { name: 'IF' },
];

type Props = {
  value: string;
  onChange: (value: string) => void;
  variables: ExprVariable[];
  functions?: ExprFunction[];
  validate?: 'live' | 'off';   // 기본 live
  placeholder?: string;
};

// ── 경량 렉서 ──
type TokType = 'ws' | 'str' | 'num' | 'ident' | 'op' | 'bad';
type Token = { text: string; type: TokType };
// 그룹: 1 공백 · 2 문자열 · 3 숫자 · 4 식별자(점 경로) · 5 연산자 · 6 기타(불량 문자)
const LEX = /(\s+)|('[^']*')|(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)|(==|!=|>=|<=|&&|\|\||[-+*/(),<>])|(.)/g;

function lex(src: string): Token[] {
  const out: Token[] = [];
  let m: RegExpExecArray | null;
  LEX.lastIndex = 0;
  while ((m = LEX.exec(src)) !== null) {
    if (m[1] != null) out.push({ text: m[1], type: 'ws' });
    else if (m[2] != null) out.push({ text: m[2], type: 'str' });
    else if (m[3] != null) out.push({ text: m[3], type: 'num' });
    else if (m[4] != null) out.push({ text: m[4], type: 'ident' });
    else if (m[5] != null) out.push({ text: m[5], type: 'op' });
    else out.push({ text: m[6], type: 'bad' });
  }
  return out;
}

type Analysis = { tokens: Token[]; classes: string[]; issues: string[] };

function analyze(src: string, variables: ExprVariable[], functions: ExprFunction[]): Analysis {
  const tokens = lex(src);
  const varPaths = new Set(variables.map((v) => v.path));
  const codesByPath = new Map<string, Set<string>>();
  for (const v of variables) if (v.values) codesByPath.set(v.path, new Set(v.values.map((x) => x.code)));
  const fnSet = new Set(functions.map((f) => f.name));

  const classes = tokens.map(() => '');
  const issues: string[] = [];
  const nonWs: number[] = tokens.map((t, i) => (t.type === 'ws' ? -1 : i)).filter((i) => i >= 0);
  const posInNonWs = new Map(nonWs.map((tokIdx, k) => [tokIdx, k]));

  let depth = 0;
  tokens.forEach((t, i) => {
    if (t.type === 'op') { classes[i] = 'tk-op'; if (t.text === '(') depth++; else if (t.text === ')') depth--; return; }
    if (t.type === 'num') { classes[i] = 'tk-num'; return; }
    if (t.type === 'ws') { classes[i] = ''; return; }
    if (t.type === 'bad') { classes[i] = 'tk-bad'; issues.push(`허용되지 않는 문자: ${t.text}`); return; }
    if (t.type === 'str') {
      classes[i] = 'tk-str';
      // 비교 리터럴 코드 대조 — 직전 비교연산자의 좌변 변수 values와 대조.
      const k = posInNonWs.get(i) ?? -1;
      const opTok = k > 0 ? tokens[nonWs[k - 1]] : null;
      const lhsTok = k > 1 ? tokens[nonWs[k - 2]] : null;
      if (opTok && (opTok.text === '==' || opTok.text === '!=') && lhsTok && lhsTok.type === 'ident') {
        const codes = codesByPath.get(lhsTok.text);
        if (codes) {
          const code = t.text.slice(1, -1);
          if (!codes.has(code)) { classes[i] = 'tk-bad'; issues.push(`알 수 없는 코드: ${t.text} (${lhsTok.text})`); }
        }
      }
      return;
    }
    // ident — 뒤 비공백이 '('면 함수 호출, 아니면 변수.
    const k = posInNonWs.get(i) ?? -1;
    const nextTok = k >= 0 && k + 1 < nonWs.length ? tokens[nonWs[k + 1]] : null;
    if (nextTok && nextTok.text === '(') {
      if (fnSet.has(t.text)) classes[i] = 'tk-fn';
      else { classes[i] = 'tk-bad'; issues.push(`알 수 없는 함수: ${t.text}`); }
    } else if (varPaths.has(t.text)) {
      classes[i] = 'tk-var';
    } else {
      classes[i] = 'tk-bad'; issues.push(`알 수 없는 변수: ${t.text}`);
    }
  });

  if (depth > 0) issues.push('닫히지 않은 괄호가 있습니다');
  else if (depth < 0) issues.push('여는 괄호보다 닫는 괄호가 많습니다');

  return { tokens, classes, issues };
}

export function ExpressionField({ value, onChange, variables, functions, validate = 'live', placeholder }: Props) {
  const fns = functions ?? DEFAULT_FUNCTIONS;
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { tokens, classes, issues } = useMemo(() => analyze(value, variables, fns), [value, variables, fns]);
  const hasError = validate === 'live' && issues.length > 0;

  // 팔레트 삽입 — 캐럿 위치에 토큰 삽입(선택 영역 대체) 후 캐럿 복원.
  const insert = (text: string) => {
    const ta = taRef.current;
    if (!ta) { onChange(value + text); return; }
    const s = ta.selectionStart, e = ta.selectionEnd;
    onChange(value.slice(0, s) + text + value.slice(e));
    requestAnimationFrame(() => { ta.focus(); const p = s + text.length; ta.setSelectionRange(p, p); });
  };

  // 변수 그룹핑(group 유지 순서).
  const groups: { group: string | undefined; vars: ExprVariable[] }[] = [];
  for (const v of variables) {
    const last = groups[groups.length - 1];
    if (last && last.group === v.group) last.vars.push(v);
    else groups.push({ group: v.group, vars: [v] });
  }

  return (
    <div className="erpExpr">
      <div className="erpExpr-wrap" data-error={hasError || undefined}>
        <pre className="erpExpr-hl" aria-hidden="true">
          {tokens.map((t, i) => (<span key={i} className={classes[i]}>{t.text}</span>))}
          {'\n'}
        </pre>
        <textarea
          ref={taRef}
          className="erpExpr-ta"
          value={value}
          placeholder={placeholder ?? '수식을 입력하세요'}
          spellCheck={false}
          rows={1}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {validate !== 'off' && value.trim() !== '' && (
        issues.length === 0 ? (
          <div className="erpExpr-msg ok"><Icon name="check" size="sm" /> 유효한 수식</div>
        ) : (
          <div className="erpExpr-msgs">
            {issues.map((msg, i) => (
              <div key={i} className="erpExpr-msg bad"><Icon name="alert-circle" size="sm" /> {msg}</div>
            ))}
          </div>
        )
      )}

      <div className="erpExpr-palette">
        {groups.map((g, gi) => (
          <div key={gi} className="erpExpr-palrow">
            <span className="erpExpr-pallbl">{g.group ?? '변수'}</span>
            {g.vars.map((v) => (
              <button key={v.path} type="button" className="erpExpr-tok var" onClick={() => insert(v.path)} title={v.label}>
                {v.path}
              </button>
            ))}
          </div>
        ))}
        <div className="erpExpr-palrow">
          <span className="erpExpr-pallbl">함수</span>
          {fns.map((f) => (
            <button key={f.name} type="button" className="erpExpr-tok fn" onClick={() => insert(`${f.name}(`)} title={f.hint}>
              {f.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
