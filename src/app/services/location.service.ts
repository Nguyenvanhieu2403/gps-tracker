import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  api = 'http://localhost:5000/api/location';

  constructor(private http: HttpClient) {}

  send(lat: number, lng: number) {
    return this.http.post(this.api, {
      latitude: lat,
      longitude: lng
    });
  }

  getAll() {
    return this.http.get<any[]>(this.api);
  }
}