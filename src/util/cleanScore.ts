export const cleanScore = (score: string | number) => {
  if (typeof score === "string") {
    // Remove extra double quotes
    score = score.replace(/^"+|"+$/g, "");
    score = parseFloat(score);
  }
  if (typeof score === "number") {
    if (score > 1) {
      score = score / 100;
    }
    if (score < 0) {
      score = 0;
    }
    if (score > 1) {
      score = 1;
    }
  }

  return score;
};
