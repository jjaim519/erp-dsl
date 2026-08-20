'use client';
// 모바일 캔버스 — 부품/화면 **하나만** 폰 뷰포트에 띄우는 격리 라우트.
//  · /dev/part/[name] 이 이 주소를 iframe으로 임베드한다. iframe이라야 자체 뷰포트가 되고,
//    MobileShell의 문서 잠금(html.erp-mobile-lock)이 박물관 페이지를 죽이지 않는다.
//  · /shell 아래 두는 이유: /dev 에는 박물관 레이아웃(좌측 트리)이 걸려 있어 캔버스가 될 수 없다.
//    /shell/* 은 레이아웃이 없어 루트 레이아웃만 탄다 — /shell/m·/shell/part 와 같은 자리.
//  · 실물은 _mobileDemos 한 곳에서 온다(4탭 데모와 같은 fixture를 본다 — 두 벌이 안 생긴다).
//  · dev 전용(배포 제외).
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MobileDemoCanvas } from '@/ui/_mobileDemos';

export default function MobileCanvas() {
  const params = useParams();
  const name = decodeURIComponent(String(params.name));

  // 폰트 스케일은 :root에 걸리는데 **iframe은 별도 문서라 부모의 :root가 상속되지 않는다.**
  //  박물관의 '크게/아주크게' 토글이 폰 안에서 아무 일도 안 하는 함정이 바로 이것 —
  //  부모가 ?fs= 로 넘기고 여기서 자기 문서에 다시 깐다(부모는 fs가 바뀌면 iframe을 재마운트한다).
  useEffect(() => {
    const fs = new URLSearchParams(window.location.search).get('fs');
    if (fs && fs !== 'default') document.documentElement.dataset.fontScale = fs;
    else delete document.documentElement.dataset.fontScale;
  }, []);

  return <MobileDemoCanvas name={name} />;
}
