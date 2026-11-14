// Minimal Leaflet stand-in for tests: enough for the app's map code and a simulated tap.
(function () {
  function Evented() { this._h = {}; }
  Evented.prototype.on = function (n, f) { (this._h[n] = this._h[n] || []).push(f); return this; };
  Evented.prototype.fire = function (n, e) { (this._h[n] || []).forEach((f) => f(e || {})); return this; };
  const L = {};
  L.map = function (id) { const m = new Evented(); m.el = document.getElementById(id); m.el.style.background = '#cfe3e8';
    m.setView = (c, z) => { m._view = { c, z }; window.__views = (window.__views || []).concat([{ c, z }]); return m; }; m.getZoom = () => (m._view ? m._view.z : 14); m.project = (ll, z) => ({ x: ll[1] * Math.pow(2, z) * 0.711, y: -ll[0] * Math.pow(2, z) * 0.85 }); m.invalidateSize = () => m; m.fitBounds = () => { m._view = { c: m._view ? m._view.c : null, z: 13 }; m.fire('zoomend'); return m; }; m.getCenter = () => { const c = m._view ? m._view.c : [34.0105, -118.497]; return Array.isArray(c) ? { lat: c[0], lng: c[1] } : c; };
    m.getBounds = () => { const c = m._view ? m._view.c : [47.15, -122.66]; const z = m._view ? m._view.z : 12; const d = 180 / Math.pow(2, z) * 2; const la = Array.isArray(c) ? c[0] : c.lat; const lo = Array.isArray(c) ? c[1] : c.lng; return { getSouth: () => la - d, getNorth: () => la + d, getWest: () => lo - d, getEast: () => lo + d }; };
    m.hasLayer = (l) => m._wms === l; m.removeLayer = (l) => { if (m._wms === l) m._wms = null; return m; };
    m.closePopup = () => { if (m._pop) { m._pop.remove(); m._pop = null; } return m; };
    window.__map = m; return m; };
  const addable = () => ({ addTo() { return this; }, bindPopup() { return this; }, clearLayers() { return this; }, on() { return this; } });
  L.control = { zoom: () => addable() }; L.tileLayer = () => addable(); L.layerGroup = () => { const g = addable(); g.clearLayers = () => { g._n = 0; return g; }; return g; };
  L.tileLayer.wms = (u, o) => { window.__wms = (window.__wms || 0) + 1; const t = addable(); t.addTo = (m) => { m._wms = t; return t; }; return t; };
  L.polyline = (pts, o) => { window.__lines = (window.__lines || []).concat([{ n: pts.length, o }]); return addable(); };
  L.marker = (c, o) => { const rec = { c, html: o && o.icon && o.icon.html }; window.__markers = (window.__markers || []).concat([rec]); const m = addable(); m.bindPopup = (h) => { rec.pop = h; return m; }; return m; }; L.circle = (c, o) => { window.__circles = (window.__circles || []).concat([{ c, o }]); return addable(); }; L.circleMarker = (c, o) => { window.__dots = (window.__dots || []).concat([{ c, o }]); return addable(); }; L.divIcon = (o) => o;
  L.popup = () => { const p = { setLatLng() { return p; }, setContent(h) { p.h = h; return p; },
    openOn(m) { m.closePopup(); const d = document.createElement('div'); d.className = 'leaflet-popup-content pop-test'; d.style.cssText = 'position:absolute;left:40px;top:120px;z-index:1001;background:#fff;padding:10px;border-radius:10px';
      d.innerHTML = p.h; m.el.appendChild(d); m._pop = d; m.fire('popupopen', { popup: { getElement: () => d } }); return p; } }; return p; };
  L.DomEvent = { disableClickPropagation() {}, disableScrollPropagation() {} };
  window.L = L;
})();
