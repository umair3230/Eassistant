import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionPopUpComponent } from './extension-pop-up.component';

describe('ExtensionPopUpComponent', () => {
  let component: ExtensionPopUpComponent;
  let fixture: ComponentFixture<ExtensionPopUpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtensionPopUpComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionPopUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
