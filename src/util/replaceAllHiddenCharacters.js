export function replaceAllHiddenCharacters(str) {
    // Define a regular expression for all possible hidden characters
    // This includes control characters, invisible characters, and non-printing characters
    const hiddenCharactersRegex = /[^\x20-\x7E]+/g;
  
    // Replace hidden characters with an empty string
    return str.replace(hiddenCharactersRegex, "");
  }