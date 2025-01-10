/* eslint-disable no-console */
export async function readVariables(configUrl) {
  try {
    const response = await fetch(configUrl);
    if (!response.ok) {
      console.log(
        `Failed to fetch config: ${response.status} ${response.statusText}`
      );
    } else {
      const jsonData = await response.json();
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of jsonData.data) {
        window.siteConfig[entry.Item] = entry.Value;
      }
    }
  } catch (error) {
    console.log(`unable to read config: ${error.message}`);
  }
}

export function replaceTokens(data, text) {
  let ret = text;
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const key in data) {
    if (Object.hasOwnProperty.call(data, key)) {
      const item = key;
      const value = data[item];
      ret = ret.replaceAll(item, value);
    }
  }
  return ret;
}
export const months = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function getMonthNumber(monthName) {
  return monthName ? months.indexOf(monthName.toLowerCase()) + 1 : null;
}

export function convertToISODate(input) {
  // First, try to directly parse the input using the Date constructor.
  // This works well for ISO and some common formats.
  const parsedDate = new Date(input);
  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString();
  }

  // Custom parsing for more specific formats
  const regex =
    /^(\d{1,2})?\s*([a-zA-Z]+)?\s*(\d{1,2})[,\s]?\s*(\d{4})(?:\s*([0-9:]+\s*[aApP][mM])?)?\s*$/i;
  const match = regex.exec(input);

  if (match) {
    const day = parseInt(match[3], 10);
    const month = getMonthNumber(match[2]);
    const year = parseInt(match[4], 10);
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // Extract time components if present
    if (match[5]) {
      const [time, meridiem] = match[5].split(/\s+/);
      const [hrs, mins, secs] = time.split(":").map((num) => parseInt(num, 10));

      hours = hrs % 12;
      if (meridiem.toLowerCase() === "pm") hours += 12;
      minutes = mins || 0;
      seconds = secs || 0;
    }

    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    return date.toISOString();
  }

  // For formats not covered, attempt to use Date.parse and check for validity
  const fallbackParsedDate = Date.parse(input);
  if (!Number.isNaN(fallbackParsedDate)) {
    return new Date(fallbackParsedDate).toISOString();
  }

  // Return original input if all parsing attempts fail
  return input;
}

export async function constructGlobal() {
  window.cmsplus.debug("constructGlobal");
  window.siteConfig = {};
  if (window.fetchVariables) {
    await readVariables(
      new URL("/config/defaults.json", window.location.origin)
    );
    await readVariables(
      new URL("/config/variables.json", window.location.origin)
    );
    if (["preview", "live"].includes(window.cmsplus.environment)) {
      await readVariables(
        new URL(
          `/config/variables-${window.cmsplus.environment}.json`,
          window.location.origin
        )
      );
    }
    if (
      ["local", "dev", "preprod", "prod", "stage"].includes(
        window.cmsplus.locality
      )
    ) {
      await readVariables(
        new URL(
          `/config/variables-${window.cmsplus.locality}.json`,
          window.location.origin
        )
      );
    }
  }
  try {
    const now = new Date().toISOString();
    let href = "";
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonicalLink) {
      href = canonicalLink.href;
    }
    const pname = new URL(window.location.href).pathname;

    const text = document.body.innerText; // Get the visible text content of the body
    const wordCount = text.split(/\s+/).filter(Boolean).length; // Split by whitespace
    const thismonth = new Date().getMonth();
    const winloc = window.location.href;

    window.siteConfig["$co:defaultreviewperiod"] = 300;
    window.siteConfig["$co:defaultexpiryperiod"] = 365;
    window.siteConfig["$co:defaultstartdatetime"] = now;
    window.siteConfig["$co:defaultrestrictions"] = "none";
    window.siteConfig["$co:defaulttags$"] = "none";

    window.siteConfig["$system:environment$"] = window.cmsplus.environment;
    window.siteConfig["$system:locality$"] = window.cmsplus.locality;

    window.siteConfig["$page:location$"] = winloc;
    window.siteConfig["$page:url$"] = href;
    window.siteConfig["$page:name$"] = pname;
    // eslint-disable-next-line prefer-destructuring
    window.siteConfig["$page:path$"] = `${winloc}?`.split("?")[0];
    window.siteConfig["$page:wordcount$"] = wordCount;
    window.siteConfig["$page:readspeed$"] = (
      Math.ceil(wordCount / 140) + 1
    ).toString();
    window.siteConfig["$page:title$"] = document.title;
    window.siteConfig["$page:canonical$"] = href;
    window.siteConfig["$system:date$"] = now;
    window.siteConfig["$system:isodate$"] = now;
    window.siteConfig["$system:time$"] = new Date().toLocaleTimeString();
    window.siteConfig["$system:timezone$"] =
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    window.siteConfig["$system:locale$"] =
      Intl.DateTimeFormat().resolvedOptions().locale;
    window.siteConfig["$system:year$"] = new Date().getFullYear();
    window.siteConfig["$system:month$"] = thismonth + 1;
    window.siteConfig["$system:day$"] = new Date().getDate();
    window.siteConfig["$system:hour$"] = new Date().getHours();
    window.siteConfig["$system:minute$"] = new Date().getMinutes();
    window.siteConfig["$system:second$"] = new Date().getSeconds();
    window.siteConfig["$system:millisecond$"] = new Date().getMilliseconds();
    window.siteConfig["$system:version$"] = window.cmsplus.release;

    if (window.siteConfig?.["$meta:wantdublincore$"]) {
      window.siteConfig["$meta:enabledublincore$"] =
        window.siteConfig["$meta:wantdublincore$"];
    }
    if (window.siteConfig?.["$system:allowtracking$"]) {
      window.siteConfig["$system:enabletracking$"] =
        window.siteConfig["$system:allowtracking$"];
    }
    if (window.siteConfig?.["$system:allowtracking$"]) {
      window.siteConfig["$system:enabletracking$"] =
        window.siteConfig["$system:allowtracking$"];
    }
    const month = months[thismonth];
    const firstLetter = month.charAt(0).toUpperCase();
    const restOfWord = month.slice(1);
    const capitalizedMonth = firstLetter + restOfWord;
    window.siteConfig["$system:monthinfull$"] = capitalizedMonth;
    window.siteConfig["$system:monthinshort$"] = capitalizedMonth.slice(0, 3);

    window.siteConfig[
      "$system:dateinenglish$"
    ] = `${capitalizedMonth} ${window.siteConfig["$system:day$"]}, ${window.siteConfig["$system:year$"]}`;
  } catch (error) {
    console.log("Problem constructing SiteConfig", error);
  }
  window.cmsplus.debug("constructGlobal done");
}

export function getConfigTruth(variable) {
  const value = window.siteConfig?.[variable];
  if (typeof value === "boolean") {
    return value;
  }
  const stringValue = (value || "").toLowerCase();
  if (stringValue === "true") return true;
  return stringValue.startsWith("y");
}
