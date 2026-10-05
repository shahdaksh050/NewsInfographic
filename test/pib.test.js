import test from "node:test";
import assert from "node:assert/strict";
import { parsePibRss } from "../src/sources/pib.js";

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
