// dev-browser template for Google Maps distance lookups
// Claude: copy this template, fill in the LEGS array, write to /tmp/mileage-batch-N.js
// Max 7 legs per file (30s QuickJS timeout)
//
// Usage: dev-browser run /tmp/mileage-batch-1.js

const page = await browser.getPage("maps");

// === FILL IN LEGS HERE ===
const legs = [
  // { from: "5213 Green Thread Trl, Spicewood, TX 78669", to: "908 E 5th St, Austin, TX 78702" },
];
// === END LEGS ===

const results = [];

for (const leg of legs) {
  try {
    var url = "https://www.google.com/maps/dir/"
      + encodeURIComponent(leg.from) + "/"
      + encodeURIComponent(leg.to);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
    await page.waitForTimeout(3000);

    // Check for CAPTCHA or consent overlays
    var blocked = await page.evaluate(function() {
      var text = document.body.innerText.toLowerCase();
      if (text.indexOf("unusual traffic") >= 0) return "captcha";
      if (text.indexOf("before you continue") >= 0) return "consent";
      return null;
    });

    if (blocked) {
      console.log("BLOCKED: " + blocked + " — stopping batch");
      results.push({ from: leg.from, to: leg.to, error: "blocked_" + blocked });
      break;
    }

    // Extract distance using regex — excludes "min" matches
    var distance = await page.evaluate(function() {
      var text = document.body.innerText;
      var matches = text.match(/(\d+[\.,]?\d*)\s*mi(?:les?)?(?!\s*n)/gi);
      return matches && matches.length > 0 ? matches[0] : null;
    });

    // Parse numeric value
    var miles = null;
    if (distance) {
      var num = parseFloat(distance.replace(/,/g, "").replace(/\s*mi(?:les?)?/i, ""));
      if (!isNaN(num) && num > 0 && num < 1000) {
        miles = Math.round(num * 10) / 10;
      }
    }

    if (miles !== null) {
      results.push({ from: leg.from, to: leg.to, miles: miles });
      console.log(leg.from.substring(0, 30) + " -> " + leg.to.substring(0, 30) + ": " + miles + " mi");
    } else {
      results.push({ from: leg.from, to: leg.to, error: "extraction_failed" });
      console.log(leg.from.substring(0, 30) + " -> " + leg.to.substring(0, 30) + ": ERROR extraction_failed");
    }
  } catch (e) {
    results.push({ from: leg.from, to: leg.to, error: e.message || "unknown" });
    console.log(leg.from.substring(0, 30) + " -> " + leg.to.substring(0, 30) + ": ERROR " + (e.message || "unknown"));
  }
}

console.log("\n=== RESULTS ===");
console.log(JSON.stringify(results));
