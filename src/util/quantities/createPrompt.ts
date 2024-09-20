import {
  DbProductRecord,
  ObjectId,
  replaceAllHiddenCharacters,
} from "@dipmaxtech/clr-pkg";
import { BatchRequestParams } from "../../types/openai.js";

export const createPrompt = (
  shopDomain: string,
  id: ObjectId,
  product: DbProductRecord,
  retry: boolean
): BatchRequestParams => {
  let content = "";
  let format = "Output-Format:";
  let formatArr = [];
  if (product.nm) {
    content += `"nm":"${product.mnfctr} ${replaceAllHiddenCharacters(
      product.nm
    )}",`;
    let formStr = `"nm":<Menge>, "nm_score":<Wahrscheinlichkeit>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"nm_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
  }
  if (product.e_nm) {
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    let formStr = `"e_nm":<Menge>, "e_score":<Wahrscheinlichkeit>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"e_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
  }
  if (product.a_nm) {
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    let formStr = `"a_nm":<Menge>, "a_score":<Wahrscheinlichkeit>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"a_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
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
          content: `Du bist ein Onlinehändler für Konsumgüter und analysierst die Titel anderer Inserate, 
um die Menge der Packungen des Hauptprodukts in einem Angebot zu bestimmen. Beachte dabei folgende Regeln:
1. **Mengenangaben im Titel**: Achte auf Zahlen im Titel, die direkt auf die Menge des Hauptprodukts hinweisen (z. B. "x Stück", "x Packungen", "2er-Set"). Diese Zahlen repräsentieren die Menge.
2. **Multipack/Mehrfachpackung**: Wenn das Produkt in mehreren identischen Einheiten verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1.
3. **Herstellerkonfiguration**: Die Anzahl der Produktkomponenten ist nicht die Menge.
4. **Zusatzprodukte und Zubehör**: Begriffe wie "inkl.", "mit", "Set", "Bundle" oder Nennungen von Zubehör (z. B. Ladegeräte, Taschen) können 
auf zusätzliche Produkte hinweisen und beeinflussen die Menge des Hauptprodukts nicht, es sei denn, eine Menge wird explizit angegeben.
5. **Teile und Bestandteile**: Die Anzahl der Einzelteile oder Komponenten eines Produkts zählt nicht als separate Menge, es sei denn, sie werden als einzelne verkaufsfähige Einheiten angeboten.
6. **Packungen**: Wenn "Packung mit <x>" angegeben ist, ist <x> die Menge.
7. **Sammlungen/Boxen**: Wenn das Produkt als Sammlung, Box oder Paket verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1.

**Wichtig**: Achte auf die Bedeutung von Kommas und Zahlen im Titel. Wenn die Menge unklar ist, gehe von 1 aus.
Antworte mit der Menge. ${format}`,
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    },
  };
};

/*
v3: Du bist ein Onlinehändler für Konsumgüter und analysierst die Titel anderer Inserate, 
um die Menge der Packungen des Hauptprodukts in einem Angebot zu bestimmen. Beachte dabei folgende Regeln:
1. **Multipack/Mehrfachpackung**: Wenn der Hersteller das identische Produkt im Pack verkauft, ist die Menge 1. // Problem beim Tierfutter etc.
2. **Herstellerkonfiguration**: Die Anzahl der Produktkomponenten ist nicht die Menge.
3. **Zubehör**: Ladegeräte, Taschen usw. zählen nicht zur Menge des Hauptprodukts.
4. **Zusatzprodukte**: Begriffe wie "inkl.", "mit", "Set" weisen auf Zusatzprodukte hin und beeinflussen nicht die Menge des Hauptprodukts.
5. **Teile und Bestandteile**: Die Anzahl der Einzelteile eines Produkts ist nicht die Menge.
6. **Packungen**: Wenn "Packung mit <x>" angegeben ist, ist <x> die Menge.
7. **Sammlungen/Boxen**: Zählen als Menge 1, unabhängig von der Anzahl der Artikel darin.

**Wichtig**: Achte auf die Bedeutung von Kommas und Zahlen im Titel. Wenn die Menge unklar ist, gehe von 1 aus.
Antworte mit der Menge.


v4: Du bist ein Onlinehändler für Konsumgüter und analysierst die Titel anderer Inserate, 
um die Menge der Packungen des Hauptprodukts in einem Angebot zu bestimmen. Beachte dabei folgende Regeln:
1. **Mengenangaben im Titel**: Achte auf Zahlen im Titel, die direkt auf die Menge des Hauptprodukts hinweisen (z. B. "x Stück", "x Packungen", "2er-Set"). Diese Zahlen repräsentieren die Menge.
2. **Multipack/Mehrfachpackung**: Wenn das Produkt in mehreren identischen Einheiten verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1.
3. **Herstellerkonfiguration**: Die Anzahl der Produktkomponenten ist nicht die Menge.
4. **Zusatzprodukte und Zubehör**: Begriffe wie "inkl.", "mit", "Set", "Bundle" oder Nennungen von Zubehör (z. B. Ladegeräte, Taschen) können 
auf zusätzliche Produkte hinweisen und beeinflussen die Menge des Hauptprodukts nicht, es sei denn, eine Menge wird explizit angegeben.
5. **Teile und Bestandteile**: Die Anzahl der Einzelteile oder Komponenten eines Produkts zählt nicht als separate Menge, es sei denn, sie werden als einzelne verkaufsfähige Einheiten angeboten.
6. **Packungen**: Wenn "Packung mit <x>" angegeben ist, ist <x> die Menge.
7. **Sammlungen/Boxen**: Wenn das Produkt als Sammlung, Box oder Paket verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1.

**Wichtig**: Achte auf die Bedeutung von Kommas und Zahlen im Titel. Wenn die Menge unklar ist, gehe von 1 aus.
Antworte mit der Menge.

*/
