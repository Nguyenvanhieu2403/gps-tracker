import { Component, OnInit } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import * as L from 'leaflet';
import { TrackingService } from '../services/tracking.service';

@Component({
  selector: 'app-location-v2',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './location_v2.component.html'
})
export class LocationV2Component implements OnInit {

  map: any;
  users: any = {};
  fakeUser: any = null;
  fakeStep = 0;
  lastFitTime = 0;
  objectKeys = Object.keys;

  constructor(private trackingService: TrackingService) {}

  ngOnInit() {
  this.initMap();

  this.trackingService.startConnection();

  this.trackingService.onReceive((loc: any) => {
    this.updateUser(loc);
  });

  this.getLocation();

  this.startTracking();
}

  // 🗺️ init map
  initMap() {
    this.map = L.map('map').setView([21.0285, 105.8542], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);
  }

  // 📡 nhận realtime → vẽ map
  updateUser(loc: any) {
  const id = loc.userId;

  if (!this.users[id]) {
    this.users[id] = {
      path: [] as [number, number][],
      marker: null as L.Marker | null,
      polyline: null as L.Polyline | null,
      lastTime: Date.now(),
      speed: 0
    };
  }

  const user = this.users[id];
  const point: [number, number] = [loc.latitude, loc.longitude];

  // 👉 tính speed
  if (user.path.length > 0) {
    const prev = user.path[user.path.length - 1];

    const dist = this.calculateDistance(prev, point); // km
    const time = (Date.now() - user.lastTime) / 1000 / 3600; // giờ

    user.speed = dist / (time || 1);
  }

  user.lastTime = Date.now();

  user.path.push(point);

  let angle = 0;

if (user.path.length > 1) {
  const prev = user.path[user.path.length - 2];
  angle = this.getAngle(prev, point);
}

const icon = this.getCarIcon(angle);

if (!user.marker) {
  user.marker = L.marker(point, { icon }).addTo(this.map);
} else {
  user.marker.setLatLng(point);
  user.marker.setIcon(icon);
}

  // 👉 tooltip speed
  user.marker.bindTooltip(
  `${id}<br>${user.speed.toFixed(1)} km/h`,
  { permanent: false }
);

  if (!user.polyline) {
    user.polyline = L.polyline(user.path, {
      color: id === 'fake-user' ? 'red' : 'blue',
      weight: 4
    }).addTo(this.map);
  } else {
    user.polyline.setLatLngs(user.path);
  }


  const now = Date.now();

if (now - this.lastFitTime > 3000) { // 3s mới zoom 1 lần
  const allPoints = Object.values(this.users)
    .map((u: any) => u.path.slice(-1)[0])
    .filter(Boolean);

  if (allPoints.length > 1) {
    this.map.fitBounds(allPoints, { padding: [50, 50] });
    this.lastFitTime = now;
  }
}
}

  // 📍 gửi GPS mỗi 5s
  startTracking() {
  setInterval(() => {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      fetch('http://localhost:5000/api/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'real-user', // 🔥 FIX
          latitude: lat,
          longitude: lng
        })
      });
    });
  }, 5000);
}

  // 📍 focus vào xe khi click card
  focusVehicle(id: string) {
    const user = this.users[id];
    if (!user || user.path.length === 0) return;
    const point = user.path[user.path.length - 1];
    this.map.setView(point, 16, { animate: true });
  }

  deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

rad2deg(rad: number) {
  return rad * (180 / Math.PI);
}

  generateFakePoint(lat: number, lng: number) {
  const distance = 5; // km
  const bearing = Math.random() * 360;

  const R = 6371;

  const lat1 = this.deg2rad(lat);
  const lng1 = this.deg2rad(lng);
  const brng = this.deg2rad(bearing);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distance / R) +
    Math.cos(lat1) * Math.sin(distance / R) * Math.cos(brng)
  );

  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(distance / R) * Math.cos(lat1),
      Math.cos(distance / R) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: this.rad2deg(lat2),
    lng: this.rad2deg(lng2)
  };
}

interpolate(start: any, end: any, t: number) {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t
  };
}

fakeInterval: any;

// async startFakeMovement(realLat: number, realLng: number) {

//   if (this.fakeInterval) return; // 🔥 tránh tạo nhiều lần

//   const start = this.generateFakePoint(realLat, realLng);

//   const routeCoords = await this.getRoute(start, {
//     lat: realLat,
//     lng: realLng
//   });

//   const path = this.convertToLatLngs(routeCoords);

//   let index = 0;

//   this.fakeInterval = setInterval(() => {
//     if (index >= path.length) return;

//     const point = path[index];
//     index++;

//     fetch('http://localhost:5000/api/location', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         userId: 'fake-user',
//         latitude: point[0],
//         longitude: point[1]
//       })
//     });

//   }, 800); // mượt hơn 500
// }

getLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    // user thật
    fetch('http://localhost:5000/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'real-user',
        latitude: lat,
        longitude: lng
      })
    });

    // 🚀 fake users
    this.startMultipleFake(lat, lng);
  });
}

startMultipleFake(realLat: number, realLng: number) {
  for (let i = 0; i < 10; i++) {
    this.startFakeMovement(realLat, realLng, `car-${i}`);
  }
}

async getRoute(start: any, end: any) {
  const url = `https://router.project-osrm.org/route/v1/driving/`
    + `${start.lng},${start.lat};${end.lng},${end.lat}`
    + `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  const data = await res.json();

  return data.routes[0].geometry.coordinates;
}

convertToLatLngs(coords: any[]) {
  return coords.map(c => [c[1], c[0]] as [number, number]);
}

getDistanceRealToFake() {
  const real = this.users['real-user']?.path.slice(-1)[0];
  const fake = this.users['fake-user']?.path.slice(-1)[0];

  if (!real || !fake) return 0;

  return this.calculateDistance(real, fake);
}

calculateDistance(a: [number, number], b: [number, number]) {
  const R = 6371; // km
  const dLat = this.deg2rad(b[0] - a[0]);
  const dLng = this.deg2rad(b[1] - a[1]);

  const lat1 = this.deg2rad(a[0]);
  const lat2 = this.deg2rad(b[0]);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

getCarIcon(angle: number) {
  return L.divIcon({
    html: `<img src="https://cdn-icons-png.flaticon.com/512/743/743922.png"
            style="width:30px; transform: rotate(${angle}deg);" />`,
    className: ''
  });
}

getAngle(a: [number, number], b: [number, number]) {
  const dy = b[0] - a[0];
  const dx = b[1] - a[1];
  return Math.atan2(dy, dx) * 180 / Math.PI;
}

async startFakeMovement(realLat: number, realLng: number, userId: string) {

  const start = this.generateFakePoint(realLat, realLng);

  const routeCoords = await this.getRoute(start, {
    lat: realLat,
    lng: realLng
  });

  const path = this.convertToLatLngs(routeCoords);

  let index = 0;

  const move = () => {
    if (index >= path.length) return;

    const point = path[index];
    index++;

    // 🚦 random delay (tốc độ xe)
    let delay = Math.random() * 1000 + 500;

    // 🛑 dừng đèn đỏ
    if (Math.random() < 0.1) delay += 3000;

    fetch('http://localhost:5000/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        latitude: point[0],
        longitude: point[1]
      })
    });

    setTimeout(move, delay);
  };

  move();
}
}