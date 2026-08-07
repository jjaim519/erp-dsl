'use client';
// 문서 렌더러 검증 화면 — 서식 하나에 값을 먹여 A4 여러 장으로 그린다.
//  라인 수를 바꿔 쪽 나눔·열 머리 재출력·그룹 소계·총계·쪽 번호를 눈으로 확인한다.
//  (dev 도구 — 배포 대상 밖. 샘플 데이터도 여기 산다.)
import { useMemo, useState } from 'react';
import { Stack, Group, Title, Text, Button, SegmentedControl, Callout } from '@/ui';
import { validatePaper, validatePaperCoverage } from '@/schema';
// PaperDoc은 아직 공개 배럴에 없다(미완 — src/ui/index.ts 주석 참조). dev 화면이 직접 집는다.
import { PaperDoc } from '../../../ui/PaperDoc';
import { tradeStatement } from '../../../forms/trade-statement';

const CATS = ['주방 가구', '부자재', '시공'];
const makeLines = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    no: i + 1,
    name: `품목 ${i + 1}`,
    spec: `규격 ${((i % 4) + 1) * 100}×${((i % 3) + 1) * 200}`,
    qty: (i % 5) + 1,
    price: 10000 * ((i % 7) + 1),
    amount: 10000 * ((i % 7) + 1) * ((i % 5) + 1),
    vat: 1000 * ((i % 7) + 1) * ((i % 5) + 1),
    category: CATS[i % 3],
  }));

export default function PaperDevPage() {
  const [count, setCount] = useState(6);
  const [zoom, setZoom] = useState('0.8');

  const values = useMemo(
    () => ({
      docNo: 'TS-2026-0812',
      issueDate: '2026-08-06',
      supplierNo: '123-45-67890',
      supplier: '○○산업(주)',
      supplierCeo: '김대표',
      buyerNo: '210-98-76543',
      buyer: '△△건설(주)',
      buyerCeo: '이대표',
      note: '잔금은 납품 확인 후 7일 이내 지급합니다.\n하자 발생 시 즉시 통보 바랍니다.',
      receiver: '',
      receivedAt: '',
      lines: makeLines(count),
    }),
    [count],
  );

  const issues = useMemo(
    () => [...validatePaper(tradeStatement), ...validatePaperCoverage(tradeStatement)],
    [],
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
            <Text variant="body" color="secondary">
              서식 정의(PaperSpec) 하나에 값을 먹여 A4로 그린다. 라인 수를 늘리면 쪽이 나뉘고,
              다음 쪽에 열 머리·그룹 머리가 다시 그려진다.
            </Text>
          </Stack>

          {issues.length > 0 && (
            <Callout tone="danger" title={`서식 검증 ${issues.length}건`}>
              {issues.map((i) => `${i.path} — ${i.message}`).join(' / ')}
            </Callout>
          )}

          <Group gap="md" align="center" wrap>
            <Text variant="body-strong">라인 {count}건</Text>
            <Group gap="xs">
              {[1, 6, 12, 20, 34, 60].map((n) => (
                <Button key={n} variant={n === count ? 'primary' : 'secondary'} size="sm" onClick={() => setCount(n)}>
                  {n}
                </Button>
              ))}
            </Group>
            <SegmentedControl
              size="sm"
              value={zoom}
              onChange={setZoom}
              options={[
                { label: '60%', value: '0.6' },
                { label: '80%', value: '0.8' },
                { label: '100%', value: '1' },
              ]}
            />
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              인쇄
            </Button>
          </Group>
        </Stack>
      </div>

      <PaperDoc spec={tradeStatement} values={values} scale={Number(zoom)} />
    </Stack>
  );
}
