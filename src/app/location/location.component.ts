import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { TrackingService } from '../services/tracking.service';

@Component({
  selector: 'app-location',
  standalone: true,
  templateUrl: './location.component.html'
})
export class LocationComponent implements OnInit {

  map: any;
  users: any = {};
  fakeUser: any = null;
  fakeStep = 0;

  constructor(private trackingService: TrackingService) {}

  ngOnInit() {
    // this.initMap();

    // // 🔴 realtime nhận data từ server
    // this.trackingService.startConnection();

    // this.trackingService.onReceive((loc: any) => {
    //   this.updateUser(loc);
    // });

    // // 📍 gửi GPS lên server
    // this.startTracking();

    this.initMap();

  this.trackingService.startConnection();

  this.trackingService.onReceive((loc: any) => {
    this.updateUser(loc);
  });

  // 🔥 THÊM DÒNG NÀY
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

  // 🧱 init user nếu chưa có
  if (!this.users[id]) {
    this.users[id] = {
      path: [] as [number, number][],
      marker: null as L.Marker | null,
      polyline: null as L.Polyline | null
    };
  }

  const user = this.users[id];

  const point: [number, number] = [loc.latitude, loc.longitude];

  // 📌 thêm điểm vào path
  user.path.push(point);

  // 🎯 marker icon theo user
  const icon = L.icon({
    iconUrl:
      id === 'fake-user'
        ? 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
        : 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

  // 🟢 tạo marker 1 lần
  if (!user.marker) {
    user.marker = L.marker(point, { icon }).addTo(this.map);
  } else {
    user.marker.setLatLng(point);
  }

  // 🔴 vẽ đường đi
  if (!user.polyline) {
    user.polyline = L.polyline(user.path, {
      color: id === 'fake-user' ? 'red' : 'blue',
      weight: 4
    }).addTo(this.map);
  } else {
    user.polyline.setLatLngs(user.path);
  }

  // 🎥 (optional) auto focus theo user thật
  if (id === 'real-user') {
    this.map.panTo(point);
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
            userId: 'user1',
            latitude: lat,
            longitude: lng
          })
        });
      });
    }, 5000);
  }

  deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

rad2deg(rad: number) {
  return rad * (180 / Math.PI);
}

  generateFakePoint(lat: number, lng: number) {
  const distance = 10; // km
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

// startFakeMovement(realLat: number, realLng: number) {
//   if (!this.fakeUser) {
//     const start = this.generateFakePoint(realLat, realLng);

//     this.fakeUser = {
//       start,
//       current: start,
//       target: { lat: realLat, lng: realLng }
//     };
//   }

//   setInterval(() => {
//     this.fakeStep += 0.05;

//     if (this.fakeStep > 1) this.fakeStep = 1;

//     const pos = this.interpolate(
//       this.fakeUser.start,
//       this.fakeUser.target,
//       this.fakeStep
//     );

//     // gửi lên server như user thật
//     fetch('http://localhost:5000/api/location', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         userId: 'fake-user',
//         latitude: pos.lat,
//         longitude: pos.lng
//       })
//     });

//   }, 5000);
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

    // 🚀 fake user
    this.startFakeMovement(lat, lng);
  });
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

async startFakeMovement(realLat: number, realLng: number) {

  if (!this.fakeUser) {
    const start = this.generateFakePoint(realLat, realLng);

    // 🚀 lấy route thật
    const routeCoords = await this.getRoute(start, { lat: realLat, lng: realLng });

    const path = this.convertToLatLngs(routeCoords);

    this.fakeUser = {
      path,
      index: 0
    };
  }

  setInterval(() => {
    if (!this.fakeUser || this.fakeUser.index >= this.fakeUser.path.length) return;

    const point = this.fakeUser.path[this.fakeUser.index];
    this.fakeUser.index++;

    fetch('http://localhost:5000/api/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'fake-user',
        latitude: point[0],
        longitude: point[1]
      })
    });

  }, 500); // 1s cho mượt như xe chạy
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
}