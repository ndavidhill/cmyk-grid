/**
 * CMYK_Fogra39_Swatches.jsx
 * InDesign ExtendScript — FOGRA39 Swatch Sheet Generator
 *
 * USAGE:
 *   File → Scripts → Browse → select this file
 *   (or place in your Scripts Panel folder for persistent access)
 *
 * WORKFLOW:
 *   1. Export CSV from the CMYK Grid Tester browser tool
 *   2. Run this script in InDesign
 *   3. Select the exported CSV when prompted
 *   4. A new document is created with all swatch grids
 *   5. Export as PDF/X-4 with FOGRA39 output intent
 *
 * REQUIREMENTS:
 *   Adobe InDesign CS6 / CC or later
 *   FOGRA39 ICC profile must be installed on the system
 *   (comes with Creative Cloud — ISOcoated_v2_eci.icc)
 */

// ─── Configuration ─────────────────────────────────────────────────────────

var CONFIG = {
  // Page setup (A4 landscape for wide grids)
  pageWidth:  297,   // mm
  pageHeight: 210,   // mm
  margin:      15,   // mm

  // Swatch grid
  swatchCols:   5,
  swatchSize:  28,   // mm — swatch square
  swatchGap:    4,   // mm
  labelHeight: 14,   // mm — below each swatch
  groupGap:    18,   // mm — between colour groups

  // Source swatch (large reference, left of each group)
  sourceSwatchSize: 22, // mm

  // Typography
  fontFamily: "Courier New",
  fontSizeLabel:  6,   // pt — swatch CMYK label
  fontSizeHeader: 9,   // pt — group header
  fontSizeMeta:   7,   // pt — page footer

  // FOGRA39 profile name as InDesign sees it
  // Change this if your system uses a different profile name:
  fogra39ProfileName: "Coated FOGRA39 (ISO 12647-2:2004)",

  // Fallback profile names to try if above not found
  fogra39Fallbacks: [
    "ISOcoated_v2_eci",
    "ISOcoated_v2 (ECI)",
    "ISO Coated v2 300% (ECI)",
    "Coated FOGRA39",
  ],
};

// ─── Unit helpers (all internal work in mm → pts) ──────────────────────────

var MM = 2.834645669; // 1mm in points

function mm(v) { return v * MM; }

// ─── CSV parser ────────────────────────────────────────────────────────────

function parseCSV(text) {
  var lines = text.split(/\r?\n/);
  var headers = lines[0].split(",");
  var rows = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var cols = line.split(",");
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = cols[j] ? cols[j].trim() : "";
    }
    rows.push(row);
  }
  return rows;
}

// Group rows by colour_group number
function groupRows(rows) {
  var groups = {};
  var order  = [];
  for (var i = 0; i < rows.length; i++) {
    var r   = rows[i];
    var gid = r["colour_group"];
    if (!groups[gid]) {
      groups[gid] = { label: r["label"], swatches: [], source: null };
      order.push(gid);
    }
    var sw = {
      c:         parseInt(r["swatch_c"]),
      m:         parseInt(r["swatch_m"]),
      y:         parseInt(r["swatch_y"]),
      k:         parseInt(r["swatch_k"]),
      isNearest: r["is_nearest"] === "TRUE",
      index:     parseInt(r["swatch_index"]),
    };
    if (sw.index === 1) groups[gid].source = {
      c: parseInt(r["source_c"]),
      m: parseInt(r["source_m"]),
      y: parseInt(r["source_y"]),
      k: parseInt(r["source_k"]),
      hex: r["source_hex"],
    };
    groups[gid].swatches.push(sw);
  }
  // Sort swatches within each group by index
  for (var g in groups) {
    groups[g].swatches.sort(function(a, b) { return a.index - b.index; });
  }
  return { groups: groups, order: order };
}

// ─── Colour helpers ────────────────────────────────────────────────────────

// Add or retrieve a CMYK swatch from the document swatches
function getOrCreateSwatch(doc, c, m, y, k) {
  var name = "C=" + c + " M=" + m + " Y=" + y + " K=" + k;
  // Check if it already exists
  try {
    return doc.colors.itemByName(name);
  } catch (e) {}

  var existing = doc.colors;
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].name === name) return existing[i];
  }

  var swatch = doc.colors.add();
  swatch.model      = ColorModel.PROCESS;
  swatch.space      = ColorSpace.CMYK;
  swatch.colorValue = [c, m, y, k];
  swatch.name       = name;
  return swatch;
}

// Luminance check — return true if text should be black
function useDarkText(c, m, y, k) {
  // Approximate RGB from CMYK for readability check
  var r = 255 * (1 - c / 100) * (1 - k / 100);
  var g = 255 * (1 - m / 100) * (1 - k / 100);
  var b = 255 * (1 - y / 100) * (1 - k / 100);
  var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.45;
}

// ─── Document setup ────────────────────────────────────────────────────────

function createDocument() {
  var doc = app.documents.add();
  doc.documentPreferences.pageWidth  = mm(CONFIG.pageWidth);
  doc.documentPreferences.pageHeight = mm(CONFIG.pageHeight);
  doc.documentPreferences.facingPages = false;

  // Set document colour profile to FOGRA39
  var profileSet = false;
  var profileName = CONFIG.fogra39ProfileName;

  // Try primary name, then fallbacks
  var profilesToTry = [profileName].concat(CONFIG.fogra39Fallbacks);
  for (var pi = 0; pi < profilesToTry.length; pi++) {
    try {
      doc.cmykProfile = profilesToTry[pi];
      profileSet = true;
      profileName = profilesToTry[pi];
      break;
    } catch (e) {}
  }

  if (!profileSet) {
    alert(
      "WARNING: Could not set FOGRA39 ICC profile automatically.\n\n" +
      "Please set it manually:\n" +
      "Edit → Assign Profiles → CMYK: Coated FOGRA39\n\n" +
      "The swatch sheet will still be created but you must\n" +
      "assign the profile before exporting for print."
    );
  }

  // Margins
  var mp = doc.pages[0].marginPreferences;
  mp.top    = mm(CONFIG.margin);
  mp.bottom = mm(CONFIG.margin);
  mp.left   = mm(CONFIG.margin);
  mp.right  = mm(CONFIG.margin);

  return { doc: doc, profileName: profileName, profileSet: profileSet };
}

// ─── Drawing helpers ───────────────────────────────────────────────────────

function drawRect(page, x, y, w, h, fillColour, strokeColour, strokeWeight) {
  var rect = page.rectangles.add();
  rect.geometricBounds = [mm(y), mm(x), mm(y + h), mm(x + w)];
  if (fillColour) {
    rect.fillColor = fillColour;
  } else {
    rect.fillColor = page.parent.swatches.itemByName("None");
  }
  if (strokeColour && strokeWeight) {
    rect.strokeColor  = strokeColour;
    rect.strokeWeight = strokeWeight;
  } else {
    rect.strokeColor = page.parent.swatches.itemByName("None");
  }
  return rect;
}

function drawText(page, x, y, w, h, content, fontSize, align, colourName, bold) {
  var tf = page.textFrames.add();
  tf.geometricBounds = [mm(y), mm(x), mm(y + h), mm(x + w)];
  tf.textFramePreferences.insets = [0, 0, 0, 0];
  tf.contents = content;
  var para = tf.paragraphs[0];
  para.pointSize    = fontSize;
  para.justification = align || Justification.LEFT_ALIGN;
  para.leading      = fontSize * 1.3;
  if (bold) para.fontStyle = "Bold";
  try {
    para.appliedFont = CONFIG.fontFamily;
  } catch (e) {}
  // Text colour
  var tcName = colourName || "Black";
  try {
    para.fillColor = page.parent.colors.itemByName(tcName);
  } catch (e) {
    try {
      para.fillColor = page.parent.swatches.itemByName(tcName);
    } catch (e2) {}
  }
  return tf;
}

// ─── Page renderer ─────────────────────────────────────────────────────────

function renderGroups(doc, grouped) {
  var pageW  = CONFIG.pageWidth;
  var pageH  = CONFIG.pageHeight;
  var margin = CONFIG.margin;

  var contentW = pageW - margin * 2;
  var curY     = margin + 10; // top offset for page title
  var pageIndex = 0;
  var page = doc.pages[0];

  // Page title
  var dateStr = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  drawText(page,
    margin, margin, contentW, 8,
    "CMYK COLOUR REFERENCE  —  FOGRA39 / ISO 12647-2  —  " + dateStr,
    8, Justification.LEFT_ALIGN, null, true
  );
  drawText(page,
    margin, margin, contentW, 8,
    "For accurate print output export as PDF/X-4 with FOGRA39 output intent",
    7, Justification.RIGHT_ALIGN
  );
  curY = margin + 11;

  var swatchSize = CONFIG.swatchSize;
  var swatchGap  = CONFIG.swatchGap;
  var labelH     = CONFIG.labelHeight;
  var groupGap   = CONFIG.groupGap;
  var srcSize    = CONFIG.sourceSwatchSize;
  var cols       = CONFIG.swatchCols;

  // Height of one complete group block
  var swatchRows = Math.ceil(25 / cols); // up to 5 rows
  var groupBlockH = srcSize + labelH + groupGap;
  // Actually: we lay swatches in rows next to / below source
  // Full group height = header(6mm) + max(srcSize, rows*(swatchSize+swatchGap)) + labelH + groupGap

  for (var oi = 0; oi < grouped.order.length; oi++) {
    var gid   = grouped.order[oi];
    var group = grouped.groups[gid];
    var src   = group.source;

    // Estimate group height
    var swRows = Math.ceil(group.swatches.length / cols);
    var gridH  = swRows * (swatchSize + swatchGap);
    var blockH = 7 + Math.max(srcSize + labelH, gridH + labelH) + groupGap;

    // Page break if needed
    if (curY + blockH > pageH - margin - 6) {
      // Add new page
      doc.pages.add(LocationOptions.AFTER, page);
      page = doc.pages[pageIndex + 1];
      pageIndex++;
      curY = margin;
    }

    // ── Group header ───────────────────────────────────────────────
    drawText(page,
      margin, curY, contentW, 6,
      group.label.toUpperCase(),
      CONFIG.fontSizeHeader, Justification.LEFT_ALIGN, null, true
    );
    if (src) {
      drawText(page,
        margin, curY, contentW, 6,
        "Source CMYK: C" + src.c + " M" + src.m + " Y" + src.y + " K" + src.k +
        "   HEX: " + src.hex,
        CONFIG.fontSizeLabel, Justification.RIGHT_ALIGN
      );
    }
    curY += 7;

    // ── Source reference swatch ────────────────────────────────────
    var srcX = margin;
    var srcY = curY;
    if (src) {
      var srcColour = getOrCreateSwatch(doc, src.c, src.m, src.y, src.k);
      drawRect(page, srcX, srcY, srcSize, srcSize, srcColour);

      // "SOURCE" label under source swatch
      var srcLabelColour = useDarkText(src.c, src.m, src.y, src.k) ? null : "Paper";
      drawText(page,
        srcX, srcY + srcSize + 1, srcSize, labelH * 0.8,
        "SOURCE\nC" + src.c + " M" + src.m + "\nY" + src.y + " K" + src.k,
        CONFIG.fontSizeLabel - 0.5, Justification.CENTER_ALIGN
      );
    }

    // ── Swatch grid (to the right of source swatch) ───────────────
    var gridX    = margin + srcSize + swatchGap + 2;
    var gridMaxW = contentW - srcSize - swatchGap - 2;
    var swX      = gridX;
    var swY      = curY;
    var col      = 0;

    for (var si = 0; si < group.swatches.length; si++) {
      var sw = group.swatches[si];
      var swColour = getOrCreateSwatch(doc, sw.c, sw.m, sw.y, sw.k);

      // Draw swatch rectangle
      drawRect(page, swX, swY, swatchSize, swatchSize, swColour);

      // Nearest marker — thin black border
      if (sw.isNearest) {
        var blackColour = doc.colors.itemByName("Black");
        var borderRect = page.rectangles.add();
        borderRect.geometricBounds = [
          mm(swY - 1), mm(swX - 1),
          mm(swY + swatchSize + 1), mm(swX + swatchSize + 1)
        ];
        borderRect.fillColor   = doc.swatches.itemByName("None");
        borderRect.strokeColor = blackColour;
        borderRect.strokeWeight = 1.5;
      }

      // CMYK label inside swatch (top-left)
      var dark    = useDarkText(sw.c, sw.m, sw.y, sw.k);
      var textCol = dark ? "Black" : "Paper";
      var labelText = "C" + sw.c + " M" + sw.m + "\nY" + sw.y + " K" + sw.k;
      if (sw.isNearest) labelText = "\u2605 " + labelText; // ★

      var tf = page.textFrames.add();
      tf.geometricBounds = [
        mm(swY + 1.5), mm(swX + 1.5),
        mm(swY + swatchSize - 1), mm(swX + swatchSize - 1)
      ];
      tf.contents = labelText;
      var para = tf.paragraphs[0];
      para.pointSize = CONFIG.fontSizeLabel;
      para.leading   = CONFIG.fontSizeLabel * 1.35;
      try { para.appliedFont = CONFIG.fontFamily; } catch (e) {}
      try {
        para.fillColor = dark
          ? doc.colors.itemByName("Black")
          : doc.swatches.itemByName("Paper");
      } catch (e) {}

      // Advance grid position
      col++;
      if (col >= cols) {
        col = 0;
        swX = gridX;
        swY += swatchSize + swatchGap;
      } else {
        swX += swatchSize + swatchGap;
      }
    }

    // Move curY past this group
    var gridBottomY = swY + (col > 0 ? swatchSize : 0);
    var groupBottomY = Math.max(srcY + srcSize + labelH, gridBottomY);
    curY = groupBottomY + groupGap;
  }

  // ── Footer on each page ──────────────────────────────────────────
  for (var pi = 0; pi < doc.pages.length; pi++) {
    var pg = doc.pages[pi];
    drawText(pg,
      margin, pageH - margin - 4, contentW, 4,
      "FOGRA39 / ISO 12647-2:2004  ·  Coated offset  ·  Export as PDF/X-4 with FOGRA39 output intent  ·  Page " + (pi + 1) + " of " + doc.pages.length,
      CONFIG.fontSizeMeta, Justification.CENTER_ALIGN
    );
  }
}

// ─── PDF/X-4 export helper ─────────────────────────────────────────────────

function exportPDF(doc, csvFile, profileName) {
  var pdfPath = csvFile.path + "/" +
    csvFile.name.replace(/\.csv$/i, "") +
    "_FOGRA39_" + new Date().toISOString().slice(0, 10) + ".pdf";

  var pdfPreset;
  // Try to use PDF/X-4 preset
  try {
    pdfPreset = app.pdfExportPresets.itemByName("[PDF/X-4:2008]");
  } catch (e) {}

  var pdfOptions = app.pdfExportPreferences;

  // PDF/X-4 settings
  pdfOptions.pDFXStandard           = PDFXStandards.PDFX4_2008;
  pdfOptions.pDFXOutputCondition    = "FOGRA39";
  pdfOptions.pDFXOutputConditionIdentifier = "FOGRA39";
  pdfOptions.pDFXRegistryName       = "http://www.color.org";
  pdfOptions.colorSpace             = PDFColorSpace.CMYK;
  pdfOptions.includeICCProfiles     = ICCProfiles.INCLUDE_ALL;
  pdfOptions.outputProfile          = profileName || CONFIG.fogra39ProfileName;

  // Image quality
  pdfOptions.colorBitmapCompression     = BitmapCompression.ZIP;
  pdfOptions.colorBitmapQuality         = CompressionQuality.MAXIMUM;
  pdfOptions.grayscaleBitmapCompression = BitmapCompression.ZIP;

  // Marks & bleeds (none for reference sheet)
  pdfOptions.cropMarks      = false;
  pdfOptions.bleedMarks     = false;
  pdfOptions.colorBars      = false;
  pdfOptions.pageInformationMarks = false;

  pdfOptions.pageRange = PageRange.ALL_PAGES;
  pdfOptions.spreads   = false;

  try {
    doc.exportFile(ExportFormat.PDF_TYPE, new File(pdfPath), false);
    return pdfPath;
  } catch (e) {
    return null;
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  // 1. Pick CSV
  var csvFile = File.openDialog(
    "Select CMYK Grid Export CSV",
    "CSV files:*.csv",
    false
  );
  if (!csvFile) { alert("No file selected. Script cancelled."); return; }

  csvFile.open("r");
  var text = csvFile.read();
  csvFile.close();

  if (!text || text.length < 10) {
    alert("Could not read CSV file or file is empty."); return;
  }

  // 2. Parse
  var rows = parseCSV(text);
  if (rows.length === 0) {
    alert("No colour data found in CSV."); return;
  }
  var grouped = groupRows(rows);

  // 3. Create document + set FOGRA39
  var result = createDocument();
  var doc = result.doc;

  // 4. Render swatch grids
  renderGroups(doc, grouped);

  // 5. Ask about PDF export
  var exportNow = confirm(
    "Swatch sheet created with " + grouped.order.length + " colour group(s).\n\n" +
    (result.profileSet
      ? "FOGRA39 profile set: " + result.profileName
      : "⚠ FOGRA39 profile not set — please assign manually.") +
    "\n\nExport PDF/X-4 now?\n" +
    "(You can also export later via File → Export → PDF/X-4)"
  );

  if (exportNow) {
    var pdfPath = exportPDF(doc, csvFile, result.profileName);
    if (pdfPath) {
      alert(
        "PDF exported successfully:\n" + pdfPath + "\n\n" +
        "Verify output intent in Acrobat:\n" +
        "File → Properties → Description → Output Condition"
      );
    } else {
      alert(
        "PDF export failed — please export manually:\n" +
        "File → Export → Adobe PDF (Print)\n" +
        "Use PDF/X-4:2008 standard\n" +
        "Set Output Intent to FOGRA39"
      );
    }
  } else {
    alert(
      "Document ready.\n\n" +
      "To export for print:\n" +
      "File → Export → Adobe PDF (Print)\n" +
      "Standard: PDF/X-4:2008\n" +
      "Output Intent: Coated FOGRA39 (ISO 12647-2:2004)"
    );
  }
}

// Run
main();
