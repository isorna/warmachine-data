import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing'; // Good practice for services with HttpClient
import { UnitDataService } from './unit-data.service';

describe('UnitDataService', () => {
  let service: UnitDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule] // Import HttpClientTestingModule
    });
    service = TestBed.inject(UnitDataService);

    // Reset mock data before each test to ensure test isolation
    // Accessing private members for testing purposes is sometimes necessary for mock data management.
    // A better way might be to have a resetMocks method in the service if used frequently.
    (service as any).mockUnitFiles = ['cryx.json', 'cygnar.json'];
    (service as any).mockUnitData = {
      'cryx.json': { name: 'Lich Lord Dekathus', faction: 'cryx', type: 'warcaster' },
      'cygnar.json': { name: 'Commander Coleman Stryker', faction: 'cygnar', type: 'warcaster' }
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('listUnitFiles', () => {
    it('should return the initial list of mock file names', (done) => {
      service.listUnitFiles().subscribe(files => {
        expect(files).toEqual(['cryx.json', 'cygnar.json']);
        done();
      });
    });
  });

  describe('getUnitData', () => {
    it('should return data for an existing file', (done) => {
      service.getUnitData('cryx.json').subscribe(data => {
        expect(data).toEqual({ name: 'Lich Lord Dekathus', faction: 'cryx', type: 'warcaster' });
        done();
      });
    });

    it('should return an empty object for a non-existent file', (done) => {
      service.getUnitData('nonexistent.json').subscribe(data => {
        expect(data).toEqual({});
        done();
      });
    });

    it('should return a deep copy of the data', (done) => {
      const fileName = 'cryx.json';
      service.getUnitData(fileName).subscribe(data1 => {
        expect(data1.name).toBe('Lich Lord Dekathus');
        data1.name = 'Modified Name'; // Modify the copy

        service.getUnitData(fileName).subscribe(data2 => {
          expect(data2.name).toBe('Lich Lord Dekathus'); // Original should be unchanged
          done();
        });
      });
    });
  });

  describe('createUnitFile', () => {
    it('should add a new file and its data to the mock store', (done) => {
      const newFileName = 'khador.json';
      const newUnitData = { name: 'Kommander Sorscha', faction: 'khador', type: 'warcaster' };

      service.createUnitFile(newFileName, newUnitData).subscribe(() => {
        service.listUnitFiles().subscribe(files => {
          expect(files).toContain(newFileName);
          // Check order if unshift is used
          expect(files[0]).toBe(newFileName); 
        });

        service.getUnitData(newFileName).subscribe(data => {
          expect(data).toEqual(newUnitData);
          // Ensure it's a deep copy
          expect(data).not.toBe(newUnitData); 
          done();
        });
      });
    });

    it('should overwrite existing data if file name already exists (as per current mock logic)', (done) => {
      const existingFileName = 'cryx.json';
      const updatedData = { name: 'Asphyxious the Hellbringer', faction: 'cryx', type: 'warcaster' };

      service.createUnitFile(existingFileName, updatedData).subscribe(() => {
        service.getUnitData(existingFileName).subscribe(data => {
          expect(data).toEqual(updatedData);
          done();
        });
      });
    });
  });

  describe('saveUnitData', () => {
    it('should update data for an existing file', (done) => {
      const fileNameToSave = 'cryx.json';
      const modifiedData = { name: 'Lich Lord Venethrax', faction: 'cryx', type: 'warcaster', points: 75 };

      service.saveUnitData(fileNameToSave, modifiedData).subscribe(() => {
        service.getUnitData(fileNameToSave).subscribe(data => {
          expect(data).toEqual(modifiedData);
          // Ensure it's a deep copy
          expect(data).not.toBe(modifiedData);
          done();
        });
      });
    });

    it('should add a new file if saving with a new file name (as per current mock logic)', (done) => {
        const newFileName = 'retribution.json';
        const newUnitData = { name: 'Garryth, Blade of Retribution', faction: 'retribution', type: 'warcaster' };

        service.saveUnitData(newFileName, newUnitData).subscribe(() => {
            service.listUnitFiles().subscribe(files => {
                expect(files).toContain(newFileName);
            });
            service.getUnitData(newFileName).subscribe(data => {
                expect(data).toEqual(newUnitData);
                done();
            });
        });
    });
  });

  describe('deleteUnitFile', () => {
    it('should remove an existing file and its data from the mock store', (done) => {
      const fileNameToDelete = 'cryx.json';

      // Verify it exists first
      service.getUnitData(fileNameToDelete).subscribe(data => {
        expect(data.name).toBe('Lich Lord Dekathus'); // Make sure we're deleting something real
      });

      service.deleteUnitFile(fileNameToDelete).subscribe(() => {
        service.listUnitFiles().subscribe(files => {
          expect(files).not.toContain(fileNameToDelete);
        });

        service.getUnitData(fileNameToDelete).subscribe(data => {
          expect(data).toEqual({}); // Or however your service handles deleted/non-existent files
          done();
        });
      });
    });

    it('should do nothing if trying to delete a non-existent file', (done) => {
      const initialFiles$ = service.listUnitFiles();
      let initialFilesLength = 0;
      initialFiles$.subscribe(files => initialFilesLength = files.length);


      service.deleteUnitFile('nonexistent.json').subscribe(() => {
        service.listUnitFiles().subscribe(files => {
          expect(files.length).toBe(initialFilesLength); // Length should be unchanged
          done();
        });
      });
    });
  });
});
