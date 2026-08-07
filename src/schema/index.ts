export type { FieldSpec, FieldType, MaskName, FieldCondition } from './fields';
export { buildZodSchema, isFilled } from './validation';
export type { InferValues } from './validation';

// 문서 정의(장표) — 24열 격자 위의 셀. 부품이 아니라 데이터다(헌법 1).
export {
  validatePaper, validatePaperCoverage, rowsPerPage,
  PAPER_CANON, PAPER_MARGIN, PAPER_ROW_UNIT, PAPER_SYSTEM_FIELDS,
} from './paper';
export type {
  PaperSpec, PaperCell, PaperRow, PaperBand, PaperBandKind, PaperArray, PaperAgg,
  PaperColumns, PaperOrientation, PaperAlign, PaperVAlign, PaperTypo, PaperInk,
  PaperFill, PaperEdge, PaperFlow, PaperWriting, PaperFormat, PaperIssue, PaperSystemField,
} from './paper';
