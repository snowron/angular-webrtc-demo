import { Component, ViewChild } from '@angular/core';
import { SocketServerService } from "./socket-server.service";
declare let RTCPeerConnection: any;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @ViewChild("video1", { static: true }) video1: any;
  @ViewChild("video2", { static: true }) video2: any;
  clientID = localStorage.getItem("who")
  clientNick: String; room: String = ""
  iceServersAll = {
    iceServers: [{ urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" }]
  }
  title = 'angular-webrtc-kurento';
  peerArray = []
  users = []
  arr = []

  generateID() {
    return Math.floor(Math.random() * 100000000)
  }
  constructor(private socket: SocketServerService) {
    if (!localStorage.getItem("who")) {
      let id = this.generateID()
      localStorage.setItem("who", id + "")
      this.clientID = id + ""
    }
  }
  ngOnInit() {
    this.getMessages()
    this.getICE()
  }
  getMessages() {
    this.socket.getMessages("answerSomeone").subscribe(async (res) => {
      if (res.sdp.type == "offer") {
        this.users.push(res)
        let pc = await new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.services.mozilla.com" },
            { urls: "stun:stun.l.google.com:19302" }
          ]
        });

        pc = await this.initalize(pc)
        await pc.setRemoteDescription(new RTCSessionDescription({ type: "offer", sdp: res.sdp.sdp }))
          .then(() =>
            pc.createAnswer({
              OfferToReceiveAudio: true,
              OfferToReceiveVideo: true
            })
          )
          .then(answer => pc.setLocalDescription(answer))
          .then(async () => {
            this.socket.sendMessage("answerSomeone", {
              who: localStorage.getItem("who"), sdp: pc.localDescription, toUser: res.who
            })
          })

        setInterval(() => {
          for (let a of this.arr) {
            pc.addIceCandidate(new RTCIceCandidate(a)).catch((e) => console.log(e))
          }
          console.log('pc', pc)
        }, 1000)
        this.peerArray.push(pc)
      } else if (res.sdp.type == "answer") {
        this.peerArray[0].setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: res.sdp.sdp }))
        setInterval(() => {
          for (let a of this.arr) {
            this.peerArray[0].addIceCandidate(new RTCIceCandidate(a)).catch((e) => console.log(e))
          }
        }, 1000)
      }
    })
  }
  getICE() {
    this.socket.getMessages("ice").subscribe((res) => {
      console.log('asdasdasdasdkapsd',)
      // pc.addIceCandidate(new RTCIceCandidate(res.ice)).catch((e) => console.log(e))
      this.arr.push(res.ice)
    })
  }
  async callSomeone(data?) {
    let pc = await new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.services.mozilla.com" },
        { urls: "stun:stun.l.google.com:19302" }
      ]
    });
    pc = await this.initalize(pc)
    await pc.createOffer({
      OfferToReceiveAudio: true,
      OfferToReceiveVideo: true
    })
      .then(offer => pc.setLocalDescription(offer))
      .then(() => {
        this.socket.sendMessage("callSomeone", {
          who: localStorage.getItem("who"), sdp: pc.localDescription, toUser: this.room
        })
      })
    setInterval(() => {

      console.log('pc', pc)
    }, 1000)
    this.peerArray.push(pc)
  }

  async initalize(pc) {
    var constraints = {
      audio: false, video: true, mandatory: {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      }
    };

    await navigator.mediaDevices.getUserMedia(constraints)
      .then((mediaStream) => {
        pc.addStream(mediaStream);

        var video = this.video1.nativeElement
        video.srcObject = mediaStream;
        video.onloadedmetadata = function (e) {
          video.play();
        };
      })
      .catch(function (err) { console.log(err.name + ": " + err.message); });
    pc.onicecandidate = eventICE => {
      if (eventICE.candidate) {
        console.log('event.candidate', eventICE.candidate)
        let wow = JSON.stringify(eventICE.candidate)
        this.socket.sendMessage("ice", {
          who: localStorage.getItem("who"), ice: JSON.parse(wow),
          toUser: this.room.length > 0 ? this.room : this.users[0].who
        })
      } else {
        console.log("Sent All Ice");
      }

    }

    pc.ontrack = event => {
      let vi2 = this.video2.nativeElement
      vi2.srcObject = event.streams[0]
      console.log('event', event)
    };

    return pc;

  }
}
