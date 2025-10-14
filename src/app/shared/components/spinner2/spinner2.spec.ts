import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Spinner2 } from './spinner2';

describe('Spinner2', () => {
  let component: Spinner2;
  let fixture: ComponentFixture<Spinner2>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Spinner2]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Spinner2);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
