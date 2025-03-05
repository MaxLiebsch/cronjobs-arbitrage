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
  let format = "Gib deine Antwort nur als JSON zurück.";
  let formatArr = [];
  let props = [];
  if (product.nm) {
    content += `"nm":"${product.mnfctr} ${replaceAllHiddenCharacters(
      product.nm
    )}",`;
    let formStr = `"nm":<Menge>", "nm_score":"<Wahrscheinlichkeit>", "nm_produktart":"<Produktart>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"nm_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
    props.push("nm");
  }
  if (product.e_nm) {
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    let formStr = `"e_nm":<Menge>", "e_score":"<Wahrscheinlichkeit>", "e_produktart":"<Produktart>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"e_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
    props.push("e_nm");
  }
  if (product.a_nm) {
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    let formStr = `"a_nm":<Menge>", "a_score":"<Wahrscheinlichkeit>", "a_produktart":"<Produktart>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"a_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
    props.push("a_nm");
  }
  format += "{" + formatArr.join(",") + "}";
  content = "{" + content + "}";
  let custom_id = `${shopDomain}-${id}`;
  if (retry) {
    custom_id = `${shopDomain}-${id}-retry`;
  }
  return {
    custom_id,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content: `Analysiere die Titel ${props.join(
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
          Regel 6a: Packungen mit identischen Einheiten → Menge: 1 z.B. '3er-Pack' → Menge: 1
          Regel 6b: Wenn explizit "Packung mit <x>" angegeben ist, ist <x> die Menge.
          Regel 6c: Packung von Packungen -> Menge: Anzahl der Packungen
          Regel 7 Sammlungen/Boxen: 
          Wenn das Produkt als Sammlung, Box oder Paket verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1. Titel: "DVD-Box Set Staffel 1-3" → Menge: 1
          **Wichtig**: 
          Wenn die Menge unklar ist, gehe von 1 aus.
          Antworte mit der Menge. Gib deine Antwort nur als JSON zurück. ${format}`,
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


v5:`Analysiere die Titel ${props.join(
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
          Regel 6a: Packungen mit identischen Einheiten → Menge: 1 z.B. '3er-Pack' → Menge: 1
          Regel 6b: Wenn explizit "Packung mit <x>" angegeben ist, ist <x> die Menge.
          Regel 7 Sammlungen/Boxen: 
          Wenn das Produkt als Sammlung, Box oder Paket verkauft wird und keine spezifische Mengenangabe vorhanden ist, betrachte die Menge als 1. Titel: "DVD-Box Set Staffel 1-3" → Menge: 1
          **Wichtig**: 
          Wenn die Menge unklar ist, gehe von 1 aus.
          Antworte mit der Menge. ${format}`,

*/
