import { replaceAllHiddenCharacters } from "../replaceAllHiddenCharacters.js";

export const createCompareQtyPrompt = (shopDomain, id, product, retry) => {
  let content = "";
  let format = "Output-Format:";
  let formatArr = [];
  let titles = ''
  if (product.nm) {
    content += `"nm":"${product.mnfctr} ${replaceAllHiddenCharacters(
      product.nm
    )}",`;
    let formStr = `"nm":<Menge>`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"nm_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
  }
  if (product.e_nm) {
    titles = "e_nm"
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    let formStr = `"e_match": <Boolean> ,"e_nm":<Menge>, "e_score":<Wahrscheinlichkeit>"`;
    if (process.env.DEBUG === "explain") {
      formStr += `,"e_explain":"<Erklärung>"`;
    }
    formatArr.push(formStr);
  }
  if (product.a_nm) {
    titles += ` und a_nm`
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    let formStr = `"a_match": <Boolean> , a_nm":<Menge>, "a_score":<Wahrscheinlichkeit>"`;
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
          content: `Du bist ein Onlineshop-Verkäufer für Konsumgüter. 
          Du analysierst die Titel der Inserate anderer Onlineshops, um 
          bestimmen, ob die nominale Verkaufsmenge der Hauptprodukte übereinstimmt.
          Das Hauptprodukt ist "nm". Vergleiche "nm" mit ${titles} und bewerte,
          ob es sich, um die gleiche Verkaufsmenge des Hauptproduktes handelt.
          Gib die Wahrscheinlichkeit, dass es sich, um die gleiche Menge handelt. ${format}`,
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
          1. Die Herstellerkonfiguration ist nicht die Menge.
          2. Teile des Produktes sind nicht die Menge. Angaben wie "3 Stück" zählen nicht als Menge des Hauptproduktes.
          3. Zubehörteile (wie Ladegeräte oder Taschen) zählen nicht zur Menge des Hauptprodukts. Beispiel: "inkl. Ladegerät" bedeutet nicht, dass die Menge 2 ist.
          4. Zusatzprodukte des Hauptproduktes sind nicht die Menge. Worte wie "inkl." oder "mit" sind Hinweise auf Zusatzprodukte.
          5. Die Menge ist nicht die Anzahl der Produktkomponenten.
          6. Die Menge ist nicht die Anzahl der Teile und Bestandteile des Produktes.
          7. Ein Set ist nicht die Menge.
          8. Ein Produkt, das als Set verkauft wird, ist nicht die Menge.
          9. Ein Produktset ist nicht die Menge.
          10. Die Formulierung "(Packung mit <x>)" mehreren Produkten ist die Menge.
          11.Wichtig: Wenn eine Packung mehrere Einzelteile (z.B. Sticks, Beutel) enthält, 
          diese aber als eine Packung verkauft wird, ist die Menge 1. 
          Beispiel: "3 Sticks in einer Packung" bedeutet, die Menge ist 1 (eine Packung), nicht 3 (Einzelsticks). 
          11. Sets oder Produktsets, die als eine Einheit verkauft werden, zählen als Menge 1, unabhängig von der Anzahl der enthaltenen Artikel.
Beispiel: "Set aus 4 Tassen" hat eine Menge von 1.
          
          Bei Unklarheiten oder wenn du die Anzahl nicht eindeutig bestimmen kannst, gehe von Menge von 1 aus.
          Antworte mit der Menge.


*/