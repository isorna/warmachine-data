import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactionFormComponent } from './faction-form.component';

describe('FactionFormComponent', () => {
  let component: FactionFormComponent;
  let fixture: ComponentFixture<FactionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
