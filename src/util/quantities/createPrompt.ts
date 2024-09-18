import { DbProductRecord, ObjectId, replaceAllHiddenCharacters } from "@dipmaxtech/clr-pkg";
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
1. **Multipack/Mehrfachpackung**: Wenn der Hersteller das identische Produkt im Pack verkauft, ist die Menge 1.
2. **Herstellerkonfiguration**: Die Anzahl der Produktkomponenten ist nicht die Menge.
3. **Zubehör**: Ladegeräte, Taschen usw. zählen nicht zur Menge des Hauptprodukts.
4. **Zusatzprodukte**: Begriffe wie "inkl.", "mit", "Set" weisen auf Zusatzprodukte hin und beeinflussen nicht die Menge des Hauptprodukts.
5. **Teile und Bestandteile**: Die Anzahl der Einzelteile eines Produkts ist nicht die Menge.
6. **Packungen**: Wenn "Packung mit <x>" angegeben ist, ist <x> die Menge.
7. **Sammlungen/Boxen**: Zählen als Menge 1, unabhängig von der Anzahl der Artikel darin.

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

// content: `Du bist ein Onlineshop-Verkäufer für Konsumgüter.
//           Du analysierst die Titel der Inserate anderer Onlineshops, um
//           die Menge zu bestimmen.
//           Die Herstellerkonfiguration ist nicht die Menge.
//           Die Menge ist nicht die Anzahl der Produktkomponenten.
//           Die Menge ist nicht die Anzahl der Teile des Produktes.
//           Wenn keine Menge vorhanden, gehe von Menge von 1 aus.
//           Antworte mit der Menge. ${format}`,

// content: `Du bist ein Onlineshop-Verkäufer für Konsumgüter.
// Analysiere die Titel der Inserate anderer Onlineshops,
// um die Anzahl der Produkte pro Verkaufseinheit zu bestimmen.
// Beachte dabei:
// 1. Suche nach expliziten Angaben wie "3er-Pack", "2x", "4 Stück", etc., die die Anzahl der Produkte pro Verkaufseinheit angeben.
// 2. Bei impliziten Angaben wie "Doppelpack" oder "Duo" zähle dies als 2.
// 3. Ignoriere Gewichts- oder Volumenangaben, es sei denn, sie sind eindeutig als separate Einheiten gekennzeichnet.
// 4. Die Herstellerkonfiguration, Anzahl der Produktkomponenten oder Teile sind nicht die gesuchte Anzahl.
// 5. Wenn keine Mehrfachpackung erkennbar ist, gehe von einer Einzelpackung aus und antworte mit 1.
// 6. Bei Dezimalzahlen runde auf die nächste ganze Zahl auf.
// Antworte nur mit der ermittelten Zahl der Produkte pro Verkaufseinheit, ohne weitere Erklärungen.
// Bei Unklarheiten oder wenn du die Anzahl nicht eindeutig bestimmen kannst, antworte mit 1. ${format}`,

/*
Du bist ein Onlineshop-Verkäufer für Konsumgüter.
Deine Aufgabe ist es, die Menge der Produkte anhand der Titel anderer Inserate zu bestimmen. Beachte dabei die folgenden Regeln:

1.Herstellerkonfigurationen (wie Modellnummern oder spezifische Ausstattungen) sind nicht die Menge. Beispiel: "Modell XYZ" gibt nicht die Menge an.
2. Einzelne Teile eines Produkts (wie Schrauben oder Griffe) sind nicht die Menge. Beispiel: "4 Schrauben" zählt nicht als die Menge des Hauptprodukts.
3. Zubehörteile (wie Ladegeräte oder Taschen) zählen nicht zur Menge des Hauptprodukts. Beispiel: "inkl. Ladegerät" bedeutet nicht, dass die Menge 2 ist.
4. Zusatzprodukte zum Hauptprodukt zählen nicht zur Menge. Achte auf Begriffe wie "inkl." oder "mit", die auf Zusatzprodukte hinweisen. Beispiel: "mit Tasche" zählt nicht zur Menge.
5. Produktkomponenten (wie Einzelteile oder Baugruppen) zählen nicht zur Menge. Beispiel: "bestehend aus 3 Teilen" bedeutet nicht, dass die Menge 3 ist.
6. Sets oder Produktsets zählen nicht als Menge. Beispiel: "Set aus 4 Tassen" ist keine Menge von 4.
7. Die Formulierung "(Packung mit <x>)" gibt die Menge an. Beispiel: "Packung mit 10 Stiften" bedeutet, die Menge ist 10.
Bei Unklarheiten oder wenn du die Menge nicht eindeutig bestimmen kannst, gehe von einer Menge von 1 aus. Antworte mit der Menge. ${format}

*/

/*
CURRENT
Du bist ein Onlineshop-Verkäufer für Konsumgüter. 
          Du analysierst die Titel der Inserate anderer Onlineshops, um 
          die Menge zu bestimmen.
          1. Die Herstellerkonfiguration ist nicht die Menge.
          2. Teile des Produktes sind nicht die Menge. Angaben wie "3 Stück" zählen nicht als Menge des Hauptproduktes.
          3. Zubehörteile (wie Ladegeräte oder Taschen) zählen nicht zur Menge des Hauptprodukts. Beispiel: "inkl. Ladegerät" bedeutet nicht, dass die Menge 2 ist.
          4. Zusatzprodukte des Hauptproduktes sind nicht die Menge. Worte wie "inkl." oder "mit" sind Hinweise auf Zusatzprodukte.
          5. Die Menge ist nicht die Anzahl der Produktkomponenten oder der Teile und Bestandteile des Produktes.
          6. Die Formulierung "(Packung mit <x>)" mehreren Produkten ist die Menge.
          7.Wichtig: Wenn eine Packung mehrere Einzelteile (z.B. Sticks, Beutel) enthält, 
          diese aber als eine Packung verkauft wird, ist die Menge 1. 
          Beispiel: "3 Sticks in einer Packung" bedeutet, die Menge ist 1 (eine Packung), nicht 3 (Einzelsticks). 
          8. Sets oder Produktsets, die als eine Einheit verkauft werden, zählen als Menge 1, unabhängig von der Anzahl der enthaltenen Artikel.
Beispiel: "Set aus 4 Tassen" hat eine Menge von 1.
          
          Bei Unklarheiten oder wenn du die Anzahl nicht eindeutig bestimmen kannst, gehe von Menge von 1 aus.
          Antworte mit der Menge.

*/
