import { replaceAllHiddenCharacters } from "./replaceAllHiddenCharacters.js";

export const createPrompt = (shopDomain, id, product, retry) => {
  let content = "";
  let format = "Output-Format:";
  let formatArr = [];
  if (product.nm) {
    content += `"nm":"${product.mnfctr} ${replaceAllHiddenCharacters(
      product.nm
    )}",`;
    formatArr.push(`"nm":<Stückzahl>`);
  }
  if (product.e_nm) {
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    formatArr.push(`"e_nm":<Stückzahl>`);
  }
  if (product.a_nm) {
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    formatArr.push(`"a_nm":<Stückzahl>`);
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
      model: "gpt-3.5-turbo-0125",
      messages: [
        {
          role: "system",
          content: `Du bist ein Produktdatenbank. 
          Ermittle die Stückzahl jedes Produkt-Bundles und Packungen basierend auf den Produktnamen. 
          Achte besonders auf Teilzeichenfolgen, die die Anzahl der Artikel im Bundle anzeigen. 
          Gewichtangaben und andere Zahlen sind keine Stückzahlen. Antworte mit der Stückzahl. ${format}`,

        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    },
  };
};
