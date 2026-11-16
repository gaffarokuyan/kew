import { ARB, LAT, scriptOf } from "./course";

/** Soranî «both» mode: the Latin reading shown under Arabic-script text (undefined otherwise). */
export const latSub = (text: string): string | undefined => (scriptOf() === "both" ? LAT[text] : undefined);
/** Text in the active course is written right to left (Soranî in Arabic script). */
export const isRtl = () => { const m = scriptOf(); return m === "ar" || m === "both"; };
/** Arabic-script form of a Soranî text (for speech recognition, which answers in Arabic script). */
export const arOf = (text: string) => ARB[text] ?? text;
/** Other accepted spellings of an answer: in «both» mode the Latin form counts too. */
export const altForms = (text: string): string[] => { const l = scriptOf() === "both" ? LAT[text] : undefined; return l ? [l] : []; };

/** Keys for typing Soranî in Arabic script. */
export const CKB_KEYS = "ئ ا ب پ ت ج چ ح خ د ر ڕ ز ژ س ش ع غ ف ڤ ق ک گ ل ڵ م ن ھ ە و ۆ ی ێ".split(" ");
