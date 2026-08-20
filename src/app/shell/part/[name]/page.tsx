'use client';
// 데스크탑 무대 캔버스 — 부품 **하나만** 격리 문서에 띄운다. `/dev/part/[name]`이 iframe으로 임베드한다.
//
//  · `/shell` 아래 두는 이유: `/dev`엔 박물관 레이아웃(좌측 트리)이 걸려 있어 캔버스가 될 수 없다.
//    `/shell/*`은 레이아웃이 없어 루트 레이아웃만 탄다 — 폰 캔버스(`/shell/m/part/[name]`)의 **데스크탑 형제**다.
//
//  · **왜 같은 문서 안의 «다크 섬»이 아니라 iframe인가**(이 부품의 존재 이유):
//    Mantine은 CSS 변수를 `:root[data-mantine-color-scheme="dark"]`에 쓴다
//    (`convert-css-variables.mjs` — 셀렉터 앞에 `:root`가 붙는다). 그래서 중첩 div에 속성만 걸면
//    **우리 역할 변수는 안 뒤집힌다.** 억지로 하려면 Mantine 내부 변수 목록을 우리가 베껴야 하고,
//    그건 남의 것을 흉내 내는 짓이라 다음 마이너에서 조용히 갈린다.
//    별도 문서면 그 문제가 통째로 없다. 덤으로 얻는 것 셋:
//      ① 폭 토글이 **진짜 뷰포트**다(브라우저를 안 줄여도 된다 — `@container` 부품이 제대로 강등한다)
//      ② AppShell·페이지급 부품이 제 크기로 선다
//      ③ 문서 잠금을 쓰는 부품(모바일 계열)이 박물관 페이지를 안 죽인다
//
//  · 쿼리(부모가 넘긴다 — **별도 문서라 부모의 `:root`가 상속되지 않는다**):
//      ?scheme=dark   색 모드          ?fs=large|xlarge  폰트 스케일(접근성 검증)
//      ?view=matrix   둘째 보기        ?probe=0          측정 탐침 끄기
//      ?pad=0         여백 0(셸·페이지급 부품)
//
//  dev 전용(배포 제외).
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Demo } from '@/ui/_dev';
import { DemoMatrix } from '../../../dev/_matrix';
import { Probe } from '../_Probe';

export default function PartCanvas() {
  const params = useParams();
  const name = decodeURIComponent(String(params.name));
  const [q, setQ] = useState<URLSearchParams | null>(null);

  //  쿼리 읽기 + 자기 문서에 모드·스케일을 «다시» 깐다. 폰 캔버스가 `?fs=`로 하던 것과 같은 수법인데,
  //  거기선 스케일 하나였고 여기선 색 모드가 하나 더 붙는다.
  //  ⚠ 모드는 `data-mantine-color-scheme`를 직접 쓴다 — MantineProvider의 `forceColorScheme`을
  //    쓰려면 dev 앱이 @mantine/core를 import해야 하는데 그건 린트 문 1(헌법 7) 위반이다.
  //    Providers는 `defaultColorScheme="light"`라 마운트 이후 우리가 덮으면 그대로 남는다.
  useEffect(() => {
    const s = new URLSearchParams(window.location.search);
    setQ(s);
    const root = document.documentElement;
    root.setAttribute('data-mantine-color-scheme', s.get('scheme') === 'dark' ? 'dark' : 'light');
    const fs = s.get('fs');
    if (fs && fs !== 'default') root.dataset.fontScale = fs;
    else delete root.dataset.fontScale;
  }, []);

  //  높이를 부모에게 보고한다 — iframe은 자기 내용 높이를 밖에 안 알려주므로 부모가 알 길이 이것뿐이다.
  //  안 하면 무대가 임의 높이로 잘리고, 그건 «부품이 잘린 것»과 화면에서 구분이 안 된다.
  useEffect(() => {
    const send = () => window.parent?.postMessage(
      { type: 'erp-stage-height', name, h: document.documentElement.scrollHeight },
      window.location.origin,
    );
    const ro = new ResizeObserver(send);
    ro.observe(document.documentElement);
    send();
    return () => ro.disconnect();
  }, [name]);

  if (!q) return null;   // 쿼리를 읽기 전엔 안 그린다(모드가 한 프레임 깜빡이는 걸 막는다)

  const pad = q.get('pad') === '0' ? 0 : 24;

  //  ⚠ **`minHeight: 100vh`를 안 쓴다.** 쓰면 높이가 순환한다 — 캔버스가 부모가 준 높이를 100vh로
  //   읽고 그걸 그대로 «내 높이»라 보고하니, 무대가 정한 값이 영원히 유지된다. 그래서 링크 하나짜리
  //   원자가 240px 빈 판에 떠 있었다(오너 관찰: 「anchor가 뭔지도 안 보인다」).
  //   높이는 **내용이 정하고** 무대는 그걸 받아 쓴다. 뷰포트 높이를 스스로 쓰는 부품(AppShell)만
  //   무대 쪽에서 고정 높이를 준다(`_Stage`의 FULL_HEIGHT).
  return (
    <div style={{ background: 'var(--bg-tertiary)', padding: pad }}>
      {q.get('view') === 'matrix' ? <DemoMatrix name={name} /> : <Demo name={name} />}
      {q.get('probe') !== '0' && <Probe />}
    </div>
  );
}
