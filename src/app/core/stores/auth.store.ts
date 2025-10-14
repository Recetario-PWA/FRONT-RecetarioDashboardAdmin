import { computed, signal } from "@angular/core";

export const currentUser = signal<any | null>(null);

export const userInfoLoading = signal<boolean>(false);

export const notificationsAdmin = signal<any>([]);

export const unreadNotifications = signal<any>([]);
export const hasUnreadNotifications = signal<any>(null);

export const notificationsLoading = signal<boolean>(false);

export const codeEmail = signal<string | null>(null);