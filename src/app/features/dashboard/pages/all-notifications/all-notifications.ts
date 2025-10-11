import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-all-notifications',
  imports: [CommonModule, RouterModule],
  templateUrl: './all-notifications.html',
  styleUrl: './all-notifications.css',
  standalone: true,
})
export class AllNotifications {

  constructor() {}

  ngOnInit(): void {}
}
