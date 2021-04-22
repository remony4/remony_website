const { DateTime } = require('luxon');
const fs = require('fs');
const pluginRss = require('@11ty/eleventy-plugin-rss');
const pluginSyntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const Image = require("@11ty/eleventy-img");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const path = require('path')

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(pluginSyntaxHighlight);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.setDataDeepMerge(true);

  eleventyConfig.addLayoutAlias('post', 'layouts/post.njk');

  eleventyConfig.addFilter('readableDate', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(
      'dd LLL yyyy'
    );
  });

  eleventyConfig.addFilter('log', obj => {
    console.log( obj );
    return obj;
  });

  eleventyConfig.addFilter( 'lowercase', str => {
    return str.toLowerCase();
  });

  eleventyConfig.addFilter( 'join', arr => {
    return arr.join(',');
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter('htmlDateString', dateObj => {
    return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-LL-dd');
  });

  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter('head', (array, n) => {
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  async function imageShortcode(src, alt, sizes) {

    console.log(src);
    let metadata = await Image(src, {
      widths: [300, 600],
      formats: ["avif", "jpeg"]
    });

    let imageAttributes = {
      alt,
      sizes,
      loading: "lazy",
      decoding: "async",
    };

    // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
    return Image.generateHTML(metadata, imageAttributes);
  }

  async function galleryShortCode ( gallery, alt) {

    const dirname = path.dirname( this.page.inputPath );
    console.log( dirname );

    const srcs = gallery
      .map( i => {
        console.log( path.join( './', dirname, i.trim()) );
        return path.join( './', dirname, i.trim());
      } );

    const sizes = "100vw";

    const imageAttributes = {
      alt,
      sizes,
      loading: "eager",
      decoding: "async",
    };

    const images = await Promise.all(
      srcs.map( async i => {
        const im = await Image( i, {
          heights: [null, 100, 200],
          formats: ["webp", "avif", "jpeg"]
        });
        
        return [im, Image.generateHTML(im, imageAttributes)];
      })
    );

    const sum = images.reduce( ( acc, [ im, _ ] ) => acc + im['jpeg'][ 0 ].width , 0);
    const html = images.reduce( ( acc, [ _, im ] ) => acc + im, "");

    return `<div class="gallery flex row" style="width: ${ sum }px;">${ html }</div>`;
  }

  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addNunjucksAsyncShortcode("gallery", galleryShortCode);

  eleventyConfig.addCollection('tagList', require('./_11ty/getTagList'));

  eleventyConfig.addPassthroughCopy('img');
  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy('js');

  /* Markdown Plugins */
  let markdownIt = require('markdown-it');
  let markdownItAnchor = require('markdown-it-anchor');
  let options = {
    html: true,
    breaks: true,
    linkify: true,
  };
  let opts = {
    permalink: true,
    permalinkClass: 'direct-link',
    permalinkSymbol: '#',
  };

  eleventyConfig.setLibrary(
    'md',
    markdownIt(options).use(markdownItAnchor, opts)
  );

  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function(err, browserSync) {
        const content_404 = fs.readFileSync('_site/404.html');

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404);
          res.end();
        });
      },
    },
  });

  return {
    templateFormats: ['md', 'njk', 'html', 'liquid'],

    // If your site lives in a different subdirectory, change this.
    // Leading or trailing slashes are all normalized away, so don’t worry about it.
    // If you don’t have a subdirectory, use "" or "/" (they do the same thing)
    // This is only used for URLs (it does not affect your file structure)
    pathPrefix: '/',

    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dataTemplateEngine: 'njk',
    passthroughFileCopy: true,
    dir: {
      input: '.',
      includes: '_includes',
      data: '_data',
      output: '_site',
    },
  };
};
