'use client';
// 문서 렌더러 검증 화면 — 서식에 값을 먹여 A4 여러 장으로 그린다.
//  서식 둘을 나란히 둔다:
//   · 거래명세서  — 손으로 적은 PaperSpec(모델이 실물을 담는지의 증거)
//   · 산출내역서  — **엑셀에서 변환한** PaperSpec(xlsx → CLI → json 경로의 증거)
//  라인 수를 바꿔 쪽 나눔·열 머리 재출력·그룹 소계·총계·쪽 번호를 눈으로 확인한다.
//  (dev 도구 — 배포 대상 밖. 샘플 데이터도 여기 산다.)
import { useMemo, useState } from 'react';
import { Stack, Group, Title, Text, Button, SegmentedControl, Callout, PaperDoc, PaperDocModal } from '@/ui';
import { validatePaper, validatePaperCoverage, type PaperSpec } from '@/schema';
import { tradeStatement } from '../../../forms/trade-statement';
import costBreakdownJson from '../../../forms/cost-breakdown.paper.json';
import gabjiJson from '../../../forms/kk-gabji.paper.json';

const costBreakdown = costBreakdownJson as PaperSpec;
const gabji = gabjiJson as PaperSpec;

// ── 샘플 값 ────────────────────────────────────────────────────
const CATS = ['주방 가구', '부자재', '시공'];
const tradeValues = (n: number) => ({
  docNo: 'TS-2026-0812', issueDate: '2026-08-07',
  supplierNo: '123-45-67890', supplier: '○○산업(주)', supplierCeo: '김대표',
  buyerNo: '210-98-76543', buyer: '△△건설(주)', buyerCeo: '이대표',
  note: '잔금은 납품 확인 후 7일 이내 지급합니다.\n하자 발생 시 즉시 통보 바랍니다.',
  receiver: '', receivedAt: '',
  lines: Array.from({ length: n }, (_, i) => ({
    no: i + 1, name: `품목 ${i + 1}`,
    spec: `규격 ${((i % 4) + 1) * 100}×${((i % 3) + 1) * 200}`,
    qty: (i % 5) + 1, price: 10000 * ((i % 7) + 1),
    amount: 10000 * ((i % 7) + 1) * ((i % 5) + 1),
    vat: 1000 * ((i % 7) + 1) * ((i % 5) + 1),
    category: CATS[i % 3],
  })),
});

const STAGES = ['분석', '설계', '구현', '시험'];
const ROLES = [
  { 직무: '응용SW개발자', 등급: '고급', 월임금: 8_000_000 },
  { 직무: 'IT기획자', 등급: '중급', 월임금: 7_000_000 },
  { 직무: 'UI/UX개발자', 등급: '중급', 월임금: 6_500_000 },
];
const costValues = (n: number) => {
  const 투입 = Array.from({ length: n }, (_, i) => {
    const role = ROLES[i % ROLES.length];
    const 인원 = (i % 2) + 1;
    const 기간 = (i % 3) + 1;
    const 공수 = 인원 * 기간;
    return {
      단계: STAGES[i % STAGES.length], ...role, 인원, 기간, 공수,
      금액: 공수 * role.월임금, 비고: '',
    };
  });
  const 인건비 = 투입.reduce((s, x) => s + x.금액, 0);
  const 제경비 = Math.round(인건비 * 1.4);
  const 기술료 = Math.round((인건비 + 제경비) * 0.2);
  const 경비 = [
    { 항목: '출장비', 규격: '왕복 8회', 수량: 8, 단가: 150_000, 금액: 1_200_000, 비고: '' },
    { 항목: '인증서', 규격: '연 1식', 수량: 1, 단가: 3_000_000, 금액: 3_000_000, 비고: '' },
  ];
  const 직접경비계 = 경비.reduce((s, x) => s + x.금액, 0);
  const 소계 = 인건비 + 제경비 + 기술료 + 직접경비계;
  return {
    발행처명: '○○소프트(주)', 발행처사업자번호: '123-45-67890',
    발행처주소: '서울 ○○구 ○○로 1', 발행처전화: '02-000-0000',
    문서번호: 'CB-2026-0087', 작성일자: '2026-08-07',
    사업명: '그룹웨어 문서 생성기 구축', 발주처: '△△산업(주)',
    계약시작: '2026-09-01', 계약종료: '2027-02-28', 산정방식: '투입공수(M/M)',
    직접인건비: 인건비, 제경비율: '140%', 제경비,
    기술료율: '20%', 기술료, 직접경비계,
    소계, 부가세: Math.round(소계 * 0.1), 총계: Math.round(소계 * 1.1),
    산정근거: 'SW사업 대가산정 가이드(2025) 직무별 평균임금 적용. 제경비 140%, 기술료 20%.',
    담당자: '박○○', 검토자: '최○○', 승인자: '정○○',
    투입, 경비,
  };
};

// 갑지 — 부속을 **묶음이 지어지게** 만든다(종류가 연달아 같은 줄끼리 걸침 칸 하나로 합쳐진다).
//  건수를 올리면 걸침이 쪽 경계에서 쪼개지는 것까지 보인다.
const 부속종류 = [
  { 종류: '경첩', 품목: ['15T 댐퍼', '18T 댐퍼', '15T 무댐퍼', '각동 경첩'] },
  { 종류: '레일', 품목: ['3단 언더레일 450', '3단 언더레일 500'] },
  { 종류: '손잡이', 품목: ['알루미늄 바 320', '매립 손잡이'] },
  { 종류: '다보', 품목: ['선반 다보', '고정 다보'] },
];
const gabjiValues = (n: number) => {
  const 평면 = 부속종류.flatMap((g) => g.품목.map((품목) => ({ 종류: g.종류, 품목 })));
  return {
    현장주소: '서울 강남구 테헤란로 123 4층',
    시공팀: '1팀 (김병준)', 시공일: '2026-08-14',
    발주담당자: '박서연', 출입정보: '지하 2층 하역장',
    연락처: '010-1234-5678',
    // ⚠ 「부속」이 **배열 이름이면서 문서 필드**다(엑셀 「필드」 시트 A9). 그릇이 하나뿐이라
    //   현장 정보의 부속 칸에 `[object Object]`가 찍힌다 — 서식에서 한쪽을 개명해야 한다.
    부속: Array.from({ length: n }, (_, i) => ({ ...평면[i % 평면.length], 개수: ((i % 6) + 1) * 2 })),
    시공팀요청: '엘리베이터 사용 09:00~17:00. 자재 반입 전 관리실 확인 요망.',
    케이산업요청: '상부장 수평 재확인 후 실리콘 마감. 폐기물은 당일 반출.',
  };
};

const FORMS: Record<string, { spec: PaperSpec; values: (n: number) => Record<string, unknown>; note: string }> = {
  gabji: { spec: gabji, values: gabjiValues, note: '엑셀에서 변환 — public/kk-gabji.xlsx → paper-import  ·  부속이 반복 + 종류 걸침' },
  cost: { spec: costBreakdown, values: costValues, note: '엑셀에서 변환 — public/paper-sample-cost-breakdown.xlsx → paper-import' },
  trade: { spec: tradeStatement, values: tradeValues, note: '손으로 적은 PaperSpec — src/forms/trade-statement.ts' },
};

// 데이터에서 끌어오는 값 — **소비처가 정한다.** 서식(엑셀)은 «필드가 어디 있나»만 말하고
//  «어디서 오나»는 그 값을 실제로 쥔 쪽만 안다. 여기서는 회사 정보를 잠가 그 통로를 보인다.
const READONLY = ['발행처명', '발행처사업자번호', '발행처주소', '발행처전화'];

export default function PaperDevPage() {
  const [form, setForm] = useState('gabji');
  const [count, setCount] = useState(8);
  const [zoom, setZoom] = useState('0.8');
  const [mode, setMode] = useState('view');
  const [modal, setModal] = useState<'view' | 'edit' | null>(null);
  const [saved, setSaved] = useState<Record<string, unknown> | null>(null);
  // 편집 모드에서 고친 값. 서식·건수를 바꾸면 버린다(샘플이 다시 만들어지므로).
  const [edits, setEdits] = useState<Record<string, unknown> | null>(null);
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setEdits(null); };

  const cur = FORMS[form];
  const base = useMemo(() => cur.values(count), [cur, count]);
  const values = edits ?? base;
  const issues = useMemo(
    () => [...validatePaper(cur.spec), ...validatePaperCoverage(cur.spec)],
    [cur],
  );

  return (
    <Stack gap="lg">
      {/* 인쇄할 때 이 화면의 크롬은 안 나가게 — 부품이 아니라 *화면*의 일이다(PaperDoc 주석 참조).
          박물관 껍데기(넷바·패딩)는 dev/layout.tsx가 따로 걷는다. */}
      <style>{`@media print{.dev-noprint{display:none !important}}`}</style>

      <div className="dev-noprint">
        <Stack gap="lg">
          <Stack gap="xxs">
            <Title variant="display">문서 렌더러</Title>
            <Text variant="body" color="secondary">{cur.note}</Text>
          </Stack>

          {issues.length > 0 && (
            <Callout tone="danger" title={`서식 검증 ${issues.length}건`}>
              {issues.map((i) => `${i.path} — ${i.message}`).join(' / ')}
            </Callout>
          )}

          <Group gap="md" align="center" wrap>
            <SegmentedControl
              size="sm" value={form} onChange={(v) => { setForm(v); setCount(8); setEdits(null); }}
              options={[
                { label: '갑지 (변환)', value: 'gabji' },
                { label: '산출내역서 (변환)', value: 'cost' },
                { label: '거래명세서 (손)', value: 'trade' },
              ]}
            />
            <SegmentedControl
              size="sm" value={mode} onChange={reset(setMode)}
              options={[
                { label: '보기', value: 'view' },
                { label: '편집', value: 'edit' },
              ]}
            />
            <Text variant="body-strong">{({ cost: '투입', gabji: '부속' } as Record<string, string>)[form] ?? '라인'} {count}건</Text>
            <Group gap="xs">
              {[1, 8, 16, 24, 40].map((n) => (
                <Button key={n} variant={n === count ? 'primary' : 'secondary'} size="sm" onClick={() => reset(setCount)(n)}>
                  {n}
                </Button>
              ))}
            </Group>
            <SegmentedControl
              size="sm" value={zoom} onChange={setZoom}
              options={[
                { label: '60%', value: '0.6' },
                { label: '80%', value: '0.8' },
                { label: '100%', value: '1' },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={() => window.print()}>인쇄</Button>
            {/* 소비처가 실제로 쓰는 경로 — 모달이 초안을 쥐고 저장까지 한다.
                여기 화면(위 인라인 PaperDoc)은 «렌더러 검증용»이고, 모달이 «배선 검증용»이다. */}
            <Button variant="primary" size="sm" onClick={() => setModal(mode as 'view' | 'edit')}>
              모달로 열기 ({mode === 'edit' ? '편집' : '보기'})
            </Button>
          </Group>
        </Stack>
      </div>

      <PaperDoc
        spec={cur.spec}
        values={values}
        scale={Number(zoom)}
        mode={mode as 'view' | 'edit'}
        onChange={setEdits}
        readonlyFields={READONLY}
      />

      {/* 소비처 배선 그대로 — 저장은 setState 하나. 여기선 저장된 값을 화면 상태에 반영해 «되돌아오나»를 본다. */}
      <PaperDocModal
        opened={modal !== null}
        onClose={() => setModal(null)}
        title={`${cur.spec.name} — ${modal === 'edit' ? '편집' : '보기'}`}
        spec={cur.spec}
        values={values}
        mode={modal ?? 'view'}
        onSave={(next) => { setEdits(next); setSaved(next); }}
        readonlyFields={READONLY}
      />
      {saved && (
        <div className="dev-noprint">
          <Callout tone="info" title="모달에서 저장됨">
            {`${Object.keys(saved).length}개 키를 소비처가 받았습니다 — 화면 값에 반영했습니다.`}
          </Callout>
        </div>
      )}
    </Stack>
  );
}
