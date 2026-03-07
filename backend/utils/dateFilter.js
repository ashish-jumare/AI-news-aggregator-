// Filter news articles by time range (in days)
const filterByTimeRange = (articles, days) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return articles.filter(article => {
    const publishedDate = new Date(article.publishedAt);
    return publishedDate >= cutoffDate;
  });
};

module.exports = { filterByTimeRange };
