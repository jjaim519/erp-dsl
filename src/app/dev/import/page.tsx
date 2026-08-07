'use client';
// 초기 등록(엑셀 가져오기) dev 도구 — 미숙자가 양식(.xlsx)을 채워 업로드하면 분류·오브젝트가 익스플로러로 즉시 보인다.
//  · 파일 해독(SheetJS)은 여기(도구)에서만 — 배포 DSL은 의존성 0 유지. 변환은 라이브러리의 buildHierarchyFromRows(순수) — 「필드」(열의 뜻) + 「양식」(채운 표) 두 장을 넘긴다.
//  · 저장은 소비 앱 몫(여기선 미리보기). HierarchyExplorer는 editable 안 줌 = 보기 전용.
import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  HierarchyExplorer, buildHierarchyFromRows, type HierarchyImport,
  Stack, Group, Title, Text, Button, Anchor, Callout, Icon,
} from '@/ui';

export default function ImportPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<HierarchyImport | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [exp, setExp] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (file: File | null) => {
    if (!file) return;
    try {
      const wb = XLSX.read(await file.arrayBuffer());
      // 계층 등록표도 문서 서식과 **같은 세 시트**다 — 「양식」이 채우는 표, 「필드」가 열의 뜻.
      const sheet = (n: string) => {
        const ws = wb.Sheets[n];
        if (!ws) throw new Error(`「${n}」 시트를 찾지 못했습니다 — 양식·필드·안내 세 장이 있어야 합니다.`);
        return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false }) as string[][];
      };
      // 「필드」는 1행이 헤더(이름·라벨·종류·필수·배열), 2행부터가 선언이다.
      const fields = sheet('필드').slice(1)
        .filter((r) => String(r[0] ?? '').trim() && !String(r[0]).startsWith('──'))
        .map((r) => ({
          name: String(r[0]).trim(), label: String(r[1] ?? '').trim() || undefined,
          type: String(r[2] ?? '').trim(), required: String(r[3] ?? '').trim() === '필수',
        }));
      const result = buildHierarchyFromRows(fields, sheet('양식'));
      setData(result);
      setErr(null);
      setExp(result.nodes.map((n) => n.id));        // 최상위 펼침
      setSel(result.nodes[0]?.id ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setData(null);
    }
  };

  const toggle = (id: string) => setExp((e) => (e.includes(id) ? e.filter((x) => x !== id) : [...e, id]));

  return (
    <Stack gap="lg">
      <Stack gap="xxs">
        <Title variant="display">초기 등록 (엑셀 가져오기)</Title>
        <Text variant="body" color="secondary">
          「양식」 시트를 채워 업로드하면 아래 익스플로러로 즉시 보입니다. 열의 뜻은 「필드」 시트가 말합니다. (미리보기 — 실제 저장은 소비 앱이 담당)
        </Text>
      </Stack>

      <Group gap="sm" align="center" wrap>
        <Anchor href="/hierarchy-template.xlsx">↓ 양식 .xlsx 내려받기</Anchor>
        <input ref={inputRef} type="file" accept=".xlsx" style={{ display: 'none' }}
          onChange={(e) => onFile(e.currentTarget.files?.[0] ?? null)} />
        <Button variant="primary" leftIcon={<Icon name="upload" size="sm" />} onClick={() => inputRef.current?.click()}>
          양식 업로드
        </Button>
      </Group>

      {err && <Callout tone="danger" title="가져오기 실패">{err}</Callout>}

      {data ? (
        <HierarchyExplorer
          title="가져온 계층"
          nodes={data.nodes}
          selectedId={sel}
          expandedIds={exp}
          onSelect={setSel}
          onToggle={toggle}
          treeTitle="분류"
          objects={sel ? data.objectsByPath[sel] ?? [] : []}
        />
      ) : (
        <Callout tone="info" title="양식을 업로드하세요">
          「양식」 시트만 채우면 됩니다 — 종류가 「분류」인 열이 폴더, 「이름」인 열이 품목 제목입니다. 자세한 건 파일의 「안내」 시트를 보세요.
        </Callout>
      )}
    </Stack>
  );
}
