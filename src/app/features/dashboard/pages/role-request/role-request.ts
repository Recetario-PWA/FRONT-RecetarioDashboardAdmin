import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-role-request',
  imports: [CommonModule, RouterModule],
  templateUrl: './role-request.html',
  styleUrl: './role-request.css',
  standalone: true,
})
export class RoleRequest {

  constructor() {}

  ngOnInit() {}

  acceptRequest() {
    console.log("Solicitud aceptada");
  }

  rejectRequest() {
    console.log("Solicitud rechazada");
  }
}
