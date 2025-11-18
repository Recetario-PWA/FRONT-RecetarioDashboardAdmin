import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecoveryAccount } from './recovery-account';

describe('RecoveryAccount', () => {
  let component: RecoveryAccount;
  let fixture: ComponentFixture<RecoveryAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoveryAccount]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecoveryAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
