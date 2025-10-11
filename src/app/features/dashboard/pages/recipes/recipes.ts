import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, RouterModule],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
  standalone: true,
})
export class Recipes {
  isModalOpen: boolean = false;
  selectedRecipeId: number | null = null;
  
  constructor() {}

  ngOnInit() {}

  openModal(recipeId: number): void {
    this.selectedRecipeId = recipeId;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedRecipeId = null;
  }

  approveRecipe(): void {
    console.log(`Aprobando receta con ID: ${this.selectedRecipeId}`);
    this.closeModal();
  }

  confirmDeleteRecipe() {
    Swal.fire({
      title: "¿Estas seguro de eliminar esta receta?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a2aadb",
      cancelButtonColor: "#a53f3f",
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
         console.log("Receta eliminada");
      }
    });
  }
}
