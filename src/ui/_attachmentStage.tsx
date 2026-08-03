'use client';
// _attachmentStage — 첨부 *내용*을 그리는 자리. 데스크탑·모바일 뷰어가 공유한다.
//  크롬(닫기·카운터·액션 바)은 각 뷰어가 자기 층의 어휘로 그리고, **무엇을 어떻게 그리는가**만 여기 산다.
//  갈라두면 같은 PDF가 두 화면에서 다르게 렌더되거나 폴백 판정이 어긋난다.
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import { Text } from './Text';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { openPdf, hasPdfEngine, type PdfDoc } from './_pdfEngine';
import { UNVIEWABLE_REASON, fallbackReason, type Attachment } from './_attachment';
import './attachment.css';

/** 확대 단계 — 자유 배율을 안 연다(헌법 5). 맞춤/실제/2배 셋이면 문서 확인에 충분하다. */
export type ZoomStep = 'fit' | 'actual' | 'double';
const ZOOM_SCALE: Record<ZoomStep, number> = { fit: 1, actual: 1.5, double: 2.5 };

type Props = {
  item: Attachment;
  zoom: ZoomStep;
  pdfAssetBase?: string;
  onDownload?: (item: Attachment) => void;
};

export function AttachmentStage({ item, zoom, pdfAssetBase, onDownload }: Props) {
  const [engineReady, setEngineReady] = useState<boolean | null>(null);
  const [doc, setDoc] = useState<PdfDoc | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 엔진 유무는 한 번만 묻는다. null = 아직 모름(그동안 스피너 — 폴백을 성급히 그리면 깜빡인다).
  useEffect(() => { let live = true; hasPdfEngine().then((ok) => { if (live) setEngineReady(ok); }); return () => { live = false; }; }, []);

  // 문서 열기 — item이 바뀌면 이전 문서를 반드시 destroy한다(pdf.js는 워커를 붙들고 있다).
  useEffect(() => {
    if (item.kind !== 'pdf' || !item.src || engineReady !== true) return;
    let live = true;
    let opened: PdfDoc | null = null;
    setLoading(true); setPage(1);
    openPdf(item.src, pdfAssetBase).then((d) => {
      opened = d;
      if (!live) { d?.destroy(); return; }
      setDoc(d); setLoading(false);
    });
    return () => { live = false; opened?.destroy(); setDoc(null); };
  }, [item.id, item.kind, item.src, pdfAssetBase, engineReady]);

  // 페이지 그리기 — 확대 단계가 바뀌면 *다시 렌더*한다(CSS 확대는 글자가 뭉개진다).
  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let live = true;
    setLoading(true);
    doc.render(page, canvasRef.current, ZOOM_SCALE[zoom]).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [doc, page, zoom]);

  if (item.kind === 'image' && item.src && !item.unviewable) {
    return (
      <div className="att-stage">
        {/* 확대는 transform으로 — 이미지는 재렌더가 필요 없다. transform-origin center로 가운데를 붙든다. */}
        <img className="att-img" src={item.src} alt={item.alt ?? item.name}
          style={{ transform: `scale(${ZOOM_SCALE[zoom]})` }} />
      </div>
    );
  }

  if (item.kind === 'pdf' && item.src && !item.unviewable) {
    if (engineReady === null) return <div className="att-stage"><Spinner /></div>;
    if (engineReady && pdfAssetBase) {
      if (doc) {
        return (
          <div className="att-stage att-scroll">
            <canvas ref={canvasRef} className="att-canvas" />
            {loading && <div className="att-veil"><Spinner /></div>}
            {doc.numPages > 1 && (
              <div className="att-pager">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
                <Text variant="caption">{page} / {doc.numPages}</Text>
                <Button variant="secondary" size="sm" disabled={page >= doc.numPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
              </div>
            )}
          </div>
        );
      }
      if (loading) return <div className="att-stage"><Spinner /></div>;
    }
  }

  // ── 폴백 카드 ──
  //  아이콘 + 파일명 + 용량 + **사유별 문구** + 내려받기. 단일 "미리보기 불가"를 쓰지 않는다:
  //  사용자가 다음에 뭘 할지가 사유마다 다르다(형식→내려받기 / 용량→데스크탑 / 보호→권한 요청).
  const reason = fallbackReason(item, engineReady === true && Boolean(pdfAssetBase));
  return (
    <div className="att-stage">
      <div className="att-fallback">
        <Icon name="file" size="lg" color="secondary" />
        <Text variant="body-strong">{item.name}</Text>
        {item.size && <Text variant="caption" color="secondary">{item.size}</Text>}
        <Text variant="caption" color="secondary">{UNVIEWABLE_REASON[reason]}</Text>
        {onDownload && (
          <Button variant="primary" size="md" leftIcon={<Icon name="download" size="sm" />}
            onClick={() => onDownload(item)}>
            내려받기
          </Button>
        )}
      </div>
    </div>
  );
}
