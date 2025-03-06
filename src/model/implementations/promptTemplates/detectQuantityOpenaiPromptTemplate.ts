import {
  DbProductRecord,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { PromptTemplate } from "../../PromptTemplate.js";

export class DetectQuantityOpenaiPromptTemplate
  implements PromptTemplate<DbProductRecord>
{
  formatMessage(context: DbProductRecord): string {
    const { nm, e_nm, a_nm, mnfctr, sdmn, _id } = context;
    let content = "";
    if (nm) {
      content += `"nm":"${mnfctr} ${replaceAllHiddenCharacters(nm)}",`;
    }
    if (e_nm) {
      content += `"e_nm":"${replaceAllHiddenCharacters(e_nm)}" `;
    }
    if (a_nm) {
      content += `"a_nm":"${replaceAllHiddenCharacters(a_nm)}"`;
    }
    content = "{" + content + "}";
    return content;
  }
  formatInstruction(context: DbProductRecord): string {
    const { nm, e_nm, a_nm } = context;
    let format = "";
    let formatArr = [];
    let props = [];
    if (nm) {
      let formStr = `"nm":<Menge>", "nm_score":"<Wahrscheinlichkeit: 0-1>", "nm_produktart":"<Produktart>"`;
      if (process.env.DEBUG === "explain") {
        formStr += `,"nm_explain":"<Erklärung>"`;
      }
      formatArr.push(formStr);
      props.push("nm");
    }
    if (e_nm) {
      let formStr = `"e_nm":<Menge>", "e_score":"<Wahrscheinlichkeit: 0-1>", "e_produktart":"<Produktart>"`;
      if (process.env.DEBUG === "explain") {
        formStr += `,"e_explain":"<Erklärung>"`;
      }
      formatArr.push(formStr);
      props.push("e_nm");
    }
    if (a_nm) {
      let formStr = `"a_nm":<Menge>", "a_score":"<Wahrscheinlichkeit: 0-1>", "a_produktart":"<Produktart>"`;
      if (process.env.DEBUG === "explain") {
        formStr += `,"a_explain":"<Erklärung>"`;
      }
      formatArr.push(formStr);
      props.push("a_nm");
    }
    format += "{" + formatArr.join(",") + "}";

    return `Analysiere die Titel ${props.join(
      " ,"
    )}, um die Menge der separate Verkaufseinheiten desselben Produkts im Titel zu bestimmen.
          Vorgehen: 
          1. Ermittle die Produktarten (Paarprodukte, Set-Produkte, Produkte mit mehreren Teilen, Sammlung, Packung)
          2. Wende die folgenden Regeln basierend auf der Produktart an:
          Regel 1 Paarprodukte:
          Ein Paarprodukt gilt immer als Menge 1, unabhängig von der Angabe der Einzelteile im Titel. (Titel: "2 St" → Menge: 1)
          Regel 2 Einzelteile/Komponenten: 
          Die Anzahl der Einzelteile, Komponenten, eines Produkts zählt nicht als separate Menge, es sei denn, 
          sie werden als einzelne verkaufsfähige Einheiten angeboten. (Titel: "Baukasten mit 500 Teilen" → Menge: 1)
          Regel 3 Multipack/Mehrfachpackung: 
          Wenn das Produkt in mehreren identischen Einheiten verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1.
          Titel: "Doppelpack 2 x 500 ml" → Menge: 2
          Regel 4 Herstellerkonfiguration: 
          Die Anzahl der Produktkomponenten (z.B. "3-in-1") ist nicht die Menge.
          Regel 5 Zusatzprodukte und Zubehör: 
          Begriffe wie "inkl.", "mit", "Set", "Bundle" oder Nennungen von Zubehör (z. B. Ladegeräte, Taschen) können 
          auf zusätzliche Produkte hinweisen und beeinflussen die Menge des Hauptprodukts nicht, es sei denn, eine Menge wird explizit angegeben.
          Regel 6 Packung: 
          Regel 6a: Wenn explizit "Packung mit <x>" angegeben ist, ist <x> die Menge.
          Regel 6b: Packung von Packungen -> Menge: Anzahl der Packungen
          Regel 7 Sammlungen/Boxen: 
          Wenn das Produkt als Sammlung, Box oder Paket verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1. Titel: "DVD-Box Set Staffel 1-3" → Menge: 1
          **Wichtig**: 
          Wenn die Menge unklar ist, gehe von 1 aus.
          Antworte mit der Menge. Gib deine Antwort nur als JSON zurück. ${format}`;
  }
}







