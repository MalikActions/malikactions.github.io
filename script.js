async function loadData() {
  const response = await fetch('lørdag.json');
  return await response.json();
}

const map = L.map('map', {
  minZoom: 11,
  maxZoom: 17,
  maxBounds: [[55.55, 12.30],[55.78, 12.75]],
  maxBoundsViscosity: 1.0
}).setView([55.68, 12.54], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

const runderingFarver = {
  B1: {0: "blue", 1: "deepskyblue", 2: "dodgerblue"},
  B2: {0: "red", 1: "crimson", 2: "orangered"},
  B3: {0: "green", 1: "forestgreen", 2: "limegreen"}
};

const bounds = L.latLngBounds();
const markers = [];
const bMarkers = { b_1: [], b_2: [], b_3: [] };

const b_1_times = ["19:00–07:00","19:00–24:00","19:00–23:00","19:00–19:15","19:15–20:00","21:00","21:00–00:00","22:00","22:00–01:00","22:00–04:00","23:00"];
const b_2_times = ["23:00–02:00","00:00–02:00","00:00–03:00","01:00–03:00","01:00–03:15"];
const b_3_times = ["02:00–06:00","01:30","03:00","05:00","05:30","06:00"];

let activeRundering = null;
let activeBSection = null;

loadData().then(vagterData => {
  for (const [shift, locations] of Object.entries(vagterData)) {
    locations.forEach(loc => {
      const runderingType = loc.rundering[0];
      const markerColor = runderingFarver[shift][runderingType];

      const popupContent = `
        <b>${shift}</b><br>
        ${loc.adresse}<br>
        <b>Rundering:</b> ${runderingType}<br>
        <b>Tid:</b> ${loc.tid}<br>
        <b>Bemærkning:</b> ${loc.bemærkning || '-'}
      `;

      const marker = L.circleMarker(loc.koordinater, {
        color: markerColor,
        radius: 6,
        fillOpacity: 0.8,
        rundering: runderingType,
        visible: true
      }).addTo(map);

      marker.bindPopup(popupContent);
      marker.on('mouseover', function(){ this.openPopup(); });
      marker.on('mouseout', function(){ this.closePopup(); });

      markers.push(marker);
      bounds.extend(loc.koordinater);

      if (b_1_times.includes(loc.tid)) bMarkers.b_1.push(marker);
      if (b_2_times.includes(loc.tid)) bMarkers.b_2.push(marker);
      if (b_3_times.includes(loc.tid)) bMarkers.b_3.push(marker);
    });
  }

  if (bounds.isValid()) map.fitBounds(bounds, { padding: [30,30] });
});

function showAllMarkers() {
  markers.forEach(marker => {
    if (!marker.options.visible) {
      marker.addTo(map);
      marker.options.visible = true;
    }
  });
  activeRundering = null;
  activeBSection = null;
  document.querySelectorAll('.filter-buttons button').forEach(b => b.classList.remove('active'));
}

function toggleRundering(type, btn) {
  if (activeRundering === type) { showAllMarkers(); return; }

  document.querySelectorAll('.filter-buttons button').forEach(b => {
    if(b.onclick.toString().includes("toggleRundering")) b.classList.remove('active');
  });

  markers.forEach(marker => marker.remove());
  markers.forEach(marker => marker.options.visible = false);

  markers.forEach(marker => {
    if (marker.options.rundering === type) {
      marker.addTo(map);
      marker.options.visible = true;
    }
  });

  btn.classList.add('active');
  activeRundering = type;
  activeBSection = null;
}

function toggleBSection(section, btn) {
  if (activeBSection === section) { showAllMarkers(); return; }

  document.querySelectorAll('.filter-buttons button').forEach(b => {
    if(b.onclick.toString().includes("toggleBSection")) b.classList.remove('active');
  });

  Object.values(bMarkers).flat().forEach(marker => marker.remove());
  Object.values(bMarkers).flat().forEach(marker => marker.options.visible = false);

  bMarkers[section].forEach(marker => {
    marker.addTo(map);
    marker.options.visible = true;
  });

  btn.classList.add('active');
  activeBSection = section;
  activeRundering = null;
}