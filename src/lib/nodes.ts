import { UNIT, type NodeT } from "./course";
import { t } from "./i18n";

export const nodeTitle = (n: NodeT) =>
  n.type === "learn" ? t("lesson", { n: n.k! }) : n.type === "sent" ? t("sentences") : n.type === "story" ? UNIT[n.unit].story!.title : t("chest");
