import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class SocketServerService {
  private url = 'https://louderyoutube.video:3004';
  socket;
  constructor() {
    this.socket = io(this.url, {
      query: "who=" + localStorage.getItem("who")
    });
  }
  public sendMessage(event, msg) {
    this.socket.emit(event, msg);
  }
  public getMessages = (event) => {
    return Observable.create((observer) => {
      this.socket.on(event, (message) => {
        observer.next(message);
      });
    });
  }
}

