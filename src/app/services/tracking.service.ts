import * as signalR from '@microsoft/signalr';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TrackingService {

  private hubConnection!: signalR.HubConnection;

  startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('https://localhost:7087/trackingHub')
      .build();

    this.hubConnection.start();
  }

  onReceive(callback: any) {
    this.hubConnection.on('ReceiveLocation', callback);
  }
}