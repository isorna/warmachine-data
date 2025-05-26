import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { UnitListComponent } from './unit-list.component';
import { UnitDataService } from '../unit-data.service';
import { CommonModule } from '@angular/common';

// Mocks
class MockUnitDataService {
  listUnitFiles = jasmine.createSpy('listUnitFiles').and.returnValue(of(['file1.json', 'file2.json']));
  deleteUnitFile = jasmine.createSpy('deleteUnitFile').and.returnValue(of(undefined));
  // getUnitData, createUnitFile, saveUnitData are not directly used by UnitListComponent
}

describe('UnitListComponent', () => {
  let component: UnitListComponent;
  let fixture: ComponentFixture<UnitListComponent>;
  let mockUnitDataService: MockUnitDataService;
  let mockRouter: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule, // For async pipe and *ngFor
        RouterTestingModule.withRoutes([]), // Basic router testing setup
        UnitListComponent // Import the standalone component
      ],
      // declarations: [UnitListComponent], // Not needed for standalone
      providers: [
        { provide: UnitDataService, useClass: MockUnitDataService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UnitListComponent);
    component = fixture.componentInstance;
    mockUnitDataService = TestBed.inject(UnitDataService) as any;
    mockRouter = TestBed.inject(Router);
    spyOn(mockRouter, 'navigate').and.stub(); // Spy on router navigation
    
    // Reset spies for listUnitFiles before each test that might call ngOnInit
    // or ensure ngOnInit is explicitly called if needed.
    // mockUnitDataService.listUnitFiles.calls.reset(); 
    // This is better handled by calling fixture.detectChanges() only when needed.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call listUnitFiles on UnitDataService and populate unitFiles$', fakeAsync(() => {
      mockUnitDataService.listUnitFiles.and.returnValue(of(['test1.json', 'test2.json']));
      
      fixture.detectChanges(); // Triggers ngOnInit
      tick(); // Resolve observables

      expect(mockUnitDataService.listUnitFiles).toHaveBeenCalled();
      component.unitFiles$.subscribe(files => {
        expect(files).toEqual(['test1.json', 'test2.json']);
      });
      tick(); // Ensure subscription completes
    }));
  });

  describe('selectUnit', () => {
    it('should navigate to the edit route for the selected file', () => {
      const fileName = 'selected-unit.json';
      component.selectUnit(fileName);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/edit', fileName]);
    });
  });

  describe('createNewUnit', () => {
    it('should navigate to the new unit route', () => {
      component.createNewUnit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/new']);
    });
  });

  describe('deleteUnit', () => {
    beforeEach(() => {
      // Ensure listUnitFiles has a fresh spy for tests that might call it after delete
       mockUnitDataService.listUnitFiles.calls.reset();
       mockUnitDataService.listUnitFiles.and.returnValue(of(['file1.json', 'file2.json', 'deleted_later.json']));
    });
    
    it('should call deleteUnitFile on UnitDataService and refresh list if confirmed', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      mockUnitDataService.deleteUnitFile.and.returnValue(of(undefined));
      // Prepare a different list for the refresh call
      mockUnitDataService.listUnitFiles.and.returnValue(of(['file1.json', 'file2.json'])); 

      component.deleteUnit('todelete.json');
      tick(); // Complete the deleteUnitFile observable

      expect(window.confirm).toHaveBeenCalled();
      expect(mockUnitDataService.deleteUnitFile).toHaveBeenCalledWith('todelete.json');
      expect(mockUnitDataService.listUnitFiles).toHaveBeenCalled(); // To refresh the list

      component.unitFiles$.subscribe(files => {
         expect(files).toEqual(['file1.json', 'file2.json']); // Verifies list was "refreshed"
      });
      tick(); // Ensure subscription to unitFiles$ completes
    }));

    it('should NOT call deleteUnitFile if not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      
      component.deleteUnit('dontdelete.json');

      expect(window.confirm).toHaveBeenCalled();
      expect(mockUnitDataService.deleteUnitFile).not.toHaveBeenCalled();
      expect(mockUnitDataService.listUnitFiles).not.toHaveBeenCalled(); // List should not be refreshed
    });
    
    it('should log an error if deleteUnitFile fails (optional test)', fakeAsync(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'error'); // Spy on console.error
      const errorResponse = new Error('Deletion failed');
      mockUnitDataService.deleteUnitFile.and.returnValue(throwError(() => errorResponse));

      component.deleteUnit('faildelete.json');
      tick();

      expect(mockUnitDataService.deleteUnitFile).toHaveBeenCalledWith('faildelete.json');
      expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error deleting faildelete.json/), errorResponse);
      // List refresh might still be called depending on error handling placement,
      // but the main expectation is error logging.
      // Current code calls listUnitFiles even on error path if not handled before.
      // For this test, we assume the primary check is the error log.
      // expect(mockUnitDataService.listUnitFiles).not.toHaveBeenCalled(); // Or check it is called
    }));
  });
});
