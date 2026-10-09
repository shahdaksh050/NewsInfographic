const url = process.argv[2] || "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2316948&lang=1&reg=3";
const firstResponse = await fetch(url);
let html = await firstResponse.text();
const monthArg = process.argv.find((value) => value.startsWith("--month="));
if (monthArg) {
  const hidden = Object.fromEntries([...html.matchAll(/<input[^>]+type="hidden"[^>]+name="([^"]+)"[^>]+value="([^"]*)"[^>]*>/gi)].map((match) => [match[1], match[2].replace(/&amp;/g, "&")]));
  const form = new URLSearchParams({
    ...hidden,
    __EVENTTARGET: "ctl00$ContentPlaceHolder1$ddlMonth",
    __EVENTARGUMENT: "",
    "ctl00$ContentPlaceHolder1$ddlMinistry": "0",
    "ctl00$ContentPlaceHolder1$ddlday": "0",
    "ctl00$ContentPlaceHolder1$ddlMonth": monthArg.slice(8),
    "ctl00$ContentPlaceHolder1$ddlYear": "2026",
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: firstResponse.headers.get("set-cookie") || "",
    },
    body: form,
  });
  html = await response.text();
}

console.log(`Fetched ${html.length} characters from ${url}`);
const archiveLabel = /id="ContentPlaceHolder1_lblDate"[^>]*>([\s\S]*?)<\/span>/i.exec(html)?.[1];
if (archiveLabel) {
  console.log(`Archive: ${archiveLabel.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`);
  if (process.argv.includes("--controls")) {
    const yearIndex = html.indexOf("ContentPlaceHolder1_ddlYear");
    console.log(html.slice(yearIndex, yearIndex + 3500));
    for (const match of html.matchAll(/<(?:input|button)[^>]+(?:ContentPlaceHolder1|__EVENT)[^>]*>/gi)) {
      console.log(match[0]);
    }
  }
  process.exit(0);
}
for (const marker of ["id=\"MinistryName\"", "id=\"PrDateTime\"", "class=\"innner-page-main-about-us-content-right-part\""]) {
  const index = html.indexOf(marker);
  if (index >= 0) console.log(`\n--- ${marker} ---\n${html.slice(index, index + 5000)}`);
}
for (const line of html.split(/\r?\n/)) {
  if (/select|option|PressReleasePage|Posted On|Ministry|content-right|release/i.test(line)) {
    console.log(line.trim().slice(0, 1200));
  }
}
