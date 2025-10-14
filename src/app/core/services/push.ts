import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare var PusherPushNotifications: any;

@Injectable({
  providedIn: 'root'
})
export class PushService {
  private beamsClient: any;

  constructor() {}

  private loadBeamsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).PusherPushNotifications) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js.pusher.com/beams/2.1.0/push-notifications-cdn.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  public async init(userId: string) {
    try {
      await this.loadBeamsScript();

      const Beams = (window as any).PusherPushNotifications;
      if (!Beams) {
        console.error('⚠️ PusherPushNotifications no está definido en window');
        return;
      }

      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
      }

      this.beamsClient = new Beams.Client({
        instanceId: environment.pusher.instanceId
      });

      await this.beamsClient.start();
      await this.beamsClient.addDeviceInterest(`admin-${userId}`);

      //console.log('✅ Beams inicializado y suscrito al usuario', userId);

    } catch (error) {
      console.error('❌ Error inicializando Beams:', error);
    }
  }
}
