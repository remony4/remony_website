---
layout: layouts/art.njk
title: Art
templateClass: tmpl-post
eleventyNavigation:
    key: Art
    order: 1
---

{% set artlist = collections.art | reverse %}
{% include "artlist.njk" %}
