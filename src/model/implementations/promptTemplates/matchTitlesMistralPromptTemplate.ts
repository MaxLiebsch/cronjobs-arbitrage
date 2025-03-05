import { DbProductRecord, replaceAllHiddenCharacters } from "@dipmaxtech/clr-pkg";
import { PromptTemplate } from "../../PromptTemplate.js";

export class MatchTitlesMistralPromptTemplate implements PromptTemplate<DbProductRecord> {
  formatInstruction(context: DbProductRecord): string {
    const { nm, e_nm, a_nm } = context;
    let format = "";
    let targetTitleArr = [];
    let formatArr = [];
    if (e_nm) {
      targetTitleArr.push("e_nm");
      let formatStr = `"e_isMatch":<Boolean>, "e_score":<Wahrscheinlichkeit>"`;
      if (process.env.DEBUG === "explain") {
        formatStr += `,"e_explain":"<Erklärung>"`;
      }
      formatArr.push(formatStr);
    }
    if (a_nm) {
      targetTitleArr.push("a_nm");
      let formatStr = `"a_isMatch":<Boolean>, "a_score":<Wahrscheinlichkeit>"`;
      if (process.env.DEBUG === "explain") {
        formatStr += `,"a_explain":"<Erklärung>"`;
      }
      formatArr.push(formatStr);
    }
    format += "{" + formatArr.join(",") + "}";
    return `Du bist ein Onlineshop-Verkäufer für Konsumgüter. Du analysierst die Titel der Inserate anderer Onlineshops 
und bewertest anhand der Titel, ob es sich um das gleiche Produkt handelt. Gleicheit bedeutet, dass auch das Zubehör gleich ist.
Wichtig: Zubehör, Ersatzteile oder ähnliche Produkte sind nicht identisch. Produkeigenschaften müssen berücksichtigt werden.
Das Hauptprodukt ist nm. Vergleich nm jeweils mit ${targetTitleArr.join(" und ")} und bewerte, 
ob es sich um das gleiche Produkt handeln könnte, auch wenn die Anzahl 
bzw. die Menge der Artikel unterschiedlich ist. Gib deine Antwort nur als JSON zurück. Format: ${format}`;
  }

  formatMessage(context: DbProductRecord): string {
    const { nm, e_nm, a_nm, mnfctr} = context;
    let contentArr = [];
    if (nm) {
      contentArr.push(`nm: ${mnfctr || ""} ${replaceAllHiddenCharacters(nm)}`);
    }
    if (e_nm) {
      contentArr.push(`e_nm: ${replaceAllHiddenCharacters(e_nm)}`);
    }
    if (a_nm) {
      contentArr.push(`a_nm: ${replaceAllHiddenCharacters(a_nm)}`);
    }
    return `${contentArr.join(",")}`;
  }
}