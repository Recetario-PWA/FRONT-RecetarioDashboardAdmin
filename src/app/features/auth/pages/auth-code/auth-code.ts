import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-auth-code',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auth-code.html',
  styleUrl: './auth-code.css',
  standalone: true,
})
export class AuthCode {
  code: string[] = ['', '', '', '', '']; 
  codeDigits = Array(5).fill(0);
  @ViewChildren('inputField') inputFields!: QueryList<ElementRef>; 

  constructor() {}

  ngOnInit(): void {}

  onInputChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    if (value.length > 1) {
      value = value.charAt(0);
    }
    
    input.value = value;
    this.code[index] = value;
    
    if (value && index < this.code.length - 1) {
      this.focusNextInput(index);
    }
  }

  onBackspace(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.value && index > 0) {
      this.focusPrevInput(index);
    } else if (input.value) {
        this.code[index] = '';
    }
  
  }

  private focusNextInput(currentIndex: number): void {
    const nextInput = this.inputFields.get(currentIndex + 1);
    if (nextInput) {
      nextInput.nativeElement.focus();
    }
  }

  private focusPrevInput(currentIndex: number): void {
    const prevInput = this.inputFields.get(currentIndex - 1);
    if (prevInput) {
      prevInput.nativeElement.focus();
    }
  }

  onSubmit(): void {
    const fullCode = this.code.join('');
    
    if (fullCode.length === this.code.length) {
      console.log('Código completo para verificar:', fullCode);
    } else {
      console.error('El código está incompleto.');
    }
  }
}
