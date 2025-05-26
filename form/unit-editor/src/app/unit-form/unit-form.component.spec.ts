import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Observable, of, throwError } from 'rxjs';

import { UnitFormComponent } from './unit-form.component';
import { UnitDataService } from '../unit-data.service';
import { ValidationService, ValidationResult } from '../validation.service';
import { CommonModule } from '@angular/common';

// Mocks
class MockUnitDataService {
  getUnitData = jasmine.createSpy('getUnitData').and.returnValue(of({}));
  createUnitFile = jasmine.createSpy('createUnitFile').and.returnValue(of(undefined));
  saveUnitData = jasmine.createSpy('saveUnitData').and.returnValue(of(undefined));
  getFactionKeys = jasmine.createSpy('getFactionKeys').and.returnValue(of(['faction1', 'faction2']));
  getArmyKeys = jasmine.createSpy('getArmyKeys').and.returnValue(of(['army1', 'army2']));
  getAdvantageKeys = jasmine.createSpy('getAdvantageKeys').and.returnValue(of(['advantage1', 'advantage2']));
  // listUnitFiles and deleteUnitFile are not directly used by UnitFormComponent
}

class MockValidationService {
  // Default to successful validation, can be overridden in specific tests
  validateUnit = jasmine.createSpy('validateUnit').and.returnValue(of({ success: true, errors: [] } as ValidationResult));
}

describe('UnitFormComponent', () => {
  let component: UnitFormComponent;
  let fixture: ComponentFixture<UnitFormComponent>;
  let mockUnitDataService: MockUnitDataService;
  let mockValidationService: MockValidationService;
  let mockRouter: Router;
  let mockActivatedRoute: any;

  const testUnitData = {
    name: 'Test Unit', type: 'solo', faction: 'faction1',
    advantages: ['advantage1'], armies: ['army1'], keywords: ['keyword1'],
    statistics: { health: 10 }
  };

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({})) // Default to no params (new unit)
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        CommonModule,
        RouterTestingModule.withRoutes([]),
        UnitFormComponent
      ],
      providers: [
        { provide: UnitDataService, useClass: MockUnitDataService },
        { provide: ValidationService, useClass: MockValidationService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnitFormComponent);
    component = fixture.componentInstance;
    mockUnitDataService = TestBed.inject(UnitDataService) as any;
    mockValidationService = TestBed.inject(ValidationService) as any;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate').and.stub();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call UnitDataService key-fetching methods and assign observables', fakeAsync(() => {
      fixture.detectChanges(); // ngOnInit
      tick();

      expect(mockUnitDataService.getFactionKeys).toHaveBeenCalled();
      expect(mockUnitDataService.getArmyKeys).toHaveBeenCalled();
      expect(mockUnitDataService.getAdvantageKeys).toHaveBeenCalled();

      let factions: string[] = [];
      component.availableFactions$.subscribe(f => factions = f);
      tick();
      expect(factions).toEqual(['faction1', 'faction2']);
    }));

    it('should initialize for a new unit, call prepareUnitDataForDisplay', fakeAsync(() => {
      spyOn(component, 'prepareUnitDataForDisplay').and.callThrough();
      mockActivatedRoute.paramMap = of(convertToParamMap({}));
      fixture.detectChanges(); // ngOnInit
      tick();

      expect(component.unitFileName).toBeNull();
      expect(component.unitData.name).toBe('');
      expect(component.isLoading).toBe(false);
      expect(component.prepareUnitDataForDisplay).toHaveBeenCalled();
    }));

    it('should load data for an existing unit and call prepareUnitDataForDisplay', fakeAsync(() => {
      spyOn(component, 'prepareUnitDataForDisplay').and.callThrough();
      mockActivatedRoute.paramMap = of(convertToParamMap({ fileName: 'test.json' }));
      mockUnitDataService.getUnitData.and.returnValue(of({...testUnitData}));

      fixture.detectChanges(); // ngOnInit
      tick();

      expect(component.unitFileName).toBe('test.json');
      expect(mockUnitDataService.getUnitData).toHaveBeenCalledWith('test.json');
      expect(component.unitData.name).toBe('Test Unit');
      expect(component.isLoading).toBe(false);
      expect(component.prepareUnitDataForDisplay).toHaveBeenCalled();
      // Check if display properties are set after prepareUnitDataForDisplay
      expect(component.unitData.advantages_display).toBe('advantage1');
      expect(component.unitData.armies_display).toBe('army1');
    }));
  });

  describe('Helper Methods', () => {
    it('arrayToString should convert array to comma-separated string', () => {
      expect(component['arrayToString'](['a', 'b', 'c'])).toBe('a, b, c');
      expect(component['arrayToString'](['a'])).toBe('a');
      expect(component['arrayToString']([])).toBe('');
      expect(component['arrayToString'](undefined)).toBe('');
    });

    it('stringToArray should convert comma-separated string to array', () => {
      expect(component['stringToArray']('a, b, c')).toEqual(['a', 'b', 'c']);
      expect(component['stringToArray']('a')).toEqual(['a']);
      expect(component['stringToArray']('')).toEqual([]);
      expect(component['stringToArray'](' a , b,c  ')).toEqual(['a', 'b', 'c']); // Trim and filter
      expect(component['stringToArray'](undefined)).toEqual([]);
    });

    it('prepareUnitDataForSave should convert _display strings to arrays', () => {
      component.unitData = { advantages_display: 'adv1, adv2', armies_display: 'army1' };
      component['prepareUnitDataForSave']();
      expect(component.unitData.advantages).toEqual(['adv1', 'adv2']);
      expect(component.unitData.armies).toEqual(['army1']);
    });

    it('prepareUnitDataForDisplay should convert arrays to _display strings', () => {
      component.unitData = { advantages: ['adv1', 'adv2'], armies: ['army1'] };
      component['prepareUnitDataForDisplay']();
      expect(component.unitData.advantages_display).toBe('adv1, adv2');
      expect(component.unitData.armies_display).toBe('army1');
    });
  });

  describe('saveUnit', () => {
    beforeEach(fakeAsync(() => {
      // Ensure ngOnInit runs and initializes data for tests that need it
      mockActivatedRoute.paramMap = of(convertToParamMap({})); // Default to new unit
      fixture.detectChanges();
      tick();
      // Reset spies before each saveUnit test
      mockValidationService.validateUnit.calls.reset();
      mockUnitDataService.createUnitFile.calls.reset();
      mockUnitDataService.saveUnitData.calls.reset();
      mockRouter.navigate.calls.reset();
      spyOn(component, 'prepareUnitDataForSave').and.callThrough();
      spyOn(component, 'prepareUnitDataForDisplay').and.callThrough();
    }));

    it('should call prepareUnitDataForSave, then validate, then create new unit on success', fakeAsync(() => {
      component.unitFileName = null; // New unit
      component.unitData = { name: 'New Save Unit', type: 'solo', faction: 'faction1', advantages_display: 'adv1', armies_display: 'army1' };
      mockValidationService.validateUnit.and.returnValue(of({ success: true, errors: [] }));

      component.saveUnit();
      tick(); // For validateUnit observable and subsequent service calls

      expect(component['prepareUnitDataForSave']).toHaveBeenCalledBefore(mockValidationService.validateUnit);
      expect(mockValidationService.validateUnit).toHaveBeenCalledWith(jasmine.objectContaining({advantages: ['adv1'], armies: ['army1']}));
      const expectedFileName = 'new_save_unit.json';
      expect(mockUnitDataService.createUnitFile).toHaveBeenCalledWith(expectedFileName, jasmine.objectContaining({name: 'New Save Unit'}));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/units']);
      expect(component.prepareUnitDataForDisplay).not.toHaveBeenCalled(); // Not on success
    }));

    it('should call prepareUnitDataForSave, then validate, then save existing unit on success', fakeAsync(() => {
      component.unitFileName = 'existing_unit.json';
      component.unitData = { name: 'Existing Save Unit', type: 'solo', faction: 'faction1', advantages_display: 'adv1' };
      mockValidationService.validateUnit.and.returnValue(of({ success: true, errors: [] }));

      component.saveUnit();
      tick();

      expect(component['prepareUnitDataForSave']).toHaveBeenCalledBefore(mockValidationService.validateUnit);
      expect(mockValidationService.validateUnit).toHaveBeenCalledWith(jasmine.objectContaining({advantages: ['adv1']}));
      expect(mockUnitDataService.saveUnitData).toHaveBeenCalledWith('existing_unit.json', jasmine.objectContaining({name: 'Existing Save Unit'}));
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/units']);
    }));

    it('should set validationErrors and call prepareUnitDataForDisplay if validation fails', fakeAsync(() => {
      const errors = [{ path: 'name', message: 'Is Required' }];
      mockValidationService.validateUnit.and.returnValue(of({ success: false, errors: errors }));
      component.unitData = { name: '', advantages_display: 'adv1' }; // Invalid name

      component.saveUnit();
      tick();

      expect(component['prepareUnitDataForSave']).toHaveBeenCalled();
      expect(mockValidationService.validateUnit).toHaveBeenCalled();
      expect(mockUnitDataService.createUnitFile).not.toHaveBeenCalled();
      expect(mockUnitDataService.saveUnitData).not.toHaveBeenCalled();
      expect(component.validationErrors).toEqual(errors);
      expect(component.prepareUnitDataForDisplay).toHaveBeenCalled(); // Revert arrays for display
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));

    it('should handle error from createUnitFile and call prepareUnitDataForDisplay', fakeAsync(() => {
      component.unitFileName = null;
      component.unitData = { name: 'Create Fail Unit', type: 'solo', faction: 'faction1' };
      mockValidationService.validateUnit.and.returnValue(of({ success: true, errors: [] }));
      mockUnitDataService.createUnitFile.and.returnValue(throwError(() => new Error('Create failed')));

      component.saveUnit();
      tick();

      expect(mockUnitDataService.createUnitFile).toHaveBeenCalled();
      expect(component.validationErrors).toEqual([{path: 'create', message: 'Failed to create unit: Create failed'}]);
      expect(component.prepareUnitDataForDisplay).toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    }));
  });
});
