---
layout: layouts/art.njk
title: Art
templateClass: tmpl-post
eleventyNavigation:
    key: Art
---

{% set artlist = collections.art | reverse %}
{% include "artlist.njk" %}
