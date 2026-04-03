/**
 * SVG и разметка мини-инфографик для модальных окон
 */
(function (global) {
  "use strict";

  const RED = "#e32b2b";
  const RED_D = "#8b0000";
  const GRAY = "#444";
  const TEXT = "#aaa";

  function barRow(label, pct) {
    const w = Math.min(100, Math.max(0, pct));
    return (
      '<div class="viz-row">' +
      '<span class="viz-row__l">' +
      label +
      "</span>" +
      '<div class="viz-row__t"><span class="viz-row__f" style="--pct:' +
      w +
      '%"></span></div>' +
      '<span class="viz-row__p">' +
      pct +
      "%</span></div>"
    );
  }

  function donut(percent, labelHtml) {
    const p = Math.min(100, Math.max(0, percent));
    return (
      '<div class="viz-donut-css" style="--p:' +
      p +
      '"><div class="viz-donut-css__hole"><strong>' +
      p +
      '%</strong><span>' +
      labelHtml +
      "</span></div></div>"
    );
  }

  function flowStep(n, title, sub) {
    return (
      '<div class="viz-flow__step">' +
      '<span class="viz-flow__n">' +
      n +
      "</span>" +
      "<div><strong>" +
      title +
      "</strong><br/><span class=\"viz-sub\">" +
      sub +
      "</span></div></div>"
    );
  }

  function miniTimeline(items) {
    let html = '<div class="viz-tl">';
    items.forEach((it, i) => {
      html +=
        '<div class="viz-tl__i">' +
        (i < items.length - 1 ? '<span class="viz-tl__line"></span>' : "") +
        "<strong>" +
        it.d +
        "</strong><p>" +
        it.t +
        "</p></div>";
    });
    html += "</div>";
    return html;
  }

  function statGrid(cells, extraClass) {
    const cls = "viz-stat-grid" + (extraClass ? " " + extraClass : "");
    return (
      '<div class="' + cls + '">' +
      cells
        .map(
          (c) =>
            '<div class="viz-stat-cell"><span class="viz-stat-cell__v">' +
            c.v +
            '</span><span class="viz-stat-cell__l">' +
            c.l +
            "</span></div>"
        )
        .join("") +
      "</div>"
    );
  }

  function compareTwo(left, right) {
    return (
      '<div class="viz-compare">' +
      '<div class="viz-compare__side"><h4>Антисептика</h4><p>' +
      left +
      "</p></div>" +
      '<div class="viz-compare__mid">↔</div>' +
      '<div class="viz-compare__side viz-compare__side--red"><h4>Асептика</h4><p>' +
      right +
      "</p></div></div>"
    );
  }

  global.Viz = {
    barRow,
    donut,
    flowStep,
    miniTimeline,
    statGrid,
    compareTwo,
    colors: { RED, RED_D, GRAY, TEXT },
  };
})(typeof window !== "undefined" ? window : globalThis);
