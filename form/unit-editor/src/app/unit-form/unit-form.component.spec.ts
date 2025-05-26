import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { UnitFormComponent } from './unit-form.component';
import { UnitDataService } from '../unit-data.service';
import { ValidationService } from '../validation.service';
import { CommonModule } from '@angular/common';

// Mocks
class MockUnitDataService {
  getUnitData = jasmine.createSpy('getUnitData').and.returnValue(of({}));
  createUnitFile = jasmine.createSpy('createUnitFile').and.returnValue(of(undefined));
  saveUnitData = jasmine.createSpy('saveUnitData').and.returnValue(of(undefined));
  // listUnitFiles and deleteUnitFile are not directly used by UnitFormComponent
}

class MockValidationService {
  validateUnit = jasmine.createSpy('validateUnit').and.returnValue({ success: true });
  // get...Schema methods not directly used by UnitFormComponent logic being tested here
}

describe('UnitFormComponent', () => {
  let component: UnitFormComponent;
  let fixture: ComponentFixture<UnitFormComponent>;
  let mockUnitDataService: MockUnitDataService;
  let mockValidationService: MockValidationService;
  let mockRouter: Router;
  let mockActivatedRoute: any;

  const cryxTestData = { name: 'Test Cryx Unit', type: 'solo', faction: 'cryx', points: 100 };

  beforeEach(async () => {
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({})) // Default to no params (new unit)
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        CommonModule, // CommonModule for pipes like 'json' and directives
        RouterTestingModule.withRoutes([]), // Basic router testing setup
        UnitFormComponent // Import the standalone component
      ],
      // declarations: [UnitFormComponent], // Not needed for standalone components
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
    spyOn(mockRouter, 'navigate').and.stub(); // Spy on router navigation
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization (ngOnInit)', () => {
    it('should initialize for a new unit if no fileName param', fakeAsync(() => {
      mockActivatedRoute.paramMap = of(convertToParamMap({}));
      fixture.detectChanges(); // Trigger ngOnInit
      tick(); // Complete observables
      
      expect(component.unitFileName).toBeNull();
      expect(component.unitData.name).toBe(''); // Default name for new unit
      expect(component.unitData.type).toBe('solo'); // Default type
      expect(component.unitData.faction).toBe('mercenaries'); // Default faction
      expect(mockUnitDataService.getUnitData).not.toHaveBeenCalled();
    }));

    it('should initialize for an existing unit if fileName param is present', fakeAsync(() => {
      mockActivatedRoute.paramMap = of(convertToParamMap({ fileName: 'cryx.json' }));
      mockUnitDataService.getUnitData.and.returnValue(of(cryxTestData));
      
      fixture.detectChanges(); // Trigger ngOnInit
      tick(); // Complete observables

      expect(component.unitFileName).toBe('cryx.json');
      expect(mockUnitDataService.getUnitData).toHaveBeenCalledWith('cryx.json');
      expect(component.unitData).toEqual(cryxTestData);
    }));

    it('should initialize with default structure if existing unit data is empty', fakeAsync(() => {
      mockActivatedRoute.paramMap = of(convertToParamMap({ fileName: 'empty.json' }));
      mockUnitDataService.getUnitData.and.returnValue(of({})); // Empty data
      
      fixture.detectChanges(); // Trigger ngOnInit
      tick();

      expect(component.unitFileName).toBe('empty.json');
      expect(mockUnitDataService.getUnitData).toHaveBeenCalledWith('empty.json');
      expect(component.unitData.name).toBe('');
      expect(component.unitData.type).toBe('solo'); // Default type if not in empty data
    }));
  });

  describe('saveUnit', () => {
    beforeEach(() => {
      fixture.detectChanges(); // Initial data binding and ngOnInit
    });

    it('should create a new unit if unitFileName is null and validation passes', () => {
      component.unitFileName = null;
      component.unitData = { name: 'New Unit', type: 'solo', faction: 'mercenaries', statistics: {} };
      mockValidationService.validateUnit.and.returnValue({ success: true });

      component.saveUnit();

      const expectedFileName = 'new_unit.json';
      expect(mockValidationService.validateUnit).toHaveBeenCalledWith(component.unitData);
      expect(mockUnitDataService.createUnitFile).toHaveBeenCalledWith(expectedFileName, component.unitData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/units']);
    });
    
    it('should save an existing unit if unitFileName is set and validation passes', () => {
      component.unitFileName = 'existing.json';
      component.unitData = { name: 'Existing Unit', type: 'warcaster', faction: 'cygnar', statistics: {} };
      mockValidationService.validateUnit.and.returnValue({ success: true });

      component.saveUnit();

      expect(mockValidationService.validateUnit).toHaveBeenCalledWith(component.unitData);
      expect(mockUnitDataService.saveUnitData).toHaveBeenCalledWith('existing.json', component.unitData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/units']);
    });

    it('should NOT create or save if unit name is missing for a new unit', () => {
      component.unitFileName = null;
      component.unitData = { name: '', type: 'solo', faction: 'mercenaries' }; // Empty name
      // Validation for name check is inside saveUnit before calling service.validateUnit
      
      component.saveUnit();

      expect(mockValidationService.validateUnit).not.toHaveBeenCalled(); // Should not reach here
      expect(mockUnitDataService.createUnitFile).not.toHaveBeenCalled();
      expect(component.validationErrors).toEqual([{ path: 'name', message: 'Unit name is required to create a file.' }]);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
    
    it('should set validationErrors and NOT save/create if validation fails', () => {
      const errors = [{ path: 'some.path', message: 'Is wrong' }];
      mockValidationService.validateUnit.and.returnValue({ success: false, errors: errors });
      component.unitData = { name: 'Bad Unit', type: 'solo' };

      component.saveUnit();

      expect(mockValidationService.validateUnit).toHaveBeenCalledWith(component.unitData);
      expect(mockUnitDataService.createUnitFile).not.toHaveBeenCalled();
      expect(mockUnitDataService.saveUnitData).not.toHaveBeenCalled();
      expect(component.validationErrors).toEqual(errors);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should default faction to "mercenaries" if not set when creating a new unit', () => {
        component.unitFileName = null;
        component.unitData = { name: 'Factionless Unit', type: 'solo', statistics: {} /* faction missing */ };
        mockValidationService.validateUnit.and.returnValue({ success: true });

        component.saveUnit();
        
        const expectedData = { ...component.unitData, faction: 'mercenaries' };
        const expectedFileName = 'factionless_unit.json';
        expect(mockUnitDataService.createUnitFile).toHaveBeenCalledWith(expectedFileName, expectedData);
    });
  });

  describe('getUnitTypes', () => {
    it('should return the expected array of unit types', () => {
      const expectedTypes = ['attachment', 'battleEngine', 'solo', 'structure', 'unit', 'warbeast', 'warcaster', 'warjack', 'warlock'];
      expect(component.getUnitTypes()).toEqual(expectedTypes);
    });
  });

  describe('onTypeChange', () => {
    it('should reset unitData structure but preserve name and faction', () => {
        component.unitData = { name: 'My Unit', type: 'solo', faction: 'cygnar', points: 5, someSoloProp: true };
        fixture.detectChanges();

        component.onTypeChange('warcaster');
        
        expect(component.unitData.type).toBe('warcaster');
        expect(component.unitData.name).toBe('My Unit');
        expect(component.unitData.faction).toBe('cygnar');
        expect(component.unitData.points).toBeUndefined(); // Points should be gone
        expect(component.unitData.someSoloProp).toBeUndefined(); // solo specific prop
        expect(component.unitData.feat).toBeDefined(); // warcaster prop
        expect(component.unitData.rackSlots).toBeDefined();
    });
  });

  describe('cancelEdit', () => {
    it('should navigate to /units', () => {
      component.cancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/units']);
    });
  });
});
