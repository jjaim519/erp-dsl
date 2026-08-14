'use client';
// 문서 렌더러 검증 화면 — 서식에 값을 먹여 A4 여러 장으로 그린다.
//  kk의 실물 서식 넷을 나란히 둔다. 전부 **엑셀에서 변환한** PaperSpec이라(xlsx → CLI → json)
//  이 화면이 곧 그 경로의 증거다. 손으로 적은 PaperSpec(거래명세서)은 걷었다 — 저작 경로가
//  엑셀 하나로 모인 뒤로는 «손으로도 적을 수 있다»를 증명할 자리가 아니라 두 벌을 남길 뿐이다.
//  건수를 바꿔 쪽 나눔·열머리 재출력·묶음 걸침·소계·총계를 눈으로 확인한다.
//  (dev 도구 — 배포 대상 밖. 샘플 데이터도 여기 산다.)
import { useMemo, useState } from 'react';
import { Stack, Group, Title, Text, Button, SegmentedControl, Callout, PaperDoc, DocModal } from '@/ui';
import { validatePaper, validatePaperCoverage, type PaperSpec } from '@/schema';
import gabjiJson from '../../../forms/kk-gabji.paper.json';
import eulJson from '../../../forms/kk-eulnaeyeokseo.paper.json';
import gabNaeJson from '../../../forms/kk-gabnaeyeokseo.paper.json';
import sayongJson from '../../../forms/kk-sayongnaeyeokseo.paper.json';

const gabji = gabjiJson as PaperSpec;
const eul = eulJson as PaperSpec;
const gabNae = gabNaeJson as PaperSpec;
const sayong = sayongJson as PaperSpec;

// ── 샘플 값 ────────────────────────────────────────────────────
// 갑지 — 부속을 **묶음이 지어지게** 만든다(종류가 연달아 같은 줄끼리 걸침 칸 하나로 합쳐진다).
//  건수를 올리면 걸침이 쪽 경계에서 쪼개지는 것까지 보인다.
const DEMO_LOGO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgNDQiPjxyZWN0IHg9IjEiIHk9IjEiIHdpZHRoPSI0MiIgaGVpZ2h0PSI0MiIgcng9IjkiIGZpbGw9IiMxRTQxNzgiLz48cGF0aCBkPSJNMTIgMzFWMTNoNi4yYzMuNCAwIDUuNiAxLjkgNS42IDUgMCAyLjEtMSAzLjYtMi43IDQuM2wzLjQgOC43aC00bC0zLThoLTEuOHY4eiIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0xNS43IDIwLjJoMi4xYzEuMyAwIDIuMS0uOCAyLjEtMnMtLjgtMi0yLjEtMmgtMi4xeiIgZmlsbD0iIzFFNDE3OCIvPjx0ZXh0IHg9IjUyIiB5PSIyNyIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTUiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiMxNjE4MUMiPlJJVkVOPC90ZXh0Pjx0ZXh0IHg9IjUyIiB5PSIzOCIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sSGVsdmV0aWNhLHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNy41IiBmaWxsPSIjNkU3NDgwIj5JTkRVU1RSSUFMIENPLjwvdGV4dD48L3N2Zz4=';
const 부속종류 = [
  { 종류: '경첩', 품목: ['15T 댐퍼', '18T 댐퍼', '15T 무댐퍼', '각동 경첩'] },
  { 종류: '레일', 품목: ['3단 언더레일 450', '3단 언더레일 500'] },
  { 종류: '손잡이', 품목: ['알루미늄 바 320', '매립 손잡이'] },
  { 종류: '다보', 품목: ['선반 다보', '고정 다보'] },
];
const gabjiValues = (n: number) => {
  const 평면 = 부속종류.flatMap((g) => g.품목.map((품목) => ({ 종류: g.종류, 품목 })));
  return {
    // 「필드」 시트가 종류=이미지로 선언한 자리. 값이 없으면 빈 칸이라 **로고가 빠져도 조용하다** —
    //  그래서 여기 샘플을 둔다(dev에서 안 보이면 렌더러가 고장 난 것이다).
    발행처로고: DEMO_LOGO,
    현장주소: '서울 강남구 테헤란로 123 4층',
    시공팀: '1팀 (김병준)', 시공일: '2026-08-14',
    발주담당자: '박서연', 출입정보: '지하 2층 하역장',
    연락처: '010-1234-5678', 부속비고: '현장 지참',
    부속: Array.from({ length: n }, (_, i) => ({ ...평면[i % 평면.length], 개수: ((i % 6) + 1) * 2 })),
    시공팀요청: '엘리베이터 사용 09:00~17:00. 자재 반입 전 관리실 확인 요망.',
    케이산업요청: '상부장 수평 재확인 후 실리콘 마감. 폐기물은 당일 반출.',
  };
};

// 내역서(트리) — **깊이 1은 구획의 머리다.** 자기 단가가 없고 24열 전 폭을 먹는 제목 줄로 서며,
//  그 구획의 수는 소계가 말한다. 항목은 깊이 2·3뿐이라 실제로 밀리는 계단은 하나다.
//  열머리가 구획 «안»에 있어 구획마다 다시 난다 — 건수를 올리면 쪽 경계에서 그게 같이 보인다.
const 공사이름 = ['주방', '후드', '붙박이장', '현관장', '세탁실', '드레스룸'];
const 부분이름 = ['상부장', '하부장', '키큰장'];
const treeValues = (n: number) => {
  const 품목: Record<string, unknown>[] = [];
  // 구획 제목 — 값 칸이 없다(있으면 소계가 그 수를 한 번 더 더한다).
  const 구획 = (품명: string) => 품목.push({ 레벨: 1, 품명 });
  const 항목 = (레벨: number, 품명: string, 수량: number, 단가: number) =>
    품목.push({ 레벨, 품명, 단위: 레벨 === 2 ? 'EA' : '식', 수량, 단가, 금액: 수량 * 단가, 비고: '' });
  for (let g = 0; g < n; g++) {
    구획(공사이름[g % 공사이름.length]);
    for (let b = 0; b < (g % 3) + 1; b++) {
      항목(2, 부분이름[b % 부분이름.length], (b % 4) + 2, 180_000);
      // 깊이 3 — 「그 부분에 딸린 옵션」. 마지막 부분엔 안 달아 깊이가 줄마다 다른 걸 보인다.
      for (let o = 0; o <= b % 2; o++) 항목(3, `옵션${o + 1}`, o + 1, 12_000 * (o + 3));
    }
    항목(2, '실리콘 마감', 1, 90_000);   // 옵션 없이 깊이 2로 끝나는 줄
  }
  return {
    // 로고 자리는 **모든 문서에 있다**(표준 머리 3종 중 하나). 값이 없으면 빈 칸으로 두는 게 계약이라
    //  데모가 안 먹이면 «자리가 없는 것»으로 보인다 — 여기서 먹여 그 자리를 눈에 보이게 한다.
    발행처로고: DEMO_LOGO,
    발행처명: '○○퍼니처(주)', 발행처주소: '서울 ○○구 ○○로 1', 발행처전화: '02-000-0000',
    현장명: '송파 장지동 308-204',
    품목,
  };
};

// 갑내역서(견적서) — 묶음 걸침 + 표의 합을 엔진이 더한다({{합계:견적.금액}}).
//  부가세·총계는 «비율·덧셈»이라 엔진이 못 한다 — 소비처가 계산해 넘기는 자리를 여기서 보인다.
const 공사구획 = [
  { 종류: '주방', 품목: ['상부장 교체 (SE0 몸통)', '하부장 교체', '싱크볼·수전'] },
  { 종류: '거실', 품목: ['붙박이장 맞춤', '몰딩·마감'] },
  { 종류: '침실', 품목: ['붙박이장', '가벽 시공'] },
  { 종류: '현관', 품목: ['중문 설치', '신발장'] },
];
const gabNaeValues = (n: number) => {
  const 평면 = 공사구획.flatMap((g) => g.품목.map((품목) => ({ 종류: g.종류, 품목 })));
  const 견적 = Array.from({ length: n }, (_, i) => ({
    ...평면[i % 평면.length], 금액: ((i % 6) + 2) * 450_000, 비고: i % 4 === 1 ? '헤펠레 하드웨어' : '',
  }));
  const 공사비 = 견적.reduce((s, x) => s + x.금액, 0);
  const 부가세 = Math.round(공사비 * 0.1);
  return {
    발행처로고: DEMO_LOGO,
    고객명: '박서연', 고객전화번호: '010-1234-5678',
    담당자명: '김병준', 담당자전화번호: '010-9876-5432',
    견적일: '2026-08-07', 견적일로부터7일후: '2026-08-14',
    공사명: '강남 리모델링 주방·거실',
    견적, 부가세, 총계: 공사비 + 부가세,
  };
};

// 사용내역서 — 부속을 종류로 묶어 쓴다. ⚠ 하단 「묶음별 합계」 구간은 아직 미완이라
//  7행이 항목마다 한 줄씩 더 나온다(묶음당 한 줄이 되려면 「묶음반복」 밴드가 필요하다).
const sayongValues = (n: number) => {
  const 평면 = 부속종류.flatMap((g) => g.품목.map((품목) => ({ 종류: g.종류, 품목 })));
  const 부속 = Array.from({ length: n }, (_, i) => {
    const 단가 = ((i % 5) + 1) * 3_000;
    const 개수 = ((i % 6) + 1) * 2;
    return { ...평면[i % 평면.length], 단가, 개수, 금액: 단가 * 개수 };
  });
  return {
    발행처로고: DEMO_LOGO,
    현장주소: '서울 강남구 테헤란로 123 4층',
    부속, 총계: 부속.reduce((s, x) => s + x.금액, 0),
  };
};

const FORMS: Record<string, { spec: PaperSpec; values: (n: number) => Record<string, unknown>; note: string }> = {
  gabji: { spec: gabji, values: gabjiValues, note: 'public/kk-gabji.xlsx  ·  부속이 반복 + 종류 걸침' },
  gabNae: { spec: gabNae, values: gabNaeValues, note: 'public/kk-gabnaeyeokseo.xlsx  ·  묶음 걸침 + 표의 합을 엔진이 더함' },
  eul: { spec: eul, values: treeValues, note: 'public/kk-eulnaeyeokseo.xlsx  ·  줄마다 깊이가 다른 트리 + 깊이 1 소계' },
  sayong: { spec: sayong, values: sayongValues, note: 'public/kk-sayongnaeyeokseo.xlsx  ·  ⚠ 하단 「묶음별 합계」 미완' },
};

// 데이터에서 끌어오는 값 — **소비처가 정한다.** 서식(엑셀)은 «필드가 어디 있나»만 말하고
//  «어디서 오나»는 그 값을 실제로 쥔 쪽만 안다. 여기서는 회사 정보를 잠가 그 통로를 보인다.
//  서식마다 이름이 다르므로 셋을 합쳐 둔다 — 갑지는 시공팀·시공일, 산출내역서는 회사 정보가 잠긴다.
//  뒤 둘은 **행 하나만** 잠근 것 — 같은 표에서 0·1행 품목은 죽은 글자, 나머지 줄은 입력칸이 된다.
//  (양식이 깐 고정 줄과 직접 쓰는 빈 줄이 한 배열에 섞이는 실제 경우다. 편집 모드에서 눈으로 본다.)
const READONLY = [
  '발행처명', '발행처사업자번호', '발행처주소', '발행처전화', '시공팀', '시공일',
  '부속[0].품목', '부속[1].품목',
];

export default function PaperDevPage() {
  const [form, setForm] = useState('gabji');
  const [count, setCount] = useState(8);
  //  기본 100% — 소비처가 모달에서 보는 크기와 같아야 «크다/작다» 판단이 성립한다(80%면 종이보다 작게 보인다).
  const [zoom, setZoom] = useState('1');
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
                { label: '갑지', value: 'gabji' },
                { label: '갑내역서', value: 'gabNae' },
                { label: '을내역서', value: 'eul' },
                { label: '사용내역서', value: 'sayong' },
              ]}
            />
            <SegmentedControl
              size="sm" value={mode} onChange={reset(setMode)}
              options={[
                { label: '보기', value: 'view' },
                { label: '편집', value: 'edit' },
              ]}
            />
            <Text variant="body-strong">{({ gabji: '부속', gabNae: '견적', eul: '구획', sayong: '부속' } as Record<string, string>)[form] ?? '라인'} {count}건</Text>
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
      <DocModal
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
