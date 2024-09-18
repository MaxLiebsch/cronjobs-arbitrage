import { DbProductRecord, ObjectId, replaceAllHiddenCharacters } from "@dipmaxtech/clr-pkg";
import { BatchRequestParams } from "../../types/openai.js";


export const createNameMatchingPrompt = (
  shopDomain: string,
  id: ObjectId,
  product: DbProductRecord,
  retry: boolean
):BatchRequestParams  => {
  let content = "";
  let targetTitle = "";
  let format = "Output-Format:";
  let formatArr = [];
  if (product.nm) {
    content += `"nm":"${product.mnfctr || ""} ${replaceAllHiddenCharacters(
      product.nm
    )}",`;
  }
  if (product.e_nm) {
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    targetTitle = "e_nm";
    let formatStr = `"e_isMatch":<Boolean>, "e_score":<Wahrscheinlichkeit>"`;
    if (process.env.DEBUG === "explain") {
      formatStr += `,"e_explain":"<Erklärung>"`;
    }
    formatArr.push(formatStr);
  }
  if (product.a_nm) {
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    targetTitle += ` und a_nm`;
    let formatStr = `"a_isMatch":<Boolean>, "a_score":<Wahrscheinlichkeit>"`;
    if (process.env.DEBUG === "explain") {
      formatStr += `,"a_explain":"<Erklärung>"`;
    }
    formatArr.push(formatStr);
  }
  format += "{" + formatArr.join(",") + "}";
  let custom_id = `${shopDomain}-${id}`;
  if (retry) {
    custom_id = `${shopDomain}-${id}-retry`;
  }
  return {
    custom_id,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Du bist ein Onlineshop-Verkäufer für Konsumgüter. Du analysierst die Titel der Inserate anderer Onlineshops 
und bewertest anhand der Titel, ob es sich um das gleiche Produkt handelt. Gleicheit bedeutet, dass auch das Zubehör gleich ist.
Wichtig: Zubehör, Ersatzteile oder ähnliche Produkte sind nicht identisch. Produkeigenschaften müssen berücksichtigt werden.
Das Hauptprodukt ist "nm". Vergleich "nm" jeweils mit ${targetTitle} und bewerte, 
ob es sich um das gleiche Produkt handeln könnte, auch wenn die Anzahl 
bzw. die Menge der Artikel unterschiedlich ist. ${format}`,
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    },
  };
};
