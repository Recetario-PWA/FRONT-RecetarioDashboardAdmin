import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UsersService } from '../../../../core/services/users';
import Swal from 'sweetalert2';
import { roleRequest } from '../../../../core/stores/users.store';
import { take, timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { Spinner } from '../../../../shared/components/spinner/spinner';

@Component({
  selector: 'app-role-request',
  imports: [CommonModule, RouterModule, Spinner],
  templateUrl: './role-request.html',
  styleUrl: './role-request.css',
  standalone: true,
})
export class RoleRequest {
  requests = computed(() => roleRequest());
  sendingRequest = signal(false);
  loading = signal(true);

  // ICONOS
  icons: Record<string, string> = {
    'femenino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarF.png',
    'masculino': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarM.png',
    '39 tipos de gays': 'https://recetariopwa.sfo3.digitaloceanspaces.com/icons/avatarG.png'
  }

  //FILTROS
  searchBar = signal('');
  dateStart = signal<string>('');
  dateEnd = signal<string>('');
  statusFilter = signal<string>('');
  activeDateRange = signal<{ start: string; end: string }>({ start: '', end: '' });

  filteredRequest = computed(() => {
    const normalize = (str: string) =>
      str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const text = normalize(this.searchBar().trim());
    const { start, end } = this.activeDateRange();
    const allRequest = this.requests() as any[];

    let filtered = !text
      ? allRequest
      : allRequest.filter(request =>
          normalize(request.user.name).includes(text) ||
          normalize(request.user.user_name).includes(text) ||
          normalize(request.user.last_name).includes(text)
        );

    const getCorrectedDate = (dateInput: any) => {
      if (!dateInput) return null;

      const d = new Date(dateInput);
      
      d.setHours(d.getHours() + 12);
      
      d.setHours(0, 0, 0, 0); 
      
      return d;
    };

    if (start || end) {
      const startDate = getCorrectedDate(start);
      let endDate = getCorrectedDate(end);
      
      if (endDate) {
          endDate.setDate(endDate.getDate() + 1);
      }
      
      filtered = filtered.filter(request => {
          const requestDate = new Date(request.created_at);

          const startTime = startDate ? startDate.getTime() : -Infinity;
          const endTime = endDate ? endDate.getTime() : Infinity;

          return requestDate.getTime() >= startTime && requestDate.getTime() < endTime;
      });
    }

    const filterByStatus = this.statusFilter();
    if (filterByStatus) {
      filtered = filtered.filter(request => request.status === filterByStatus);
    }

    return filtered;
  });

  applyDateFilter() {
    const start = this.dateStart();
    const end = this.dateEnd();

    if (start && end && new Date(end) < new Date(start)) {
      Swal.fire({
        icon: 'error',
        title: 'Rango de fechas inválido',
        text: 'La fecha "Hasta" no puede ser anterior a la fecha "Desde".',
        confirmButtonColor: '#a2aadb'
      });
      return;
    }

    this.activeDateRange.set({ start, end });
  }

  clearFilters() {
    this.searchBar.set('');
    this.dateStart.set('');
    this.dateEnd.set('');
    this.statusFilter.set('');
    this.activeDateRange.set({ start: '', end: '' });
  }

  // PAGINACION
  p = signal(1);
  perPage = 5;  

  paginatedRecipes = computed(() => {
    const start = (this.p() - 1) * this.perPage;
    return this.filteredRequest().slice(start, start + this.perPage);
  });

  totalPages = computed(() => 
    Math.ceil(this.filteredRequest().length / this.perPage)
  );

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.p.set(page);
    }
  }

  startIndex = computed(() => {
    const total = this.filteredRequest().length;
    if (total === 0) return 0;
    return (this.p() - 1) * this.perPage + 1;
  });

  endIndex = computed(() => {
    const total = this.filteredRequest().length;
    if (total === 0) return 0;
    const end = this.p() * this.perPage;
    return end > total ? total : end;
  });

  constructor(private userService: UsersService) {}

  ngOnInit() {
    this.getAllRequest();
  }

  acceptRequest(id: any) {
   this.changeRole(id, true);
  }

  rejectRequest(id: any) {
    this.changeRole(id, false);
  }

  getAllRequest() {
    this.userService.getAllRolRequest().pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          roleRequest.set(response.data);
        } else {
          roleRequest.set(null);
        }
        this.loading.set(false);
      },
      error: (error) => {
        roleRequest.set(null);
        this.loading.set(false);
        console.log(error);
      }
    });
  }

  changeRole(id: any, approvalStatus: boolean) {
    this.sendingRequest.set(true);
    this.userService.updateRole(id, approvalStatus).pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          this.getAllRequest();
        } else {
          this.getAllRequest();
        }
        this.sendingRequest.set(false);
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        console.log(error);
        this.sendingRequest.set(false);
      }
    });
  }

  getIcon(gender?: string): string {
    const genderKey = gender?.toLowerCase() ?? 'default';
    return this.icons[genderKey] ?? 'https://ionicframework.com/docs/img/demos/avatar.svg';
  }
}
