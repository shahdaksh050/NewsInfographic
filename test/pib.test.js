import test from "node:test";
import assert from "node:assert/strict";
import { parsePibReleaseIndex, parsePibReleasePage, parsePibRss } from "../src/sources/pib.js";

test("parses PIB RSS items", () => {
  const articles = parsePibRss(`<?xml version="1.0"?><rss><channel><item>
    <guid>42</guid><title><![CDATA[Cabinet approves &amp; launches programme]]></title>
    <description><![CDATA[<p>A useful description.</p>]]></description>
    <link>https://pib.gov.in/test</link><pubDate>Sun, 05 Oct 2026 10:00:00 +0530</pubDate>
  </item></channel></rss>`);
  assert.equal(articles.length, 1);
  assert.equal(articles[0].title, "Cabinet approves & launches programme");
  assert.equal(articles[0].description, "A useful description.");
  assert.equal(articles[0].sourceName, "Press Information Bureau");
});

test("parses and verifies official PIB archive releases", () => {
  const releases = parsePibReleaseIndex(`<ul><h3>Cabinet</h3><li>
    <a href='/PressReleseDetail.aspx?PRID=12345'>Cabinet approves Green Grid Mission</a>
    <span class='publishdatesmall'>Posted on: 30 Sep 2026</span></li></ul>`);
  assert.equal(releases.length, 1);
  assert.equal(releases[0].ministry, "Cabinet");
  assert.match(releases[0].url, /PRID=12345/);

  const article = parsePibReleasePage(`<div id="MinistryName">Cabinet</div>
    <h1 id="Titleh2">Cabinet approves Green Grid Mission</h1>
    <h3 id="Subtitleh3">A new transmission programme</h3>
    <div id="PrDateTime">Posted On: 30 SEP 2026 3:12PM by PIB Delhi</div>
    <p>The programme will integrate renewable electricity across participating states.</p>
    <p>Battery storage will support the grid during periods of peak demand.</p>
    <span id="ReleaseId">(Release ID: 12345)</span>`, releases[0]);
  assert.equal(article.raw.verified, true);
  assert.ok(article.raw.upsc_papers.includes("GS3"));
  assert.equal(article.raw.summary_points.length, 3);
  assert.equal(article.publishedAt, "2026-09-30T09:42:00.000Z");
});
