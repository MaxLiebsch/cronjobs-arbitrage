import { replaceAllHiddenCharacters } from "./replaceAllHiddenCharacters.js";

export const createPrompt = (shopDomain, id, product, retry) => {
  let content = "";
  let format = "Output-Format:";
  let formatArr = [];
  if (product.nm) {
    content += `"nm":"${product.mnfctr} ${replaceAllHiddenCharacters(
      product.nm
    )}",`;
    formatArr.push(`"nm":<Menge>, "explain":"<Erklärung>"`);
  }
  if (product.e_nm) {
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    formatArr.push(`"e_nm":<Menge>, "e_explain":"<Erklärung>"`);
  }
  if (product.a_nm) {
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    formatArr.push(`"a_nm":<Menge>, "a_explain":"<Erklärung>"`);
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
          content: `Du bist ein Onlineshop-Verkäufer für Konsumgüter. 
          Du analysierst die Titel der Inserate anderer Onlineshops, um 
          die Menge zu bestimmen.
          1. Die Herstellerkonfiguration ist nicht die Menge.
          2. Teile des Produktes sind nicht die Menge.
          3. Zubehör zum Hauptprodukt zählt nicht in die Menge.
          4. Zusatzprodukte des Hauptproduktes sind nicht die Menge. Worte wie "inkl." oder "mit" sind Hinweise auf Zusatzprodukte.
          5. Die Menge ist nicht die Anzahl der Produktkomponenten.
          6. Die Menge ist nicht die Anzahl der Teile und Bestandteile des Produktes.
          7. Ein Set ist nicht die Menge.
          8. Ein Produkt, das als Set verkauft wird, ist nicht die Menge.
          9. Ein Produktset ist nicht die Menge.
          10. Die Formulierung "(Packung mit <x>)" mehreren Produkten ist die Menge.
          11. Bei Unklarheiten oder wenn du die Anzahl nicht eindeutig bestimmen kannst, gehe von Menge von 1 aus.
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
