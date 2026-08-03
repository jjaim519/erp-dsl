// ─────────────────────────────────────────────────────────────────────────
// _pdfEngine — pdf.js를 **단일 파일에 가둔다**. 뷰어 부품은 pdfjs-dist를 직접 import하지 않는다.
//
//  왜 격리하나: 엔진 교체·버전 이동이 이 파일 안에서 끝나야 한다(TipTap을 Editor 뒤에 가둔 것과 같은 규율).
//  왜 optional peer인가: PDF를 안 쓰는 소비처가 489KB gz + 4MB 자산을 설치할 이유가 없다.
//   package.json의 peerDependenciesMeta.optional = true가 그 뜻이고, 없으면 여기서 조용히 실패해
//   뷰어가 폴백 카드를 그린다(터지지 않는다).
//
//  ⚠ 결정적 사실 — **Android Chrome에는 PDF 렌더 플러그인이 빌드조차 되지 않는다**
//    (chromium/pdf/features.gni: enable_pdf = !is_android && !is_ios && ...).
//    <iframe>·<embed>·<object> 어느 것도 안드로이드에서 인라인 렌더가 안 된다.
//    즉 브라우저 네이티브는 "덜 좋은 선택"이 아니라 **동작하지 않는 선택**이다 → pdf.js가 유일한 길.
//
//  ⚠ 6.x는 wasmUrl이 **필수**다. 빠뜨리면 스캔 PDF·JPEG2000·폼 스크립트가 *조용히* 깨진다
//    (에러가 안 나고 빈 페이지가 나온다 — 그래서 assetBase를 안 주면 아예 폴백으로 보낸다).
//  ⚠ cmaps는 한국어에 필수다(CJK 인코딩). 빼면 한글 PDF가 깨진다.
// ─────────────────────────────────────────────────────────────────────────

export type PdfDoc = {
  numPages: number;
  /** 페이지를 캔버스에 그린다. scale은 CSS px 기준 배율. */
  render: (pageNumber: number, canvas: HTMLCanvasElement, scale: number) => Promise<void>;
  destroy: () => void;
};

type PdfjsModule = {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (opts: Record<string, unknown>) => { promise: Promise<PdfjsDocument> };
};
type PdfjsDocument = {
  numPages: number;
  getPage: (n: number) => Promise<PdfjsPage>;
  destroy: () => void;
};
type PdfjsPage = {
  getViewport: (opts: { scale: number }) => { width: number; height: number };
  render: (opts: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> };
};

let modulePromise: Promise<PdfjsModule | null> | null = null;

/**
 * pdfjs-dist를 한 번만 동적 로드한다. 없으면 null(설치 안 한 소비처 — 정상 경로).
 * 동적 import라 안 쓰는 소비처의 번들에 안 들어간다.
 */
function loadPdfjs(): Promise<PdfjsModule | null> {
  if (!modulePromise) {
    // webpackIgnore가 아니라 optional peer 부재를 런타임에서 흡수한다 — 빌드는 통과하고 실행에서 갈린다.
    modulePromise = import(/* webpackIgnore: false */ 'pdfjs-dist')
      .then((m) => m as unknown as PdfjsModule)
      .catch(() => null);
  }
  return modulePromise;
}

/** 엔진을 쓸 수 있는지. 부품이 폴백 여부를 정할 때 쓴다. */
export async function hasPdfEngine(): Promise<boolean> {
  return (await loadPdfjs()) != null;
}

/**
 * 문서를 연다. assetBase가 없으면 **열지 않는다** — cmaps/wasm 없이 열면 한글·스캔 PDF가
 * 에러 없이 빈 페이지로 나온다. 조용히 깨지느니 폴백 카드가 낫다.
 */
export async function openPdf(src: string, assetBase?: string): Promise<PdfDoc | null> {
  if (!assetBase) return null;
  const pdfjs = await loadPdfjs();
  if (!pdfjs) return null;

  const base = assetBase.replace(/\/$/, '');
  pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;

  try {
    const doc = await pdfjs.getDocument({
      url: src,
      cMapUrl: `${base}/cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${base}/standard_fonts/`,
      wasmUrl: `${base}/wasm/`,     // 6.x 필수 — 빠지면 스캔 PDF가 조용히 깨진다
    }).promise;

    return {
      numPages: doc.numPages,
      async render(pageNumber, canvas, scale) {
        const page = await doc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        // devicePixelRatio를 곱해 레티나에서 흐려지지 않게 — CSS 크기와 버퍼 크기를 분리한다.
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        await page.render({ canvasContext: ctx, viewport }).promise;
      },
      destroy: () => doc.destroy(),
    };
  } catch {
    return null;   // 손상·암호 PDF 등 — 부품이 폴백 카드로 받는다
  }
}
