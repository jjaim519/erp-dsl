// 인쇄 페이지 규칙 — **문서를 무엇으로 그렸든 한 벌만 쓴다.**
//  이 문자열은 원래 `PaperDoc` 안에 있었다. 그런데 껍데기가 `children`(손코딩 문서)도 받게 되면서
//  그 경로엔 PaperDoc이 없다 — 규칙이 통째로 안 깔려 **브라우저 머리말·꼬리말이 찍히고 방향이 죽는다.**
//  그래서 «어떻게 그리나»(PaperDoc)에서 떼어 «종이는 어떤 페이지인가»(여기)로 올렸다.
import { type PaperOrientation } from '../schema/paper';

/**
 * `@page` + 시트의 **물리 치수**. 두 값이 한 함수에 있는 이유: 둘이 어긋나면 종이가 페이지보다
 * 커져 한 장이 두 장으로 흘러넘친다(그 사고가 이 파일이 생긴 이유의 절반이다).
 *
 * ⚠ **`margin`은 0이어야 한다.** 브라우저 기본 머리말·꼬리말(URL·날짜·쪽번호)을 없애는 게 바로
 *    이 0이고, 종이 안쪽 여백은 이미 시트가 갖고 있다(`PAPER_MARGIN` 15mm). 0이 아닌 값을 주면
 *    인쇄 가능 폭이 210mm 아래로 내려가 **모든 장이 두 장으로 쪼개진다.**
 * ⚠ 방향은 닫힌 enum이라 주입 문자열에 임의값이 안 들어간다(PaperModal 선례).
 */
export function paperPageRule(orientation: PaperOrientation): string {
  const land = orientation === 'landscape';
  return `@media print{@page{size:A4 ${orientation};margin:0}`
    + `.erpPaperSheet{width:${land ? '297mm' : '210mm'} !important;`
    + `height:${land ? '210mm' : '297mm'} !important}}`;
}
