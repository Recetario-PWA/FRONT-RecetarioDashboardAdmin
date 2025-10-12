import { CommonModule } from '@angular/common';
import { Component, Input} from '@angular/core';
import { AbstractControl } from '@angular/forms';

@Component({
  selector: 'app-error-messages',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './error-messages.component.html',
  styleUrl: './error-messages.component.css'
})
export class ErrorMessagesComponent {
  @Input() control!: AbstractControl | null;
  @Input() label: string = '';
  @Input() version: 'm' | 'f' = 'm';
  @Input() unidad: string = '';

  shouldShowError(): boolean {
    return !!this.control && this.control.invalid && (this.control.dirty || this.control.touched);
  }

  getFirstError(): string | null {
    if (!this.control || !this.control.errors) return null;

    const e = this.control.errors;

    if (e['required']) {
      const generoTxt = this.version === 'f' ? 'obligatoria' : 'obligatorio';
      return `${this.label} es ${generoTxt}`;
    }
    if (e['email']) return `Formato de correo inválido`;
    if (e['pattern']) return `Formato inválido`;
    if (e['minlength']) return `Mínimo ${e['minlength'].requiredLength} caracteres`;
    if (e['maxlength']) return `Máximo ${e['maxlength'].requiredLength} caracteres`;
    if (e['min']) return `Mínimo ${e['min'].min}${this.unidad ? ' ' + this.unidad : ''}`;
    if (e['max']) return `Máximo ${e['max'].max}${this.unidad ? ' ' + this.unidad : ''}`;
    if (e['noMatch']) return `Los campos no coinciden`;
    if (e['minimumAge']) return `Debes ser mayor de ${e['minimumAge'].requiredAge} años`;
    if (e['hourInPast']) return `La hora seleccionada ya pasó`;
    if (e['fileType']) return `El archivo debe ser una imagen JPEG, JPG, PNG o WEBP`;
    if (e['invalidFile']) return `Archivo inválido`;
    if (e['maxSize']) return `El archivo es demasiado grande`;

    return null;
  }
}
