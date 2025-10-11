import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RoleRequest } from './role-request';

describe('RoleRequest', () => {
  let component: RoleRequest;
  let fixture: ComponentFixture<RoleRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RoleRequest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
