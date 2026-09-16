/**
 * The in-page probe, shared by every tool that measures a rendered screen.
 *
 * It lives in its own module for one reason: `tools/air-debug.mjs` draws the air probe's
 * verdict onto the page so a human can look at it, and a debug view that reimplements the
 * thing it is debugging is worthless. Both tools serialise THIS function into the browser,
 * so what you see in the overlay is the number that gets scored.
 *
 * Because Playwright stringifies the function, nothing here may close over module scope.
 * Every helper is declared inside. That is the price of the guarantee above.
 */

/**
 * Everything measurable about one rendered screen.
 *
 * @param opts.debug when true, also returns every sample point with its classification,
 *   for the overlay. Off by default: ~1,300 points per screen × 37 screens is noise in a
 *   report and megabytes in `--json`.
 */
export const PROBE = (opts = {}) => {
  /** The sampling pitch, from §A factor 3: "sample on a 24px grid across the work area". */
  const GRID_PX = opts.grid ?? 24;

  /**
   * How far from the desk colour a resolved background has to be before it counts as a
   * fill rather than as paper. Measured in sRGB units on the widest channel.
   *
   * There is exactly one judgement in this whole probe and it is this one, so here is the
   * evidence for it. Distances from the desk (#fbfaf8) to every ground this design
   * actually paints:
   *
   *     card      #ffffff    7      a white card on off-white desk
   *     page      #f5f3ef    9      the surround outside the console
   *     ───────────────────── 11 ───────────────────────────────────
   *     tint      #edecf0   14      the "if you commit" panel, the active mission row
   *     panel     #efebe4   20
   *     selected  #e7e2d9   27
   *
   * The threshold goes in the largest gap in that distribution, not at a round number,
   * and the two decisions it makes are the ones a player would make: a white card is not
   * a fill you can see, a tinted panel is. Figure/ground is what factor 3 exists to
   * measure — its failure mode at the low end is "no perceptual figure/ground" — so a
   * card that provides its figure with a 1px border and no tonal contrast must not be
   * counted as ink, or the probe reports "crammed" for a screen with plenty of rest.
   *
   * Sensitivity, measured rather than assumed: moving this from 8 to 32 changes air by
   * 11 sample points in 1,330 (0.8%). The only consequential value is the one between 7
   * and 9, i.e. whether white cards are ink — 428 points, 32% of the screen. So this is
   * not a dial that can be turned until a screen passes (D-038); it is one visible
   * decision, with `tools/air-debug.mjs` to check it against the render.
   */
  const PAPER = opts.paperDelta ?? 11;

  const root = document.querySelector("[data-work-area]") ?? document.body;
  const rootRectOf = (el) => el.getBoundingClientRect();
  const all = [...root.querySelectorAll("*")];
  const visible = all.filter((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none" && cs.opacity !== "0";
  });

  /** Text nodes only, so a wrapper's text is not counted twice. */
  const ownText = (el) =>
    [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();

  const countWords = (t) => (t ? t.trim().split(/\s+/).filter(Boolean).length : 0);

  const words = visible.reduce((n, el) => n + countWords(ownText(el)), 0);

  const sizes = new Set();
  const weights = new Set();
  const colours = new Set();
  const fills = new Set();
  let inkArea = 0;

  for (const el of visible) {
    const cs = getComputedStyle(el);
    if (ownText(el)) {
      sizes.add(Math.round(parseFloat(cs.fontSize) * 10) / 10);
      weights.add(cs.fontWeight);
      colours.add(cs.color);
    }
    const bg = cs.backgroundColor;
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
      fills.add(bg);
      const r = el.getBoundingClientRect();
      inkArea += r.width * r.height;
    }
  }

  /**
   * A REGION is what a player perceives as one box: a bordered or filled area ≥80×40
   * with no bordered-or-filled ancestor. The nested count (which an earlier version of
   * this tool reported) overstates badly — it counted every chip inside every card.
   */
  const boxy = (el) => {
    const cs = getComputedStyle(el);
    const bordered = parseFloat(cs.borderTopWidth) > 0 || parseFloat(cs.borderLeftWidth) > 0;
    const filled = cs.backgroundColor !== "rgba(0, 0, 0, 0)";
    const r = el.getBoundingClientRect();
    return (bordered || filled) && r.width > 80 && r.height > 40;
  };
  const nestedPanels = visible.filter(boxy).length;
  const topLevel = visible.filter((el) => {
    if (!boxy(el)) return false;
    for (let a = el.parentElement; a && a !== root; a = a.parentElement) if (boxy(a)) return false;
    return true;
  });
  // Declared regions win when content opts in; otherwise fall back to the DOM heuristic.
  const declared = [...document.querySelectorAll("[data-region]")].filter(
    (el) => el.getBoundingClientRect().height > 1,
  );
  const regionNames = declared.map((el) => el.getAttribute("data-region"));
  const regions = declared.length || topLevel.length;

  /* ── air ──────────────────────────────────────────────────────────────────
   * §A factor 3 asks what share of the desk is paper rather than paint. The first
   * implementation asked a much narrower question — "does the element under this point
   * carry own text or a `backgroundColor`?" — and got two things wrong in opposite
   * directions, which is why its total looked plausible:
   *
   *   · A photograph, an inline SVG stroke and every `linear-gradient` have no
   *     `backgroundColor`, so points showing a client's building scored as EMPTY. QA found
   *     204 of 872 on one decide screen; measured here it is 201 of 1,330 at 1440×1024,
   *     and 618 across the decide screens. Half a card is a picture; the probe saw space.
   *   · The work area itself is painted `--color-canvas`, so bare desk — the one thing
   *     that is unambiguously air — scored as INK.
   *
   * So the question is now asked of the pixel, not of one element: composite the
   * background chain at the point and ask what colour a player sees. Paper-coloured means
   * air, whether that paper is the desk or a white card sitting on it. Paint means ink,
   * whether it is a fill, a tint, a gradient, a photograph or an SVG stroke.
   */
  const parseColour = (s) => {
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.%]+))?/.exec(s || "");
    if (!m) return null;
    let a = m[4] === undefined ? 1 : parseFloat(m[4]);
    if (String(m[4]).includes("%")) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a: Number.isFinite(a) ? a : 1 };
  };
  const over = (top, bottom) => ({
    r: top.r * top.a + bottom.r * (1 - top.a),
    g: top.g * top.a + bottom.g * (1 - top.a),
    b: top.b * top.a + bottom.b * (1 - top.a),
    a: 1,
  });

  const rootRect = rootRectOf(root);
  const deskColour = parseColour(getComputedStyle(root).backgroundColor) ?? {
    r: 255,
    g: 255,
    b: 255,
    a: 1,
  };

  /**
   * Classify one sample point. Order matters: the most specific evidence of paint wins,
   * and only when nothing is painted do we fall through to "paper".
   *
   * Also returns the verdict the pre-fix rule would have given at this same point, so the
   * before/after is a reconstruction rather than an estimate. Without it the only record
   * of the old number is a reviewer's report, and an instrument that cannot reproduce its
   * own history is hard to trust about its present.
   */
  const classify = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const hitText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const hitBg = getComputedStyle(el).backgroundColor;
    const legacyAir = !hitText && (!hitBg || hitBg === "rgba(0, 0, 0, 0)" || hitBg === "transparent");
    const out = (k) => ({ k, legacyAir });

    // Text under the point. Kept at the element level as §A specifies, so a point in the
    // gap between two words of a paragraph still counts as ink — the paragraph is the
    // perceived mark, not the glyph.
    if (hitText) return out("text");

    // Replaced media. An <img> is treated as opaque paint; a transparent PNG would be
    // over-counted, and this build has none — every crop is an opaque WebP photograph.
    const tag = el.tagName.toUpperCase();
    if (tag === "IMG" || tag === "CANVAS" || tag === "VIDEO") return out("image");

    /**
     * Inline SVG. Hit-testing is the measurement here: SVG shapes default to
     * `pointer-events: visiblePainted`, so `elementFromPoint` returns a <path> ONLY when
     * the point is on its painted fill or stroke. A point inside an icon's box but
     * between its strokes returns the <svg> root instead and falls through to the
     * background test — which is the honest answer, and the reason this still measures
     * correctly when backlog 7.1 replaces the photos with large, sparse SVG facsimiles.
     */
    if (el.namespaceURI === "http://www.w3.org/2000/svg" && tag !== "SVG") return out("svg");

    // Walk self → ancestors, compositing backgrounds until we hit something opaque. A
    // gradient or a background image is treated as opaque paint and stops the walk.
    let acc = null;
    for (let n = el; n; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        return out(cs.backgroundImage.includes("gradient") ? "gradient" : "image-fill");
      }
      const c = parseColour(cs.backgroundColor);
      if (c && c.a > 0) {
        acc = acc ? over(acc, c) : c;
        if (acc.a >= 0.999) break;
      }
      if (n === document.documentElement) break;
    }
    if (!acc) return out("paper"); // transparent all the way down: the ground shows through
    const seen = acc.a >= 0.999 ? acc : over(acc, deskColour);
    const delta = Math.max(
      Math.abs(seen.r - deskColour.r),
      Math.abs(seen.g - deskColour.g),
      Math.abs(seen.b - deskColour.b),
    );
    return out(delta > PAPER ? "fill" : "paper");
  };

  const airBreakdown = { text: 0, image: 0, svg: 0, gradient: 0, "image-fill": 0, fill: 0, paper: 0 };
  const points = [];
  let sampled = 0;
  let legacyAirPoints = 0;
  /**
   * `elementFromPoint` is viewport-bound: it returns null for anything below the fold, and
   * the old loop silently skipped those points. So on a screen whose content is taller
   * than its box — the ending overflows by 1,967–2,782px depending on the path taken
   * (D-040, and now measured on three) — the air figure describes the first screenful and
   * says nothing about the rest, while looking like a whole-screen number.
   *
   * Coverage is therefore measured against the SCROLLED content, not against the visible
   * box. Measured against the box it would read 100% on the ending, which is true and
   * useless: the box is one screenful by definition. Against the content it reads about a
   * fifth, which is the caveat the number actually needs.
   */
  const bottom = Math.min(rootRect.bottom, window.innerHeight);
  const right = Math.min(rootRect.right, window.innerWidth);
  const contentArea =
    Math.max(root.scrollHeight, rootRect.height) * Math.max(root.scrollWidth, rootRect.width);
  const airCoverage =
    contentArea > 0
      ? Math.round((((bottom - rootRect.top) * (right - rootRect.left)) / contentArea) * 100) / 100
      : 0;
  for (let y = rootRect.top + 12; y < bottom; y += GRID_PX) {
    for (let x = rootRect.left + 12; x < right; x += GRID_PX) {
      const v = classify(x, y);
      if (!v) continue;
      sampled += 1;
      airBreakdown[v.k] = (airBreakdown[v.k] ?? 0) + 1;
      if (v.legacyAir) legacyAirPoints += 1;
      if (opts.debug) points.push({ x: Math.round(x), y: Math.round(y), k: v.k });
    }
  }
  const air = sampled ? Math.round((airBreakdown.paper / sampled) * 100) / 100 : 0;
  /* The same points, scored by the pre-fix rule, so the fix stays auditable rather than
     becoming a number nobody can line up against the reports that preceded it (QA F7). */
  const airLegacy = sampled ? Math.round((legacyAirPoints / sampled) * 100) / 100 : 0;

  /** Words inside the decision object — the question and the option cards. */
  const decisionWords = [...document.querySelectorAll("[data-decision]")].reduce(
    (n, el) => n + countWords(el.innerText),
    0,
  );

  /* ── stations ─────────────────────────────────────────────────────────────
   * §A factor 6: "a deliberate stop the layout forces… about SEQUENCE rather than count",
   * measured as "elements in the work area with font-size ≥1.4× body (≥19px) **or** a
   * saturated accent fill >2000px². One per station, no more." §B names the five: what is
   * true, what is pressing, the question, the options, the commit.
   *
   * THE PREVIOUS IMPLEMENTATION COULD NOT REPORT A PASS. It counted distinct PROMINENCE
   * TIERS — display / title / subtitle / fill — which is a set of four, against a
   * documented band of 5 (max 6). The band was then moved to 3–4 to fit, which D-038
   * recorded as the mistake and D-033 had closed by saying "the numbers should not move to
   * accommodate a screen that fails them". Both halves were wrong: the band had been
   * retuned, and the instrument it was retuned for was measuring a different quantity with
   * a ceiling below the target. A factor that cannot score above 0 under its own
   * documented band is the D-037 family exactly — a gate that cannot see a pass.
   *
   * So this counts stations the way §A and §B describe one: prominent marks, grouped into
   * VERTICAL BANDS. The grouping is what turns "elements" into "stations" — four option
   * titles side by side are one stop in the reading sequence, not four — and it uses §B's
   * own separator, the 24px air step ("24px between stations, 8px within"). Two marks
   * whose boxes overlap, or sit within 24px of each other, are the same station. A design
   * that does not put the air step between two marks has not made them separate stops,
   * which is the thing the factor exists to measure.
   *
   * Scope: inside the console, excluding `header` and both `aside` rails, because §B is
   * explicit that "the rails are not stations" and the header is furniture. The commit bar
   * IS in scope — station 5 lives in the action bar rather than on the desk.
   *
   * `stationTiers` keeps the old number beside the new one, exactly as `airLegacy` does for
   * factor 3: an instrument that cannot reproduce its own history is hard to trust about
   * its present. `stationLabels` names what was counted, so the number can be checked
   * against the render rather than believed.
   */
  const stationScope = document.querySelector("[data-console]") ?? document.body;
  const scoped = [...stationScope.querySelectorAll("*")].filter((el) => {
    if (el.closest("header") || el.closest("aside")) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  });

  /**
   * The fill test, shared by both counts: a saturated hue or a dark solid over 2000px².
   *
   * THE ALPHA CHECK IS THE WHOLE TEST. `getComputedStyle(el).backgroundColor` returns
   * `rgba(0, 0, 0, 0)` for anything transparent, and the previous pattern —
   * `/^rgba?\((\d+), (\d+), (\d+)/` with no alpha group — read that as pure black,
   * computed a luminance of 0, and called every transparent element in the console a dark
   * accent fill. The old tier count therefore earned its "fill" tier from transparency on
   * every screen in the game, which is most of the reason it reported 3 on a build whose
   * decide screen has exactly one accent fill on it.
   *
   * A near-opaque threshold rather than a fully opaque one, because a 0.92-alpha ink patch
   * reads as a patch. Below that it is a tint, and factor 3 is the one that measures tints.
   */
  const bigAccentFill = (el, cs) => {
    const r = el.getBoundingClientRect();
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+))?/.exec(
      cs.backgroundColor || "",
    );
    if (!m || r.width * r.height < 2000) return false;
    if (m[4] !== undefined && parseFloat(m[4]) < 0.9) return false;
    const [rr, gg, bb] = [+m[1], +m[2], +m[3]];
    const mx = Math.max(rr, gg, bb);
    const mn = Math.min(rr, gg, bb);
    const lum = (0.2126 * rr + 0.7152 * gg + 0.0722 * bb) / 255;
    /* Either a saturated hue or a dark solid. The brand used to be a saturated violet and
       is now ink, and a probe that only recognises saturation was measuring the old
       design. */
    return (mx > 40 && (mx - mn) / mx > 0.45) || lum < 0.3;
  };

  /** §A's threshold, stated there as a number as well as a ratio: ≥1.4× body, ≥19px. */
  const PROMINENT_PX = 19;

  /** Where a mark is, so the count can be argued with. */
  const describe = (el) => {
    const region = el.getAttribute("data-region");
    const cls = (el.getAttribute("class") ?? "").split(/\s+/).find((c) => c && !c.includes(":"));
    return `${el.tagName.toLowerCase()}${region ? `[${region}]` : cls ? `.${cls}` : ""}`;
  };

  const marks = [];
  const fillCandidates = [];
  const tiers = new Set();
  for (const el of scoped) {
    const cs = getComputedStyle(el);
    const own = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join(" ")
      .trim();
    const px = parseFloat(cs.fontSize);
    const r = el.getBoundingClientRect();
    if (own) {
      if (px >= 30) tiers.add("display");
      else if (px >= 22) tiers.add("title");
      else if (px >= 17) tiers.add("subtitle");
      if (px >= PROMINENT_PX) {
        marks.push({
          el,
          top: r.top,
          bottom: r.bottom,
          label: `${Math.round(px)}px ${describe(el)} “${own.slice(0, 22)}”`,
        });
        continue;
      }
    }
    if (bigAccentFill(el, cs)) {
      tiers.add("fill");
      fillCandidates.push({
        el,
        top: r.top,
        bottom: r.bottom,
        label: `fill ${Math.round(r.width)}×${Math.round(r.height)} ${describe(el)}`,
      });
    }
  }

  /**
   * A fill that CONTAINS another mark is the ground, not a station.
   *
   * Factor 1 already draws this distinction — a region is a filled area "with no
   * filled-or-bordered ancestor" — and it has to be drawn here too. Without it, one
   * dark full-bleed container measuring 1414×835 counted as a mark, and because a station
   * band absorbs every mark within 24px of it, that single element swallowed 42 others and
   * the whole screen reported **two** stations. The number looked like a finding about the
   * design and was a finding about the probe: a ground that spans the desk cannot be a
   * stop in a reading sequence, because there is nowhere for the eye to stop at.
   */
  for (const candidate of fillCandidates) {
    const contains = (other) => other.el !== candidate.el && candidate.el.contains(other.el);
    if (marks.some(contains) || fillCandidates.some(contains)) continue;
    marks.push(candidate);
  }

  marks.sort((a, b) => a.top - b.top);
  const bands = [];
  for (const mark of marks) {
    const last = bands[bands.length - 1];
    if (last && mark.top < last.bottom + 24) {
      last.bottom = Math.max(last.bottom, mark.bottom);
      last.labels.push(mark.label);
    } else {
      bands.push({ top: mark.top, bottom: mark.bottom, labels: [mark.label] });
    }
  }
  const stations = bands.length;
  const stationTiers = tiers.size;
  const stationLabels = bands.map((b) => `${Math.round(b.top)}: ${b.labels[0]}${b.labels.length > 1 ? ` (+${b.labels.length - 1})` : ""}`);

  const targets = [...root.querySelectorAll("button, a[href], summary, [role='button']")].filter(
    (el) => el.getBoundingClientRect().width > 1,
  ).length;
  /* §C factor 8 names its measure: the count of `button.choice`. The rubric was reading
     `targets - 1` instead, which on this build happens to land near the option count and
     on a brief screen does not. Measure the thing the document says. */
  const choices = [...document.querySelectorAll("button.choice")].filter(
    (el) => el.getBoundingClientRect().width > 1,
  ).length;

  /* ── factor 9 · progressive disclosure share ──────────────────────────────
   * §C specifies this, marks it "✅ Auto", and it was never built — first omitted from
   * the denominator (which is how the rubric printed 92/92), then counted as an
   * outright zero. Neither is a measurement.
   *
   * What is measurable without touching content: the affordances a player can actually
   * see and operate — a closed `<details>`, or anything with `aria-expanded="false"` —
   * and the words sitting behind them. Words rather than pixels, because §9's target
   * ("25–40% of briefing words behind one affordance") is written in words, and because
   * the collapsed content has no geometry to measure: a closed `<details>` has no boxes,
   * which is exactly why `innerText` and the visible-word count already exclude it and
   * the two numbers can be added without double-counting.
   *
   * Three things are reported, because the factor has three clauses:
   *   share      hidden ÷ (hidden + visible), against 0.25–0.40
   *   controls   how many disclosure affordances are on screen, against "at most two"
   *   critical   whether any collapsed content sits inside [data-decision], which is a
   *              hard violation ("0% of decision-critical content hidden")
   */
  const disclosures = [];
  for (const d of document.querySelectorAll("details")) {
    const summary = d.querySelector(":scope > summary");
    if (!summary) continue;
    if (!d.getBoundingClientRect().height) continue;
    const hidden = d.open ? 0 : countWords(d.textContent) - countWords(summary.textContent);
    disclosures.push({
      kind: "details",
      open: d.open,
      hidden: Math.max(0, hidden),
      critical: !!(d.closest("[data-decision]") || d.querySelector("[data-decision]")),
    });
  }
  for (const t of document.querySelectorAll("[aria-expanded]")) {
    if (t.closest("details")) continue; // already counted through its <summary>
    if (!t.getBoundingClientRect().height) continue;
    const open = t.getAttribute("aria-expanded") === "true";
    const id = t.getAttribute("aria-controls");
    // Without aria-controls the controlled element is unknowable from the DOM, so fall
    // back to the next sibling — the convention — and report 0 rather than guess wider.
    const panel = (id && document.getElementById(id)) || t.nextElementSibling;
    disclosures.push({
      kind: "aria",
      open,
      hidden: open || !panel ? 0 : countWords(panel.textContent),
      critical: !!(
        t.closest("[data-decision]") ||
        (panel && (panel.closest("[data-decision]") || panel.querySelector("[data-decision]")))
      ),
    });
  }
  const hiddenWords = disclosures.reduce((n, d) => n + d.hidden, 0);

  // Whole-console counts, for the numbers that are about the screen not the desk.
  // innerText is render-aware, so collapsed disclosure content is already excluded here.
  const chromeWords = [...document.querySelectorAll("aside, header")].reduce(
    (n, el) => n + countWords(el.innerText),
    0,
  );

  const totalWords = words + chromeWords;

  return {
    words,
    chromeWords,
    totalWords,
    regions,
    regionNames,
    nestedPanels,
    stations,
    stationTiers,
    stationLabels,
    targets,
    choices,
    air,
    airLegacy,
    airBreakdown,
    airSampled: sampled,
    airCoverage,
    hiddenWords,
    disclosureControls: disclosures.length,
    disclosureShare:
      totalWords + hiddenWords
        ? Math.round((hiddenWords / (totalWords + hiddenWords)) * 100) / 100
        : 0,
    disclosureCritical: disclosures.some((d) => d.critical && !d.open),
    decisionShare: totalWords ? Math.round((decisionWords / totalWords) * 100) / 100 : 0,
    typeSizes: [...sizes].sort((a, b) => a - b),
    fontWeights: [...weights].sort(),
    textColours: colours.size,
    fillColours: fills.size,
    inkRatio: Math.round((inkArea / (rootRect.width * rootRect.height)) * 100) / 100,
    workArea: { w: Math.round(rootRect.width), h: Math.round(rootRect.height) },
    ...(opts.debug ? { points } : {}),
  };
};
