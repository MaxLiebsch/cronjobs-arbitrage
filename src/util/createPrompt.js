import { replaceAllHiddenCharacters } from "./replaceAllHiddenCharacters.js";

export const createPrompt = (shopDomain, id, product, retry) => {
  let content = "";
  let format = "Format:";
  let formatArr = [];
  if (product.nm) {
    content += `"nm":"${replaceAllHiddenCharacters(product.nm)}",`;
    formatArr.push(`"nm":<Anzahl>`);
  }
  if (product.e_nm) {
    content += `"e_nm":"${replaceAllHiddenCharacters(product.e_nm)}" `;
    formatArr.push(`"e_nm":<Anzahl>`);
  }
  if (product.a_nm) {
    content += `"a_nm":"${replaceAllHiddenCharacters(product.a_nm)}"`;
    formatArr.push(`"a_nm":<Anzahl>`);
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
          content: `Überprüfe Produktanzahl jedes Titels! Antworte mit der Anzahl pro jedem Titel. Keine ungerechtfertige Annahmen. ${format}`,
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
