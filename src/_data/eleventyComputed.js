// targetPhrase comes only from the keyword map (src/_data/seo.json), never from front matter.
export default {
  targetPhrase: (data) => data.seo?.pages?.[data.page?.url]?.targetPhrase ?? data.targetPhrase,
};
