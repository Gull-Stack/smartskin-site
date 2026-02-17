module.exports = function(eleventyConfig) {
  // Support pathPrefix from environment (for GitHub Pages)
  const pathPrefix = process.env.PATH_PREFIX || "/";
  
  // Pass through static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/api");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/sitemap.xml");
  
  // Watch CSS for changes
  eleventyConfig.addWatchTarget("src/css/");
  
  // Date filter for footer year
  eleventyConfig.addFilter("date", function(value, format) {
    if (format === "%Y") {
      return new Date().getFullYear();
    }
    return value;
  });
  
  return {
    pathPrefix: pathPrefix,
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
