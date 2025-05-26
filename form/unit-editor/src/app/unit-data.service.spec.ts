import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UnitDataService } from './unit-data.service';

describe('UnitDataService', () => {
  let service: UnitDataService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UnitDataService]
    });
    service = TestBed.inject(UnitDataService);
    httpTestingController = TestBed.inject(HttpTestingController);

    // Reset mock data for non-HTTP methods before each test
    (service as any).mockUnitFiles = ['cryx.json', 'cygnar.json'];
    (service as any).mockUnitData = {
      'cryx.json': { name: 'Lich Lord Dekathus', faction: 'cryx', type: 'warcaster' },
      'cygnar.json': { name: 'Commander Stryker', faction: 'cygnar', type: 'warcaster' }
    };
  });

  afterEach(() => {
    // After every test, assert that there are no more pending requests.
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // --- Tests for existing mock-based CRUD operations ---
  describe('listUnitFiles (mock)', () => {
    it('should return the initial list of mock file names', (done) => {
      service.listUnitFiles().subscribe(files => {
        expect(files).toEqual(['cryx.json', 'cygnar.json']);
        done();
      });
    });
  });

  describe('getUnitData (mock)', () => {
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
  });

  describe('createUnitFile (mock)', () => {
    it('should add a new file and its data to the mock store', (done) => {
      const newFileName = 'khador.json';
      const newUnitData = { name: 'Kommander Sorscha', faction: 'khador', type: 'warcaster' };
      service.createUnitFile(newFileName, newUnitData).subscribe(() => {
        service.getUnitData(newFileName).subscribe(data => {
          expect(data).toEqual(newUnitData);
          done();
        });
      });
    });
  });

  describe('saveUnitData (mock)', () => {
    it('should update data for an existing file', (done) => {
      const fileNameToSave = 'cryx.json';
      const modifiedData = { name: 'Lich Lord Venethrax', faction: 'cryx', type: 'warcaster', points: 75 };
      service.saveUnitData(fileNameToSave, modifiedData).subscribe(() => {
        service.getUnitData(fileNameToSave).subscribe(data => {
          expect(data).toEqual(modifiedData);
          done();
        });
      });
    });
  });

  describe('deleteUnitFile (mock)', () => {
    it('should remove an existing file and its data from the mock store', (done) => {
      const fileNameToDelete = 'cryx.json';
      service.deleteUnitFile(fileNameToDelete).subscribe(() => {
        service.getUnitData(fileNameToDelete).subscribe(data => {
          expect(data).toEqual({});
          done();
        });
      });
    });
  });


  // --- Tests for new HTTP-based key-fetching methods ---
  describe('getArmyKeys (HTTP)', () => {
    it('should fetch and return army keys on success', (done) => {
      const mockArmyData = { 'armyA': {}, 'armyB': {} };
      service.getArmyKeys().subscribe(keys => {
        expect(keys).toEqual(['armyA', 'armyB']);
        done();
      });
      const req = httpTestingController.expectOne('assets/data/armies.json');
      expect(req.request.method).toEqual('GET');
      req.flush(mockArmyData);
    });

    it('should return empty array and log error on fetch failure for army keys', (done) => {
      spyOn(console, 'error');
      service.getArmyKeys().subscribe(keys => {
        expect(keys).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error fetching army keys:/), jasmine.any(Object));
        done();
      });
      const req = httpTestingController.expectOne('assets/data/armies.json');
      req.error(new ErrorEvent('network error'));
    });
  });

  describe('getFactionKeys (HTTP)', () => {
    it('should fetch and return faction keys on success', (done) => {
      const mockFactionData = { 'factionX': {}, 'factionY': {} };
      service.getFactionKeys().subscribe(keys => {
        expect(keys).toEqual(['factionX', 'factionY']);
        done();
      });
      const req = httpTestingController.expectOne('assets/data/factions.json');
      expect(req.request.method).toEqual('GET');
      req.flush(mockFactionData);
    });

    it('should return empty array and log error on fetch failure for faction keys', (done) => {
      spyOn(console, 'error');
      service.getFactionKeys().subscribe(keys => {
        expect(keys).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error fetching faction keys:/), jasmine.any(Object));
        done();
      });
      const req = httpTestingController.expectOne('assets/data/factions.json');
      req.error(new ErrorEvent('network error'));
    });
  });

  describe('getAdvantageKeys (HTTP)', () => {
    it('should fetch and return advantage keys on success', (done) => {
      const mockAdvantageData = { 'adv1': {}, 'adv2': {} };
      service.getAdvantageKeys().subscribe(keys => {
        expect(keys).toEqual(['adv1', 'adv2']);
        done();
      });
      const req = httpTestingController.expectOne('assets/data/advantages.json');
      expect(req.request.method).toEqual('GET');
      req.flush(mockAdvantageData);
    });

    it('should return empty array and log error on fetch failure for advantage keys', (done) => {
      spyOn(console, 'error');
      service.getAdvantageKeys().subscribe(keys => {
        expect(keys).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error fetching advantage keys:/), jasmine.any(Object));
        done();
      });
      const req = httpTestingController.expectOne('assets/data/advantages.json');
      req.error(new ErrorEvent('network error'));
    });
  });

  describe('getQualityKeys (HTTP)', () => {
    it('should fetch and return quality keys on success', (done) => {
      const mockQualityData = { 'qualX': {}, 'qualY': {} };
      service.getQualityKeys().subscribe(keys => {
        expect(keys).toEqual(['qualX', 'qualY']);
        done();
      });
      const req = httpTestingController.expectOne('assets/data/qualities.json');
      expect(req.request.method).toEqual('GET');
      req.flush(mockQualityData);
    });

    it('should return empty array and log error on fetch failure for quality keys', (done) => {
      spyOn(console, 'error');
      service.getQualityKeys().subscribe(keys => {
        expect(keys).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error fetching quality keys:/), jasmine.any(Object));
        done();
      });
      const req = httpTestingController.expectOne('assets/data/qualities.json');
      req.error(new ErrorEvent('network error'));
    });
  });

  describe('getRuleKeys (HTTP)', () => {
    it('should fetch and return rule keys on success', (done) => {
      const mockRuleData = { 'rule1': {}, 'ruleABC': {} };
      service.getRuleKeys().subscribe(keys => {
        expect(keys).toEqual(['rule1', 'ruleABC']);
        done();
      });
      const req = httpTestingController.expectOne('assets/data/rules.json');
      expect(req.request.method).toEqual('GET');
      req.flush(mockRuleData);
    });

    it('should return empty array and log error on fetch failure for rule keys', (done) => {
      spyOn(console, 'error');
      service.getRuleKeys().subscribe(keys => {
        expect(keys).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error fetching rule keys:/), jasmine.any(Object));
        done();
      });
      const req = httpTestingController.expectOne('assets/data/rules.json');
      req.error(new ErrorEvent('network error'));
    });
  });

  describe('getSpellKeys (HTTP)', () => {
    it('should fetch and return spell keys on success', (done) => {
      const mockSpellData = { 'spellFire': {}, 'spellIce': {} };
      service.getSpellKeys().subscribe(keys => {
        expect(keys).toEqual(['spellFire', 'spellIce']);
        done();
      });
      const req = httpTestingController.expectOne('assets/data/spells.json');
      expect(req.request.method).toEqual('GET');
      req.flush(mockSpellData);
    });

    it('should return empty array and log error on fetch failure for spell keys', (done) => {
      spyOn(console, 'error');
      service.getSpellKeys().subscribe(keys => {
        expect(keys).toEqual([]);
        expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching(/Error fetching spell keys:/), jasmine.any(Object));
        done();
      });
      const req = httpTestingController.expectOne('assets/data/spells.json');
      req.error(new ErrorEvent('network error'));
    });
  });
});
